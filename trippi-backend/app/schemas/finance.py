from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class FinanceCreate(BaseModel):
    trip_id: UUID
    user_id: UUID
    type: str
    description: str | None = None
    amount: Decimal

class FinanceResponse(FinanceCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True