import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Mission(Base):
    __tablename__ = "missions"

    mission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    status = Column(String)  # CREATED, ACTIVE, PAUSED, COMPLETED, FAILED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    asset = relationship("Asset", back_populates="missions")
    telemetry = relationship("Telemetry", back_populates="mission")
