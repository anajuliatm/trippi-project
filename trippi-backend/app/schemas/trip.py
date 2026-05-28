from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class TripCreate(BaseModel):
    owner_id: UUID
    destination: str
    image_url: str | None = None
    departure_date: date
    return_date: date
    budget: Decimal = 0

class TripResponse(BaseModel):
    id: UUID
    owner_id: UUID
    destination: str
    image_url: str | None
    departure_date: date
    return_date: date
    is_active: bool
    budget: Decimal
    created_at: datetime

    class Config:
        from_attributes = True