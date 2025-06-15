from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.session import SessionDisplay
from ..crud import session as crud_session

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)

@router.get("/{session_code}", response_model=SessionDisplay)
def validate_session_code(session_code: str, db: Session = Depends(get_db)):
    db_session = crud_session.get_session_by_code(db, code=session_code)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session code not found or has expired.")
    return db_session