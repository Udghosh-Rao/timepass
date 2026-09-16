import uuid
from pydantic import BaseModel
from datetime import datetime

class EventResponse(BaseModel):
    event_id: uuid.UUID
    asset_id: uuid.UUID
    event_type: str
    severity: str
    timestamp: datetime

    class Config:
        from_attributes = True
