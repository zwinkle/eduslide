from sqlalchemy.orm import Session
from ..models import score as models
from ..schemas import score as schemas

def get_or_create_score(db: Session, session_id: str, student_id: str, student_name: str):
    score = db.query(models.Score).filter(
        models.Score.session_id == session_id,
        models.Score.student_id == student_id
    ).first()

    if not score:
        score = models.Score(
            session_id=session_id,
            student_id=student_id,
            student_name=student_name,
            score=0 # Gunakan 'score'
        )
        db.add(score)
        db.commit()
        db.refresh(score)
    return score

def add_points(db: Session, session_id: str, student_id: str, student_name: str, points_to_add: int):
    score = get_or_create_score(db, session_id, student_id, student_name)
    
    # PERBAIKAN: Tambahkan poin ke kolom 'score'
    score.score += points_to_add
    
    db.commit()
    db.refresh(score)
    return score

def get_leaderboard(db: Session, session_id: str):
    # PERBAIKAN: Urutkan berdasarkan kolom 'score'
    return db.query(models.Score).filter(models.Score.session_id == session_id).order_by(models.Score.score.desc()).all()