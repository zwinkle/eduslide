from pydantic import BaseModel
import uuid

class ScoreBase(BaseModel):
    student_name: str
    # Pastikan nama field di sini adalah 'score'
    score: int

class ScoreDisplay(ScoreBase):
    student_id: str # Kirim juga student_id untuk identifikasi unik

    class Config:
        from_attributes = True