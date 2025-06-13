from fastapi import FastAPI
from .database import engine, Base
from .routers import auth, user

# Membuat semua tabel di database (jika belum ada)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EduSlide API",
    description="API for Interactive Educational Presentation System",
    version="0.1.0"
)

# Menyertakan router otentikasi
app.include_router(auth.router)
app.include_router(user.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSlide API"}