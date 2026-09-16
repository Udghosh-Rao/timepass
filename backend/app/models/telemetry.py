import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.core.database import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    telemetry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    position = Column(Geometry(geometry_type="POINTZ", srid=4326))
    velocity = Column(JSON)  # {speed, course}
    heading = Column(Float)
    battery_pct = Column(Float)
    health_status = Column(String)
    connection_status = Column(String)
    mission_id = Column(UUID(as_uuid=True), ForeignKey("missions.mission_id"), nullable=True)

    asset = relationship("Asset", back_populates="telemetry")
    mission = relationship("Mission", back_populates="telemetry")
