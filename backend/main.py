from fastapi import FastAPI
# BARU: Import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import auth, user, presentation

# Membuat semua tabel di database (jika belum ada)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduSlide API",
    description="API for Interactive Educational Presentation System",
    version="0.1.0"
)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Mengizinkan origin yang terdaftar
    allow_credentials=True,      # Mengizinkan cookie/credentials
    allow_methods=["*"],         # Mengizinkan semua method (GET, POST, dll)
    allow_headers=["*"],         # Mengizinkan semua header
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(presentation.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSlide API"}