import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base

class Slide(Base):
    __tablename__ = "slides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    presentation_id = Column(UUID(as_uuid=True), ForeignKey("presentations.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content_url = Column(String) # URL ke gambar slide
    interactive_type = Column(String, nullable=True) # e.g., 'polling', 'word_cloud'
    settings = Column(JSON, nullable=True) # Pengaturan untuk aktivitas interaktif

    presentation = relationship("Presentation", back_populates="slides")