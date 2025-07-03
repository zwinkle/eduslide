import uuid
from sqlalchemy.orm import Session
from ..models.presentation import Presentation
from ..models.slide import Slide
from ..schemas.presentation import PresentationCreate
from ..schemas.activity import QuizCreate, PollCreate, WordCloudCreate, BubbleQuizCreate

def create_presentation(db: Session, presentation: PresentationCreate, owner_id: uuid.UUID):
    db_presentation = Presentation(
        title=presentation.title,
        owner_id=owner_id
    )
    db.add(db_presentation)
    db.commit()
    db.refresh(db_presentation)
    return db_presentation

def get_presentations_by_owner(db: Session, owner_id: uuid.UUID):
    return db.query(Presentation).filter(Presentation.owner_id == owner_id).all()

def get_presentation_by_id(db: Session, presentation_id: uuid.UUID, owner_id: uuid.UUID = None):
    """
    Mengambil presentasi berdasarkan ID.
    Jika owner_id diberikan, akan memfilter juga berdasarkan pemilik.
    Jika owner_id adalah None, hanya akan mencari berdasarkan ID presentasi.
    """
    query = db.query(Presentation).filter(Presentation.id == presentation_id)
    if owner_id:
        query = query.filter(Presentation.owner_id == owner_id)
    return query.first()

def update_presentation_title(db: Session, presentation: Presentation, new_title: str):
    presentation.title = new_title
    db.commit()
    db.refresh(presentation)
    return presentation

def delete_presentation(db: Session, presentation: Presentation):
    db.delete(presentation)
    db.commit()
    return presentation

def remove_slide_activity(db: Session, slide: Slide):
    slide.interactive_type = None
    slide.settings = None
    db.commit()
    db.refresh(slide)
    return slide

def set_slide_quiz(db: Session, slide: Slide, quiz_data: QuizCreate):
    slide.interactive_type = 'quiz'
    slide.settings = {
        "question": quiz_data.question,
        "options": quiz_data.options,
        "correct_answer": quiz_data.correct_answer
    }
    db.commit()
    db.refresh(slide)
    return slide

def set_slide_activity(db: Session, slide: Slide, poll_data: PollCreate):
    """
    Menyimpan konfigurasi polling ke slide yang spesifik.
    """
    # Tandai slide ini sebagai slide interaktif dengan tipe 'poll'
    slide.interactive_type = 'poll'
    
    # Simpan pertanyaan dan opsi ke dalam kolom JSON 'settings'
    slide.settings = {
        "question": poll_data.question,
        "options": poll_data.options
    }
    
    db.commit()
    db.refresh(slide)
    return slide

def set_slide_wordcloud(db: Session, slide: Slide, wordcloud_data: WordCloudCreate):
    slide.interactive_type = 'word_cloud'
    slide.settings = {"question": wordcloud_data.question}
    db.commit()
    db.refresh(slide)
    return slide

def set_slide_bubble_quiz(db: Session, slide: Slide, quiz_data: BubbleQuizCreate):
    slide.interactive_type = 'bubble_quiz'
    # Pydantic model perlu diubah ke dict sebelum disimpan ke JSONB
    slide.settings = quiz_data.dict()
    db.commit()
    db.refresh(slide)
    return slide