import uuid
from typing import Optional
from pydantic import BaseModel

class UserResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    role: str

    class Config:
        from_attributes = True
