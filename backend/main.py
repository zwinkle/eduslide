# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
import random

# Import yang dibutuhkan untuk handler
from .database import Base, engine, SessionLocal
from .models.slide import Slide
from .routers import auth, user, presentation, session
from .crud import score as crud_score, session as crud_session
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
# SEMUA EVENT HANDLER SOCKET.IO
# ====================================================================
session_participants = {}
poll_results = {}
wordcloud_results = {}

@sio.event
async def connect(sid, environ):
    print(f"--- CONNECTED: {sid} ---")

@sio.on('teacher_join')
async def teacher_join(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    
    await sio.enter_room(sid, session_code) # <-- Room utama untuk menerima broadcast umum
    await sio.enter_room(sid, f"{session_code}_teacher") # <-- Room khusus untuk menerima update lobi
    
    print(f"--- TEACHER JOINED: {sid} to rooms '{session_code}' and '{session_code}_teacher' ---")
    
    current_participants = list(session_participants.get(session_code, {}).values())
    await sio.emit('update_participant_list', {'participants': current_participants}, to=sid)

@sio.on('join_session')
async def join_session(sid, data):
    session_code = data.get('session_code')
    name = data.get('name', 'Anonymous')
    if not session_code: return
    
    await sio.enter_room(sid, session_code)
    print(f"--- STUDENT JOINED: {sid} ({name}) to room {session_code} ---")

    if session_code not in session_participants:
        session_participants[session_code] = {}
    session_participants[session_code][sid] = name

    updated_participants = list(session_participants[session_code].values())
    await sio.emit('update_participant_list', {'participants': updated_participants}, room=f"{session_code}_teacher")
    await sio.emit('join_success', {'message': f"Successfully joined room {session_code}"}, to=sid)

    db = SessionLocal()
    try:
        session = crud_session.get_session_by_code(db, session_code)
        if session:
            leaderboard = crud_score.get_leaderboard(db, session.id)
            leaderboard_data = [ScoreDisplay.from_orm(s).dict() for s in leaderboard]
            # Kirim hanya ke siswa yang baru bergabung
            await sio.emit('update_leaderboard', leaderboard_data, to=sid)
    finally:
        db.close()

@sio.on('start_presentation')
async def start_presentation(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    print(f"--- START_PRESENTATION: Room {session_code} is starting. ---")
    await sio.emit('slide_changed', {'page_number': 1}, room=session_code)

@sio.on('submit_quiz_answer')
async def submit_quiz_answer(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    answer = data.get('answer')
    student_name = data.get('name') # Ambil nama siswa dari data

    # Tambahkan juga sid ke data yang dikirim dari frontend
    user_sid = sid 

    if not all([session_code, slide_id, answer, student_name, user_sid]):
        return
    
    db = SessionLocal()
    try:
        session = crud_session.get_session_by_code(db, session_code)
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        
        if not session or not slide or slide.interactive_type != 'quiz':
            return
        
        is_correct = (slide.settings.get('correct_answer') == answer)
        
        # Kirim feedback personal ke siswa TERLEBIH DAHULU
        await sio.emit('quiz_feedback', {'correct': is_correct}, to=sid)

        if is_correct:
            points_to_add = 100
            # Panggil fungsi untuk menambah poin
            crud_score.add_points(db, session.id, user_sid, student_name, points_to_add)
            print(f"--- QUIZ_CORRECT: {student_name} got {points_to_add} points. ---")
        
        # Setelah skor DIJAMIN sudah di-commit, BARU kita ambil dan siarkan leaderboard
        leaderboard = crud_score.get_leaderboard(db, session.id)
        leaderboard_data = [ScoreDisplay.from_orm(s).dict() for s in leaderboard]
        
        print(f"--- BROADCASTING LEADERBOARD: {leaderboard_data} ---") # Log untuk debug
        
        await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
        
    finally:
        db.close()

@sio.on('start_quiz')
async def start_quiz(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id:
        return

    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        # Kirim pertanyaan dan opsi (TANPA jawaban benar) ke siswa
        if slide and slide.interactive_type == 'quiz':
            print(f"--- START_QUIZ: Teacher {sid} starting quiz for slide {slide_id} in room {session_code} ---")
            
            # Buat objek kuis untuk dikirim ke siswa
            quiz_for_student = {
                "question": slide.settings.get('question'),
                "options": slide.settings.get('options')
            }
            await sio.emit('quiz_started', quiz_for_student, room=session_code)
    finally:
        db.close()
    
@sio.on('start_poll')
async def start_poll(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id')) # Jadikan string untuk kunci dictionary
    if not session_code or not slide_id: return

    # Inisialisasi tempat penyimpanan hasil vote untuk poll ini
    if session_code not in poll_results:
        poll_results[session_code] = {}
    
    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'poll':
            print(f"--- START_POLL: Teacher {sid} starting poll for slide {slide_id} in room {session_code} ---")
            
            # Siapkan struktur hasil vote dengan nilai awal 0
            options = slide.settings.get('options', [])
            poll_results[session_code][slide_id] = {opt: 0 for opt in options}
            
            # Kirim pertanyaan dan opsi ke semua siswa di room
            await sio.emit('poll_started', slide.settings, room=session_code)
            # Kirim juga hasil awal (semua 0) ke semua peserta
            await sio.emit('update_poll_results', poll_results[session_code][slide_id], room=session_code)
    finally:
        db.close()

@sio.on('submit_vote')
async def submit_vote(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    option = data.get('option')
    student_name = session_participants.get(session_code, {}).get(sid)

    if not all([session_code, slide_id, option, student_name]): return

    if session_code in poll_results and slide_id in poll_results[session_code]:
        if option in poll_results[session_code][slide_id]:
            poll_results[session_code][slide_id][option] += 1
            updated_results = poll_results[session_code][slide_id]
            await sio.emit('update_poll_results', updated_results, room=session_code)
            
            # Berikan Poin Partisipasi
            db = SessionLocal()
            try:
                session = crud_session.get_session_by_code(db, session_code)
                crud_score.add_points(db, session.id, sid, student_name, 10) # +10 poin
                leaderboard = crud_score.get_leaderboard(db, session.id)
                leaderboard_data = [ScoreDisplay.from_orm(s).dict() for s in leaderboard]
                await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
            finally:
                db.close()

@sio.on('start_wordcloud')
async def start_wordcloud(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    if not session_code or not slide_id: return

    # Inisialisasi tempat penyimpanan hasil
    if session_code not in wordcloud_results:
        wordcloud_results[session_code] = {}
    wordcloud_results[session_code][slide_id] = {}

    db = SessionLocal()
    try:
        slide = db.query(Slide).filter(Slide.id == slide_id).first()
        if slide and slide.interactive_type == 'word_cloud':
            print(f"--- START_WORDCLOUD: In room {session_code} ---")
            # Kirim pertanyaan ke semua siswa
            await sio.emit('wordcloud_started', slide.settings, room=session_code)
            # Kirim hasil awal (kosong)
            await sio.emit('update_wordcloud_results', {}, room=session_code)
    finally:
        db.close()

@sio.on('submit_word')
async def submit_word(sid, data):
    session_code = data.get('session_code')
    slide_id = str(data.get('slide_id'))
    word = data.get('word', '').strip().lower()
    student_name = session_participants.get(session_code, {}).get(sid)

    if not all([session_code, slide_id, word, student_name]): return

    if session_code in wordcloud_results and slide_id in wordcloud_results[session_code]:
        current_results = wordcloud_results[session_code][slide_id]
        current_results[word] = current_results.get(word, 0) + 1
        await sio.emit('update_wordcloud_results', current_results, room=session_code)

        # Berikan Poin Partisipasi
        db = SessionLocal()
        try:
            session = crud_session.get_session_by_code(db, session_code)
            crud_score.add_points(db, session.id, sid, student_name, 15) # +15 poin
            leaderboard = crud_score.get_leaderboard(db, session.id)
            leaderboard_data = [ScoreDisplay.from_orm(s).dict() for s in leaderboard]
            await sio.emit('update_leaderboard', leaderboard_data, room=session_code)
        finally:
            db.close()

@sio.on('pick_random_student')
async def pick_random_student(sid, data):
    session_code = data.get('session_code')
    if not session_code or session_code not in session_participants:
        return

    participants_list = list(session_participants[session_code].values())
    if not participants_list:
        return

    winner = random.choice(participants_list)
    print(f"--- RANDOM PICK: Winner in room {session_code} is {winner} ---")
    
    # Kirim nama pemenang DAN seluruh daftar peserta untuk animasi
    await sio.emit('student_picked', {
        'winner': winner,
        'participants': participants_list
    }, room=session_code)

@sio.on('start_drawing')
async def start_drawing(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    
    # PERBAIKAN: Kirim payload berisi array 'lines' kosong.
    # Ini memastikan frontend selalu menerima objek dengan properti 'lines'.
    await sio.emit('drawing_started', {'lines': []}, room=session_code, skip_sid=sid)

@sio.on('hide_drawing')
async def hide_drawing(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    await sio.emit('drawing_hidden', room=session_code, skip_sid=sid)

@sio.on('drawing_event')
async def drawing_event(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    # Teruskan data gambar ke semua peserta lain di room
    # Frontend sudah mengirim 'drawData' yang berisi 'line' dan 'slide_id'
    await sio.emit('update_drawing', data, room=session_code, skip_sid=sid)

@sio.on('clear_canvas')
async def clear_canvas(sid, data):
    session_code = data.get('session_code')
    slide_id = data.get('slide_id')
    if not session_code or not slide_id: return
    print(f"--- CLEAR_CANVAS: In room {session_code} for slide {slide_id} ---")
    await sio.emit('canvas_cleared', {'slide_id': slide_id}, room=session_code, skip_sid=sid)

@sio.on('change_slide')
async def change_slide(sid, data):
    session_code = data.get('session_code')
    page_number = data.get('page_number')
    print(f"--- CHANGE_SLIDE: To page {page_number} for room {session_code} ---")
    await sio.emit('slide_changed', {'page_number': page_number}, room=session_code, skip_sid=sid)

@sio.on('end_session')
async def end_session(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    print(f"--- END_SESSION: Room {session_code} is ending. ---")
    await sio.emit('session_ended', {'message': 'The teacher has ended the session.'}, room=session_code)
    if session_code in session_participants:
        del session_participants[session_code]

@sio.event
async def disconnect(sid):
    print(f"--- DISCONNECTED: {sid} ---")
    for session_code, participants_dict in list(session_participants.items()):
        if sid in participants_dict:
            del session_participants[session_code][sid]
            updated_participants = list(session_participants[session_code].values())
            await sio.emit('update_participant_list', {'participants': updated_participants}, room=f"{session_code}_teacher")
            print(f"--- CLEANUP: Removed {sid} from room {session_code} ---")
            break

# ====================================================================
# ROUTER DAN STATIC FILES UNTUK APLIKASI FASTAPI
# ====================================================================
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(presentation.router)
app.include_router(session.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSlide API"}