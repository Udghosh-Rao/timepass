import uuid
from typing import Optional, Any
from pydantic import BaseModel
from datetime import datetime

class AssetBase(BaseModel):
    name: str
    type: str
    status: str
    capabilities: Optional[Any] = None
    make: Optional[str] = None
    model: Optional[str] = None
    driver_version: Optional[str] = None
    firmware_version: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    capabilities: Optional[Any] = None

class AssetResponse(AssetBase):
    asset_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
