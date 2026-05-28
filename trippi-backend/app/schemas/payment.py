from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class PaymentCreate(BaseModel):
    trip_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    amount: Decimal
    note: str | None = None

class PaymentResponse(PaymentCreate):
    id: UUID
    status: str
    created_at: datetime
    settled_at: datetime | None

    class Config:
        from_attributes = True