import uuid
from sqlalchemy.orm import Session
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate
from ..utils.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    """Mencari user berdasarkan email."""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    """Membuat user baru."""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user: User, data: UserUpdate):
    """Mengupdate data user."""
    # Ubah data di objek user yang ada
    if data.name is not None:
        user.name = data.name
    
    # Jika ada password baru, hash terlebih dahulu sebelum disimpan
    if data.password is not None:
        user.password_hash = get_password_hash(data.password)

    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user: User):
    """Menghapus user dari database."""
    db.delete(user)
    db.commit()
    return user