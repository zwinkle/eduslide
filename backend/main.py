from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import random
import asyncio

# Import yang dibutuhkan untuk handler
from .database import Base, engine, SessionLocal
from .models.slide import Slide
from .routers import auth, file_serving, user, presentation, session, file_serving
from .crud import score as crud_score, session as crud_session, presentation as crud_presentation
from .schemas.score import ScoreDisplay

# Membuat tabel di database jika belum ada
Base.metadata.create_all(bind=engine)

# ====================================================================
# APLIKASI UTAMA DAN KONFIGURASI
# ====================================================================

# 1. Aplikasi FastAPI. Ini akan menangani semua rute HTTP.
app = FastAPI(title="EduSlide API")

# 2. Server Socket.IO.
# Kita berikan izin CORS di sini KHUSUS untuk handshake awal WebSocket.
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:5173"] 
)

# 3. Aplikasi Gabungan. Ini adalah titik masuk utama yang akan dijalankan Uvicorn.
# Ia akan secara cerdas mengarahkan lalu lintas ke 'sio' atau 'app' FastAPI.
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)


# 4. Middleware CORS untuk FastAPI.
# Ini PENTING dan HARUS ADA untuk endpoint seperti /auth/login, /presentations, dll.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================================================================
# DATABASE SEMENTARA (IN-MEMORY) UNTUK SESI LIVE
# ====================================================================
session_participants = {}
poll_results = {}
wordcloud_results = {}
bubble_quiz_results = {}
teacher_disconnect_timers = {}  # session_code -> asyncio.Task
teacher_sids = {}  # session_code -> teacher_sid

GRACE_PERIOD_SECONDS = 180  # 3 minutes

async def end_session_after_timeout(session_code):
    await asyncio.sleep(GRACE_PERIOD_SECONDS)
    # Check if teacher has reconnected
    if session_code in teacher_disconnect_timers:
        # End and delete session in DB
        db = SessionLocal()
        try:
            session_obj = crud_session.get_session_by_code(db, session_code)
            if session_obj:
                db.delete(session_obj)
                db.commit()
                print(f"Session {session_code} ended and deleted due to teacher not reconnecting.")
        finally:
            db.close()
        # Clean up timer
        del teacher_disconnect_timers[session_code]

# ====================================================================
# SEMUA EVENT HANDLER SOCKET.IO
# ====================================================================

@sio.event
async def connect(sid, environ):
    print(f"--- CONNECTED: {sid} ---")

