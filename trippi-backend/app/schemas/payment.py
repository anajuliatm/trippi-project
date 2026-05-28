from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PaymentCreate(BaseModel):
    trip_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    amount: Decimal
    note: str | None = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    note: Optional[str] = None
    status: Optional[str] = None
    settled_at: Optional[datetime] = None

class PaymentResponse(PaymentCreate):
    id: UUID
    trip_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    amount: float
    note: Optional[str]
    status: str
    created_at: datetime
    settled_at: Optional[datetime]

    class Config:
        from_attributes = True