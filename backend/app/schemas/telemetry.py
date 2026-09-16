import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class TelemetryCreate(BaseModel):
    timestamp: Optional[datetime] = None
    latitude: float
    longitude: float
    altitude: Optional[float] = 0.0
    heading: float = Field(ge=0, le=360)
    speed: float = Field(ge=0)
    course: float = Field(ge=0, le=360, default=0.0)
    battery_pct: float = Field(ge=0, le=100)
    health_status: str
    connection_status: str
    mission_id: Optional[uuid.UUID] = None
    detections: Optional[Dict[str, Any]] = None

class TelemetryResponse(BaseModel):
    telemetry_id: uuid.UUID
    asset_id: uuid.UUID
    timestamp: datetime
    position: Optional[Any] = None # Will be WKBElement or dict depending on serialization
    velocity: Optional[Dict[str, Any]] = None
    heading: float
    battery_pct: float
    health_status: str
    connection_status: str
    mission_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True
