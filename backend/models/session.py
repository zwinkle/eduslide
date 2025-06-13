import uuid
import secrets
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

def generate_session_code():
    """Menghasilkan kode sesi unik 6 karakter alfanumerik."""
    return secrets.token_urlsafe(4).upper()

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id"), nullable=False)
    code = Column(String, unique=True, default=generate_session_code)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)