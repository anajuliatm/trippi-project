from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class FinanceCreate(BaseModel):
    trip_id: UUID
    user_id: UUID
    type: str
    description: str | None = None
    amount: Decimal

class FinanceUpdate(BaseModel):
    type: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None

class FinanceResponse(FinanceCreate):
    id: UUID
    trip_id: UUID
    user_id: UUID
    type: str
    description: Optional[str]
    amount: float
    created_at: datetime

    class Config:
        from_attributes = True