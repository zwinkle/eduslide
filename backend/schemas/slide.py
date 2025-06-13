import uuid
from pydantic import BaseModel
from typing import Optional, Any

class SlideBase(BaseModel):
    page_number: int
    content_url: Optional[str] = None
    interactive_type: Optional[str] = None
    settings: Optional[dict] = None

class SlideCreate(SlideBase):
    pass

class SlideDisplay(SlideBase):
    id: uuid.UUID
    presentation_id: uuid.UUID

    class Config:
        orm_mode = True