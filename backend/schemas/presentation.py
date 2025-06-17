import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import List
from .slide import SlideDisplay

class PresentationBase(BaseModel):
    title: str

class PresentationCreate(PresentationBase):
    pass

class PresentationDisplay(PresentationBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Skema untuk menampilkan presentasi beserta semua slidenya
class PresentationWithSlides(PresentationDisplay):
    slides: List[SlideDisplay] = []