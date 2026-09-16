import uuid
from pydantic import BaseModel

class CommandResponse(BaseModel):
    command_id: uuid.UUID
    command_type: str
    status: str

    class Config:
        from_attributes = True
