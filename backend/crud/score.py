# backend/crud/score.py

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.score import Score

def get_or_create_score(db: Session, session_id: uuid.UUID, user_sid: str, student_name: str) -> Score:
    db_score = db.query(Score).filter(Score.session_id == session_id, Score.user_sid == user_sid).first()
    
    if not db_score:
        db_score = Score(
            session_id=session_id,
            user_sid=user_sid,
            student_name=student_name,
            score=0
        )
        db.add(db_score)
        # Kita akan commit bersamaan dengan penambahan poin
        # db.commit() 
        # db.refresh(db_score)
    return db_score

def add_points(db: Session, session_id: uuid.UUID, user_sid: str, student_name: str, points: int):
    """
    Menambahkan poin ke skor siswa.
    """
    db_score = get_or_create_score(db, session_id, user_sid, student_name)
    
    # Tambahkan poin, default 0 jika skornya null
    db_score.score = (db_score.score or 0) + points
    
    # Commit semua perubahan (baik pembuatan user baru atau update skor) di sini
    db.commit()
    db.refresh(db_score)
    return db_score

def get_leaderboard(db: Session, session_id: uuid.UUID, limit: int = 10):
    """
    Mengambil daftar skor teratas untuk sebuah sesi.
    """
    return db.query(Score)\
             .filter(Score.session_id == session_id)\
             .order_by(desc(Score.score))\
             .limit(limit)\
             .all()