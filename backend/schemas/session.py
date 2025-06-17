import uuid
from pydantic import BaseModel
from datetime import datetime

class SessionDisplay(BaseModel):
    id: uuid.UUID
    presentation_id: uuid.UUID
    code: str
    start_time: datetime

    class Config:
        from_attributes = True