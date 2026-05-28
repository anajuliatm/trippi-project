from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.payment import Payment
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
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

@router.patch("/{payment_id}",
            response_model=PaymentResponse)
def update_payment(
    payment_id: str,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Pagamento não encontrado"
        )

    if payment_data.amount is not None:
        payment.amount = payment_data.amount

    if payment_data.note is not None:
        payment.note = payment_data.note

    if payment_data.status is not None:
        payment.status = payment_data.status

    if payment_data.settled_at is not None:
        payment.settled_at = payment_data.settled_at

    db.commit()

    db.refresh(payment)

    return payment

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: str,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Pagamento não encontrado"
        )

    db.delete(payment)

    db.commit()

    return {"message": "Pagamento deletado"}