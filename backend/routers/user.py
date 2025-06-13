from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserDisplay, UserUpdate, StatusResponse
from ..utils.security import get_current_user
from ..crud import user as crud_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# Endpoint untuk mengupdate data user yang sedang login
@router.put("/me", response_model=UserDisplay)
def update_current_user(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Memperbarui nama atau password untuk user yang sedang login.
    """
    updated_user = crud_user.update_user(db=db, user=current_user, data=data)
    return updated_user

# Endpoint untuk menghapus user yang sedang login
@router.delete("/me", response_model=StatusResponse)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menghapus akun untuk user yang sedang login.
    """
    crud_user.delete_user(db=db, user=current_user)
    return {"detail": "User account successfully deleted"}