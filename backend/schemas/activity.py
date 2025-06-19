from pydantic import BaseModel, Field, validator
from typing import List

class QuizCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=255)
    options: List[str] = Field(..., min_items=2, max_items=8)
    correct_answer: str # Jawaban yang benar harus sama persis dengan salah satu teks di options

    # Validator untuk memastikan jawaban yang benar ada di dalam daftar pilihan
    @validator('correct_answer')
    def correct_answer_must_be_in_options(cls, v, values):
        if 'options' in values and v not in values['options']:
            raise ValueError('Correct answer must be one of the options')
        return v

class PollCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=255)
    options: List[str] = Field(..., min_items=2, max_items=8)

class WordCloudCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=255)

class BubbleArea(BaseModel):
    x: float = Field(..., ge=0, le=1)  # Koordinat x relatif (0-1)
    y: float = Field(..., ge=0, le=1)  # Koordinat y relatif (0-1)
    r: float = Field(..., gt=0, le=0.5) # Radius relatif (0-0.5)

class BubbleQuizCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=255)
    correct_areas: List[BubbleArea] = Field(..., min_items=1)