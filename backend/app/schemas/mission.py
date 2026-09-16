import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MissionResponse(BaseModel):
    mission_id: uuid.UUID
    name: str
    asset_id: uuid.UUID
    status: str
    created_at: datetime
    start_time: Optional[datetime]
    end_time: Optional[datetime]

    class Config:
        from_attributes = True
