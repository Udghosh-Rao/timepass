import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    type = Column(String)  # UGV, UAV, AUV
    status = Column(String)
    capabilities = Column(JSON)
    make = Column(String)
    model = Column(String)
    driver_version = Column(String)
    firmware_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    telemetry = relationship("Telemetry", back_populates="asset", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="asset")
    events = relationship("Event", back_populates="asset")
    commands = relationship("Command", back_populates="asset")
    observations = relationship("Observation", back_populates="asset")
