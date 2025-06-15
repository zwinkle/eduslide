import uuid
from sqlalchemy.orm import Session
from ..models.session import Session as SessionModel

def create_session(db: Session, presentation_id: uuid.UUID):
    db_session = SessionModel(presentation_id=presentation_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session_by_code(db: Session, code: str):
    return db.query(SessionModel).filter(SessionModel.code == code).first()