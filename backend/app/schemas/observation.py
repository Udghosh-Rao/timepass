import uuid
from pydantic import BaseModel

class ObservationResponse(BaseModel):
    observation_id: uuid.UUID
    source: str

    class Config:
        from_attributes = True
