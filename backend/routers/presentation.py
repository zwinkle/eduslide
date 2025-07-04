from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import shutil
from pathlib import Path
from pdf2image import convert_from_path
import io
import qrcode
from starlette.responses import StreamingResponse
import os

from ..database import get_db
from ..models.user import User
from ..models.slide import Slide
from ..schemas.presentation import PresentationCreate, PresentationDisplay, PresentationWithSlides
from ..schemas.session import SessionDisplay
from ..schemas.activity import QuizCreate, PollCreate, WordCloudCreate, BubbleQuizCreate
from ..schemas.slide import SlideDisplay
from ..crud import presentation as crud_presentation
from ..crud import session as crud_session
from ..utils.security import get_current_user


router = APIRouter(
    prefix="/presentations",
    tags=["Presentations"]
)

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
UPLOAD_DIRECTORY = BASE_DIR / "uploads"
UPLOAD_DIRECTORY.mkdir(exist_ok=True)

@router.post("/", response_model=PresentationDisplay, status_code=status.HTTP_201_CREATED)
def create_new_presentation(
    presentation: PresentationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can create presentations")
    return crud_presentation.create_presentation(db=db, presentation=presentation, owner_id=current_user.id)

@router.get("/", response_model=List[PresentationWithSlides])
def get_user_presentations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_presentation.get_presentations_by_owner(db=db, owner_id=current_user.id)

@router.get("/{presentation_id}", response_model=PresentationWithSlides)
def get_single_presentation(
    presentation_id: uuid.UUID,
    db: Session = Depends(get_db)
    # HAPUS 'current_user' dari sini karena endpoint ini sekarang publik
):
    # Panggil fungsi tanpa owner_id
    presentation = crud_presentation.get_presentation_by_id(db=db, presentation_id=presentation_id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return presentation

@router.put("/{presentation_id}", response_model=PresentationDisplay)
def update_presentation(
    presentation_id: uuid.UUID,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    presentation = crud_presentation.get_presentation_by_id(db, presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found or you don't have access")
    return crud_presentation.update_presentation_title(db, presentation, title)


@router.delete("/{presentation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_presentation(
    presentation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    presentation = crud_presentation.get_presentation_by_id(db, presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    crud_presentation.delete_presentation(db, presentation)
    return

@router.delete("/slides/{slide_id}/activity", response_model=SlideDisplay)
def delete_slide_activity(
    slide_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    presentation = crud_presentation.get_presentation_by_id(db, slide.presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this slide")

    updated_slide = crud_presentation.remove_slide_activity(db, slide)
    return updated_slide

@router.post("/{presentation_id}/upload", response_model=PresentationWithSlides)
def upload_pdf_and_create_slides(
    presentation_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    presentation = crud_presentation.get_presentation_by_id(db, presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found or you are not the owner")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF is allowed.")
        
    # Buat path unik untuk menyimpan file
    presentation_upload_dir = UPLOAD_DIRECTORY / str(presentation_id)
    presentation_upload_dir.mkdir(exist_ok=True)
    file_path = presentation_upload_dir / file.filename
    
    # Simpan file PDF yang diupload
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Konversi PDF ke gambar
    try:
        # Hapus slide lama jika ada
        db.query(Slide).filter(Slide.presentation_id == presentation_id).delete()
        
        # Konversi PDF ke gambar
        images = convert_from_path(file_path)
        
        for i, image in enumerate(images):
            slide_image_path = presentation_upload_dir / f"slide_{i+1}.png"
            image.save(slide_image_path, "PNG")
            
            # Store only the relative web path in content_url
            new_slide = Slide(
                presentation_id=presentation_id,
                page_number=i+1,
                content_url=f"uploads/{presentation_id}/slide_{i+1}.png"
            )
            db.add(new_slide)
            
        db.commit()
        db.refresh(presentation)
        return presentation
    except Exception as e:
        # Hapus file jika terjadi error
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")
    
@router.post("/{presentation_id}/sessions", response_model=SessionDisplay)
def create_new_session(
    presentation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    presentation = crud_presentation.get_presentation_by_id(db, presentation_id, current_user.id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return crud_session.create_session(db=db, presentation_id=presentation_id)

@router.get("/sessions/{session_code}/qr", response_class=StreamingResponse)
def get_session_qr_code(session_code: str):
    # Buat URL yang akan di-encode di QR Code
    # Arahkan ke halaman join di frontend Anda
    join_url = f"http://localhost:5173/join/{session_code}"
    
    img = qrcode.make(join_url)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@router.post("/slides/{slide_id}/quiz", response_model=SlideDisplay)
def add_quiz_activity_to_slide(
    slide_id: uuid.UUID,
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    presentation = crud_presentation.get_presentation_by_id(db, slide.presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this slide")

    updated_slide = crud_presentation.set_slide_quiz(db, slide, quiz_data)
    return updated_slide

@router.post("/slides/{slide_id}/activity", response_model=SlideDisplay)
def add_activity_to_slide(
    slide_id: uuid.UUID,
    poll_data: PollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menambahkan aktivitas (saat ini hanya polling) ke sebuah slide.
    Endpoint ini diproteksi dan memerlukan hak akses pemilik.
    """
    # Pertama, ambil slide berdasarkan ID-nya
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    # Kemanan: Pastikan user yang login adalah pemilik presentasi dari slide ini
    # Kita panggil get_presentation_by_id dengan menyertakan owner_id
    presentation = crud_presentation.get_presentation_by_id(
        db, 
        presentation_id=slide.presentation_id, 
        owner_id=current_user.id
    )
    if not presentation:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this slide")

    # Jika aman, panggil fungsi CRUD untuk menyimpan data aktivitas
    updated_slide = crud_presentation.set_slide_activity(db, slide, poll_data)
    return updated_slide

@router.post("/slides/{slide_id}/wordcloud", response_model=SlideDisplay)
def add_wordcloud_activity_to_slide(
    slide_id: uuid.UUID,
    wordcloud_data: WordCloudCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    presentation = crud_presentation.get_presentation_by_id(db, slide.presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this slide")

    updated_slide = crud_presentation.set_slide_wordcloud(db, slide, wordcloud_data)
    return updated_slide

@router.post("/slides/{slide_id}/bubble-quiz", response_model=SlideDisplay)
def add_bubble_quiz_activity_to_slide(
    slide_id: uuid.UUID,
    quiz_data: BubbleQuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=404, detail="Slide not found")

    presentation = crud_presentation.get_presentation_by_id(db, slide.presentation_id, owner_id=current_user.id)
    if not presentation:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this slide")

    updated_slide = crud_presentation.set_slide_bubble_quiz(db, slide, quiz_data)
    return updated_slide