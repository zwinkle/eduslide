import uuid
from sqlalchemy.orm import Session
from ..models.presentation import Presentation
from ..schemas.presentation import PresentationCreate

def create_presentation(db: Session, presentation: PresentationCreate, owner_id: uuid.UUID):
    db_presentation = Presentation(
        title=presentation.title,
        owner_id=owner_id
    )
    db.add(db_presentation)
    db.commit()
    db.refresh(db_presentation)
    return db_presentation

def get_presentations_by_owner(db: Session, owner_id: uuid.UUID):
    return db.query(Presentation).filter(Presentation.owner_id == owner_id).all()

def get_presentation_by_id(db: Session, presentation_id: uuid.UUID, owner_id: uuid.UUID):
    return db.query(Presentation).filter(Presentation.id == presentation_id, Presentation.owner_id == owner_id).first()

def update_presentation_title(db: Session, presentation: Presentation, new_title: str):
    presentation.title = new_title
    db.commit()
    db.refresh(presentation)
    return presentation

def delete_presentation(db: Session, presentation: Presentation):
    db.delete(presentation)
    db.commit()
    return presentation