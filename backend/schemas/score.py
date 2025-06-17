# backend/schemas/score.py

from pydantic import BaseModel

class ScoreBase(BaseModel):
    student_name: str
    score: int

class ScoreDisplay(ScoreBase):
    class Config:
        from_attributes = True