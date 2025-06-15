import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base
from .slide import Slide

class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi ke User (pemilik) dan Slide
    owner = relationship("User")
    slides = relationship("Slide", back_populates="presentation", cascade="all, delete-orphan", order_by="Slide.page_number")