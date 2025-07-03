# backend/models/score.py

from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base
import uuid

from .session import Session

class Score(Base):
    __tablename__ = 'scores'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(UUID(as_uuid=True), ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False)
    
    # PERBAIKAN: Ganti user_sid dengan student_id
    student_id = Column(String, nullable=False) 
    student_name = Column(String, nullable=False)
    score = Column(Integer, default=0, nullable=False)

    session = relationship("Session", back_populates="scores")

    # Pastikan setiap siswa hanya punya satu skor per sesi
    __table_args__ = (UniqueConstraint('session_id', 'student_id', name='_session_student_uc'),)