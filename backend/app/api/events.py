from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.event import Event
from app.schemas.event import EventResponse

router = APIRouter(prefix="/api/v1/events", tags=["events"])

@router.get("", response_model=List[EventResponse])
def get_events(
    asset_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db)
):
    q = db.query(Event).order_by(Event.timestamp.desc())
    if asset_id:
        q = q.filter(Event.asset_id == asset_id)
    if event_type:
        q = q.filter(Event.event_type == event_type)
    if severity:
        q = q.filter(Event.severity == severity)
    return q.limit(limit).all()
