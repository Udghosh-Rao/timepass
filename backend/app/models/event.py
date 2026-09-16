import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    event_type = Column(String)
    severity = Column(String)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSON)

    asset = relationship("Asset", back_populates="events")
