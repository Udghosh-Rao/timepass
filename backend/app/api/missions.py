from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.mission import Mission
from app.schemas.mission import MissionResponse

router = APIRouter(prefix="/api/v1/missions", tags=["missions"])

@router.get("", response_model=List[MissionResponse])
def get_missions(db: Session = Depends(get_db)):
    return db.query(Mission).all()
