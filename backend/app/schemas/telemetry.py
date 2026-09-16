import uuid
from pydantic import BaseModel
from datetime import datetime

class TelemetryResponse(BaseModel):
    telemetry_id: uuid.UUID
    timestamp: datetime
    asset_id: uuid.UUID

    class Config:
        from_attributes = True
