from pydantic import BaseModel
from uuid import UUID
from datetime import date, time, datetime
from decimal import Decimal

class ItineraryCreate(BaseModel):
    trip_id: UUID
    title: str
    description: str | None = None
    location: str | None = None
    activity_date: date
    activity_time: time | None = None
    notes: str | None = None
    estimated_cost: Decimal = 0

class ItineraryResponse(ItineraryCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True