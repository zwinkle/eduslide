# backend/routers/file_serving.py

from fastapi import APIRouter, HTTPException, Request, Response
from starlette.responses import FileResponse, Response as StarletteResponse
from pathlib import Path
import os
import logging

router = APIRouter()

# Dapatkan direktori kerja saat ini dan gabungkan dengan 'uploads'
# Ini lebih andal daripada hanya menggunakan path relatif "uploads"
BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
UPLOADS_DIR = BASE_DIR / "uploads"

logger = logging.getLogger("uvicorn.error")

@router.options("/uploads/{file_path:path}")
async def options_uploaded_file(file_path: str, request: Request):
    # Debug: print request method and headers
    print("OPTIONS request for:", file_path)
    print("Headers:", request.headers)
    headers = {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type,Range",
    }
    return StarletteResponse(status_code=204, headers=headers)

@router.get("/uploads/{file_path:path}")
async def serve_uploaded_file(file_path: str, request: Request):
    """
    Endpoint ini secara aman menyajikan file dari direktori 'uploads'.
    Semua permintaan ke sini dijamin melewati CORSMiddleware.
    """
    try:
        logger.info(f"GET request for: {file_path}")
        logger.info(f"Headers: {request.headers}")
        # Gabungkan direktori uploads dengan path file yang diminta
        file_location = UPLOADS_DIR.joinpath(file_path).resolve()

        # Keamanan: Pastikan path yang diminta benar-benar berada di dalam UPLOADS_DIR
        if not file_location.is_file() or not str(file_location).startswith(str(UPLOADS_DIR.resolve())):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Buat respons file seperti biasa
        response = FileResponse(str(file_location))

        # ==========================================================
        # PERBAIKAN KUNCI: TAMBAHKAN HEADER SECARA MANUAL DI SINI
        # ==========================================================
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        # ==========================================================

        return response
    except Exception as e:
        print(f"Error serving file: {e}")
        raise HTTPException(status_code=404, detail="File not found")