@sio.on('teacher_join')
async def teacher_join(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    
    await sio.enter_room(sid, session_code)
    await sio.enter_room(sid, f"{session_code}_teacher")
    
    print(f"--- TEACHER JOINED: {sid} to rooms '{session_code}' and '{session_code}_teacher' ---")
    
    current_participants = list(session_participants.get(session_code, {}).values())
    await sio.emit('update_participant_list', {'participants': current_participants}, to=sid)

    db = SessionLocal()
    try:
        session_obj = crud_session.get_session_by_code(db, session_code)
        if session_obj:
            leaderboard = crud_score.get_leaderboard(db, session_obj.id)
            leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
            await sio.emit('update_leaderboard', leaderboard_data, to=sid)
    finally:
        db.close()

    # If there was a disconnect timer, cancel it
    if session_code in teacher_disconnect_timers:
        teacher_disconnect_timers[session_code].cancel()
        del teacher_disconnect_timers[session_code]

@sio.on('join_session')
async def join_session(sid, data):
    session_code = data.get('session_code')
    name = data.get('name', 'Anonymous')
    # PERBAIKAN: Terima student_id dari klien
    student_id = data.get('student_id')

    if not all([session_code, name, student_id]): 
        print("Join attempt failed: missing data")
        return
    
    await sio.enter_room(sid, session_code)
    print(f"--- STUDENT JOINED: {sid} ({name}, ID: {student_id}) to room {session_code} ---")

    if session_code not in session_participants:
        session_participants[session_code] = {}
    
    session_participants[session_code][sid] = {"name": name, "student_id": student_id}

    updated_participants = list(session_participants[session_code].values())
    await sio.emit('update_participant_list', {'participants': updated_participants}, room=f"{session_code}_teacher")
    await sio.emit('join_success', {'message': f"Successfully joined room {session_code}"}, to=sid)

    db = SessionLocal()
    try:
        session_obj = crud_session.get_session_by_code(db, session_code)
        if session_obj:
            leaderboard = crud_score.get_leaderboard(db, session_obj.id)
            leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
            await sio.emit('update_leaderboard', leaderboard_data, to=sid)
    finally:
        db.close()

@sio.event
async def disconnect(sid):
    print(f"--- DISCONNECTED: {sid} ---")
    is_teacher = False
    disconnected_session_code = None

    for session_code, teacher_sid in list(teacher_sids.items()):
        if sid == teacher_sid:
            is_teacher = True
            disconnected_session_code = session_code
            del teacher_sids[session_code]
            break

    if is_teacher:
        print(f"--- TEACHER DISCONNECTED from session {disconnected_session_code} ---")
        if disconnected_session_code not in teacher_disconnect_timers:
            teacher_disconnect_timers[disconnected_session_code] = asyncio.create_task(end_session_after_timeout(disconnected_session_code))
    else:
        for session_code, participants_dict in list(session_participants.items()):
            if sid in participants_dict:
                del session_participants[session_code][sid]
                # PERBAIKAN: Kirim list of objects
                updated_participants = list(participants_dict.values())
                await sio.emit('update_participant_list', {'participants': updated_participants}, room=f"{session_code}_teacher")
                print(f"--- CLEANUP: Removed {sid} from room {session_code} ---")
                break

@sio.on('start_presentation')
async def start_presentation(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    print(f"--- START_PRESENTATION: Room {session_code} is starting. ---")
    await sio.emit('slide_changed', {'page_number': 1}, room=session_code)

@sio.on('change_slide')
async def change_slide(sid, data):
    session_code = data.get('session_code')
    page_number = data.get('page_number')
    await sio.emit('slide_changed', {'page_number': page_number}, room=session_code, skip_sid=sid)

@sio.on('end_session')
async def end_session(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    
    print(f"--- END_SESSION: Room {session_code} is ending. ---")
    
    # Update database untuk mencatat waktu berakhir
    db = SessionLocal()
    try:
        crud_session.end_session_by_code(db, session_code)
    finally:
        db.close()

    await sio.emit('session_ended', {'message': 'The teacher has ended the session.'}, room=session_code)
    
    # Hapus semua data sesi dari memori
    if session_code in session_participants: del session_participants[session_code]
    if session_code in poll_results: del poll_results[session_code]
    if session_code in wordcloud_results: del wordcloud_results[session_code]
    if session_code in bubble_quiz_results: del bubble_quiz_results[session_code]

# --- HANDLER UNTUK AKTIVITAS ---

@sio.on('start_quiz')
async def start_quiz(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id: return
    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'quiz':
            quiz_for_student = {"question": slide.settings.get('question'), "options": slide.settings.get('options')}
            await sio.emit('quiz_started', quiz_for_student, room=session_code)
    finally:
        db.close()

@sio.on('submit_quiz_answer')
async def submit_quiz_answer(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    answer = data.get('answer')
    
    participant = session_participants.get(session_code, {}).get(sid)
    if not participant: return
    student_id = participant['student_id']
    student_name = participant['name']

    if not all([session_code, slide_id, answer]): return

    db = SessionLocal()
    try:
        session = crud_session.get_session_by_code(db, session_code)
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if not session or not slide or slide.interactive_type != 'quiz': return
        
        is_correct = (slide.settings.get('correct_answer') == answer)
        await sio.emit('quiz_feedback', {'correct': is_correct}, to=sid)

        if is_correct:
            crud_score.add_points(db, session.id, student_id, student_name, 100)
        
        leaderboard = crud_score.get_leaderboard(db, session.id)
        leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
        await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
    finally:
        db.close()
    
@sio.on('start_poll')
async def start_poll(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id: return
    if session_code not in poll_results: poll_results[session_code] = {}
    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'poll':
            options = slide.settings.get('options', [])
            poll_results[session_code][slide_id] = {opt: 0 for opt in options}
            await sio.emit('poll_started', slide.settings, room=session_code)
            await sio.emit('update_poll_results', poll_results[session_code][slide_id], room=session_code)
    finally:
        db.close()

@sio.on('submit_vote')
async def submit_vote(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    option = data.get('option')

    participant = session_participants.get(session_code, {}).get(sid)
    if not participant: return
    student_id = participant['student_id']
    student_name = participant['name']
    
    if not all([session_code, slide_id, option]): return

    if session_code in poll_results and slide_id in poll_results[session_code] and option in poll_results[session_code][slide_id]:
        poll_results[session_code][slide_id][option] += 1
        await sio.emit('update_poll_results', poll_results[session_code][slide_id], room=session_code)
        
        db = SessionLocal()
        try:
            session = crud_session.get_session_by_code(db, session_code)
            if session:
                crud_score.add_points(db, session.id, student_id, student_name, 10)
                leaderboard = crud_score.get_leaderboard(db, session.id)
                leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
                await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
        finally:
            db.close()

@sio.on('start_wordcloud')
async def start_wordcloud(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id: return
    if session_code not in wordcloud_results: wordcloud_results[session_code] = {}
    wordcloud_results[session_code][slide_id] = []
    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'word_cloud':
            await sio.emit('wordcloud_started', slide.settings, room=session_code)
            await sio.emit('update_wordcloud_results', [], room=session_code)
    finally:
        db.close()

@sio.on('submit_word')
async def submit_word(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    word = data.get('word', '').strip().lower()

    participant = session_participants.get(session_code, {}).get(sid)
    if not participant: return
    student_id = participant['student_id']
    student_name = participant['name']

    if not all([session_code, slide_id, word]): return

    if session_code in wordcloud_results and slide_id in wordcloud_results[session_code]:
        wordcloud_results[session_code][slide_id].append(word)
        await sio.emit('update_wordcloud_results', wordcloud_results[session_code][slide_id], room=session_code)
        
        db = SessionLocal()
        try:
            session = crud_session.get_session_by_code(db, session_code)
            if session:
                crud_score.add_points(db, session.id, student_id, student_name, 15)
                leaderboard = crud_score.get_leaderboard(db, session.id)
                leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
                await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
        finally:
            db.close()

@sio.on('start_bubble_quiz')
async def start_bubble_quiz(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id: return
    if session_code not in bubble_quiz_results: bubble_quiz_results[session_code] = {}
    bubble_quiz_results[session_code][slide_id] = []
    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'bubble_quiz':
            await sio.emit('bubble_quiz_started', {"question": slide.settings.get('question')}, room=session_code)
    finally:
        db.close()

@sio.on('submit_bubble_click')
async def submit_bubble_click(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    point = data.get('point')
    
    participant = session_participants.get(session_code, {}).get(sid)
    if not participant: return
    student_id = participant['student_id']
    student_name = participant['name']

    if not all([session_code, slide_id, point]): return

    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if not slide or slide.interactive_type != 'bubble_quiz': return
        
        is_correct = False
        for area in slide.settings.get('correct_areas', []):
            distance = ((point['x'] - area['x'])**2 + (point['y'] - area['y'])**2)**0.5
            if distance <= area['r']:
                is_correct = True
                break
        
        if session_code in bubble_quiz_results and slide_id in bubble_quiz_results[session_code]:
            bubble_quiz_results[session_code][slide_id].append({"name": student_name, "x": point['x'], "y": point['y'], "is_correct": is_correct})
        
        if is_correct:
            session = crud_session.get_session_by_code(db, session_code)
            if session: crud_score.add_points(db, session.id, student_id, student_name, 75)
        
        all_clicks = bubble_quiz_results.get(session_code, {}).get(slide_id, [])
        leaderboard = crud_score.get_leaderboard(db, session.id)
        leaderboard_data = [ScoreDisplay.model_validate(s).model_dump() for s in leaderboard]
        await sio.emit('update_bubble_quiz_results', {'clicks': all_clicks}, room=session_code)
        await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
    finally:
        db.close()


@sio.on('pick_random_student')
async def pick_random_student(sid, data):
    session_code = data.get('session_code')
    if not session_code or session_code not in session_participants: return
    participants_list = list(session_participants[session_code].values())
    if not participants_list: return
    winner = random.choice(participants_list)
    await sio.emit('student_picked', {'winner': winner, 'participants': participants_list}, room=session_code)

@sio.on('start_drawing')
async def start_drawing(sid, data):
    session_code = data.get('session_code')
    slide_id = data.get('slide_id')
    if not session_code: return
    await sio.emit('drawing_started', {'lines': data.get('lines', []), 'slide_id': slide_id}, room=session_code, skip_sid=sid)

@sio.on('hide_drawing')
async def hide_drawing(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    await sio.emit('drawing_hidden', room=session_code, skip_sid=sid)

@sio.on('drawing_event')
async def drawing_event(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    await sio.emit('update_drawing', data, room=session_code, skip_sid=sid)

@sio.on('clear_canvas')
async def clear_canvas(sid, data):
    session_code = data.get('session_code')
    slide_id = data.get('slide_id')
    if not session_code or not slide_id: return
    await sio.emit('canvas_cleared', {'slide_id': slide_id}, room=session_code, skip_sid=sid)

# ====================================================================
# ROUTER DAN STATIC FILES UNTUK APLIKASI FASTAPI
# ====================================================================
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(presentation.router)
app.include_router(session.router)
app.include_router(file_serving.router)

@app.get("/")
def read_root():
    print("Root endpoint hit")
    return {"message": "Welcome to EduSlide API"}