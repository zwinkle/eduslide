# backend/models/score.py

import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class Score(Base):
    __tablename__ = "scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    
    # Karena siswa anonim, kita gunakan Socket.IO SID sebagai pengenal unik sementara
    user_sid = Column(String, nullable=False, index=True) 
    
    student_name = Column(String, nullable=False)
    score = Column(Integer, default=0, nullable=False)