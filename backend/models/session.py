import uuid
import secrets
import random
import string
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

def generate_session_code():
    """Menghasilkan kode sesi unik 6 karakter alfanumerik (huruf besar dan angka)."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id"), nullable=False)
    code = Column(String, unique=True, default=generate_session_code)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)