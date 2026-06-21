from pydantic import BaseModel, field_validator
from typing import Optional
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
    estimated_cost: Decimal = Decimal(0)

    @field_validator('estimated_cost')
    @classmethod
    def estimated_cost_valido(cls, v):
        if v < 0:
            raise ValueError('O custo estimado não pode ser negativo.')
        return v

class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    activity_date: Optional[date] = None
    activity_time: Optional[time] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = None

    @field_validator('estimated_cost', mode='before')
    @classmethod
    def estimated_cost_valido(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError('O custo estimado não pode ser negativo.')
        return v

class ItineraryResponse(ItineraryCreate):
    id: UUID
    trip_id: UUID
    title: str
    description: Optional[str]
    location: Optional[str]
    activity_date: date
    activity_time: Optional[time]
    notes: Optional[str]
    estimated_cost: float
    created_at: datetime

    class Config:
        from_attributes = True