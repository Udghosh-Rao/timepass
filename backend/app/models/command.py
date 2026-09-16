import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Command(Base):
    __tablename__ = "commands"

    command_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.asset_id"))
    command_type = Column(String)
    parameters = Column(JSON)
    status = Column(String)  # CREATED, SENT, ACKNOWLEDGED, EXECUTING, COMPLETED, FAILED
    issued_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    timestamp = Column(DateTime(timezone=True), default=func.now())

    asset = relationship("Asset", back_populates="commands")
    user = relationship("User", back_populates="commands")
