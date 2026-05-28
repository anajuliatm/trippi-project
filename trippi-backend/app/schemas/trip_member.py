from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class TripMemberCreate(BaseModel):
    trip_id: UUID
    user_id: UUID
    role: str = "member"

class TripMemberResponse(BaseModel):
    trip_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True