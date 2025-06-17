import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Schema dasar untuk User
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = 'student'

# Schema untuk membuat user baru (input)
class UserCreate(UserBase):
    password: str

# Schema untuk menampilkan user (output)
class UserDisplay(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    # Semua field dibuat opsional (bisa None)
    # karena user mungkin hanya ingin mengupdate salah satu field saja.
    name: Optional[str] = None
    password: Optional[str] = None

class StatusResponse(BaseModel):
    # Bisa kita gunakan untuk respons delete atau pesan sukses lainnya.
    detail: str