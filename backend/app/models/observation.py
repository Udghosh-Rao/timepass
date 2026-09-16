import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.core.database import Base

class Observation(Base):
    __tablename__ = "observations"

    observation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    source = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(Geometry(geometry_type="POINT", srid=4326))
    confidence = Column(Float)
    metadata_ = Column("metadata", JSON)

    asset = relationship("Asset", back_populates="observations")
