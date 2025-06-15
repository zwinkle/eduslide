# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

# Import yang dibutuhkan untuk handler
from .database import Base, engine, SessionLocal
from .models.slide import Slide
from .routers import auth, user, presentation, session

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

@sio.on('start_presentation')
async def start_presentation(sid, data):
    session_code = data.get('session_code')
    if not session_code: return
    print(f"--- START_PRESENTATION: Room {session_code} is starting. ---")
    await sio.emit('slide_changed', {'page_number': 1}, room=session_code)
    
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

    if not all([session_code, slide_id, option]): return

    # Cek apakah sesi dan poll ada
    if session_code in poll_results and slide_id in poll_results[session_code]:
        # Tambahkan suara
        if option in poll_results[session_code][slide_id]:
            poll_results[session_code][slide_id][option] += 1
            print(f"--- VOTE_SUBMITTED: from {sid} for option '{option}' in poll {slide_id} ---")
            
            # Siarkan hasil terbaru ke semua peserta di room
            updated_results = poll_results[session_code][slide_id]
            await sio.emit('update_poll_results', updated_results, room=session_code)

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