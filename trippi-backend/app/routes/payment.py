from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.payment import Payment
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse
)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):

    new_payment = Payment(**payment.model_dump())

    db.add(new_payment)

    db.commit()

    db.refresh(new_payment)

    return new_payment


@router.get("/trip/{trip_id}",
            response_model=list[PaymentResponse])
def get_trip_payments(
    trip_id: str,
    db: Session = Depends(get_db)
):

    payments = (
        db.query(Payment)
        .filter(Payment.trip_id == trip_id)
        .all()
    )

    return payments