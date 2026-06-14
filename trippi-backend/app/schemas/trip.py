from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class TripCreate(BaseModel):
    destination: str
    image_url: str | None = None
    departure_date: date
    return_date: date
    budget: Decimal = 0

class TripUpdate(BaseModel):
    destination: Optional[str] = None
    image_url: Optional[str] = None
    departure_date: Optional[date] = None
    return_date: Optional[date] = None
    is_active: Optional[bool] = None
    budget: Optional[float] = None

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