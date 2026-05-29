from decimal import Decimal, ROUND_DOWN
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.finance import Finance
from app.models.payment import Payment
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.user import User
from app.schemas.finance import FinanceCreate, FinanceUpdate, TripParticipantBalanceResponse

EXPENSE_TYPE = "expense"
CONTRIBUTION_TYPE = "contribution"
CENT = Decimal("0.01")


def create_finance_entry(
    db: Session,
    trip_id: str,
    user_id: str,
    entry: FinanceCreate,
) -> Finance:
    if str(entry.trip_id) != trip_id or str(entry.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="trip_id ou user_id diferente da rota",
        )

    finance = Finance(**entry.model_dump())

    try:
        with db.begin():
            _get_trip_or_404(db=db, trip_id=entry.trip_id)
            db.add(finance)
            db.flush()

            if finance.type == EXPENSE_TYPE:
                _sync_expense_payments(db=db, finance=finance)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel criar o lancamento financeiro",
        ) from exc

    db.refresh(finance)
    return finance


def list_trip_finances(db: Session, trip_id: str) -> list[Finance]:
    _get_trip_or_404(db=db, trip_id=trip_id)

    statement = (
        select(Finance)
        .where(Finance.trip_id == trip_id)
        .order_by(Finance.created_at.desc())
    )
    return list(db.execute(statement).scalars().all())


def list_user_trip_finances(db: Session, trip_id: str, user_id: str) -> list[Finance]:
    _get_trip_or_404(db=db, trip_id=trip_id)

    statement = (
        select(Finance)
        .where(Finance.trip_id == trip_id, Finance.user_id == user_id)
        .order_by(Finance.created_at.desc())
    )
    return list(db.execute(statement).scalars().all())


def update_finance_entry(
    db: Session,
    trip_id: str,
    user_id: str,
    finance_id: str,
    finance_data: FinanceUpdate,
) -> Finance:
    finance: Finance | None = None

    try:
        with db.begin():
            finance = _get_finance_or_404(
                db=db,
                finance_id=finance_id,
                trip_id=trip_id,
                user_id=user_id,
            )

            if finance_data.type is not None:
                finance.type = finance_data.type

            if finance_data.description is not None:
                finance.description = finance_data.description

            if finance_data.amount is not None:
                finance.amount = Decimal(str(finance_data.amount)).quantize(CENT)

            if finance.type == EXPENSE_TYPE:
                _sync_expense_payments(db=db, finance=finance)
            else:
                _delete_auto_generated_payments(db=db, finance_id=finance.id)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel atualizar o lancamento financeiro",
        ) from exc

    if finance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lançamento não encontrado para esta viagem e usuário",
        )

    db.refresh(finance)
    return finance


def delete_finance_entry(
    db: Session,
    trip_id: str,
    user_id: str,
    finance_id: str,
) -> dict[str, str]:
    with db.begin():
        finance = _get_finance_or_404(
            db=db,
            finance_id=finance_id,
            trip_id=trip_id,
            user_id=user_id,
        )
        _delete_auto_generated_payments(db=db, finance_id=finance.id)
        db.delete(finance)

    return {"message": "Lançamento deletado"}


def get_trip_balances(db: Session, trip_id: str) -> list[TripParticipantBalanceResponse]:
    trip = _get_trip_or_404(db=db, trip_id=trip_id)

    participants_statement = (
        select(User.id, User.username)
        .join(TripMember, TripMember.user_id == User.id)
        .where(TripMember.trip_id == trip.id)
        .order_by(User.username.asc())
    )
    participants = list(db.execute(participants_statement).all())

    if not participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A viagem nao possui participantes cadastrados",
        )

    paid_subquery = (
        select(
            Finance.user_id.label("user_id"),
            func.coalesce(func.sum(Finance.amount), 0).label("paid"),
        )
        .where(Finance.trip_id == trip.id, Finance.type == EXPENSE_TYPE)
        .group_by(Finance.user_id)
        .subquery()
    )

    total_expenses = _to_decimal(
        db.execute(
            select(func.coalesce(func.sum(Finance.amount), 0)).where(
                Finance.trip_id == trip.id,
                Finance.type == EXPENSE_TYPE,
            )
        ).scalar_one()
    )
    should_pay = _quantize(total_expenses / Decimal(len(participants)))

    balances_statement = (
        select(
            User.id,
            User.username,
            func.coalesce(paid_subquery.c.paid, 0).label("paid"),
        )
        .join(TripMember, TripMember.user_id == User.id)
        .outerjoin(paid_subquery, paid_subquery.c.user_id == User.id)
        .where(TripMember.trip_id == trip.id)
        .order_by(User.username.asc())
    )

    balances: list[TripParticipantBalanceResponse] = []
    for row in db.execute(balances_statement):
        paid = _quantize(_to_decimal(row.paid))
        balance = _quantize(paid - should_pay)
        balances.append(
            TripParticipantBalanceResponse(
                user_id=row.id,
                username=row.username,
                paid=paid,
                should_pay=should_pay,
                balance=balance,
            )
        )

    return balances


def _sync_expense_payments(db: Session, finance: Finance) -> None:
    member_ids = _get_trip_member_ids(db=db, trip_id=finance.trip_id)
    if not member_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A viagem nao possui participantes cadastrados",
        )

    if finance.user_id not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O pagador precisa ser participante da viagem",
        )

    debtor_ids = [member_id for member_id in member_ids if member_id != finance.user_id]
    _delete_auto_generated_payments(db=db, finance_id=finance.id)

    if not debtor_ids:
        return

    shares = _split_amount_evenly(
        total_amount=_to_decimal(finance.amount),
        parts=len(member_ids),
    )
    debtor_shares = shares[: len(debtor_ids)]
    note = _build_auto_payment_note(finance.id)

    for debtor_id, share in zip(debtor_ids, debtor_shares):
        duplicate_statement = select(Payment.id).where(
            Payment.trip_id == finance.trip_id,
            Payment.from_user_id == debtor_id,
            Payment.to_user_id == finance.user_id,
            Payment.note == note,
        )
        duplicate_payment_id = db.execute(duplicate_statement).scalar_one_or_none()
        if duplicate_payment_id is not None:
            continue

        db.add(
            Payment(
                trip_id=finance.trip_id,
                from_user_id=debtor_id,
                to_user_id=finance.user_id,
                amount=share,
                note=note,
            )
        )


def _delete_auto_generated_payments(db: Session, finance_id: UUID) -> None:
    db.execute(
        delete(Payment).where(Payment.note == _build_auto_payment_note(finance_id))
    )


def _get_finance_or_404(
    db: Session,
    finance_id: str,
    trip_id: str,
    user_id: str,
) -> Finance:
    statement = select(Finance).where(
        Finance.id == finance_id,
        Finance.trip_id == trip_id,
        Finance.user_id == user_id,
    )
    finance = db.execute(statement).scalar_one_or_none()
    if finance is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lançamento não encontrado para esta viagem e usuário",
        )

    return finance


def _get_trip_or_404(db: Session, trip_id: str | UUID) -> Trip:
    statement = select(Trip).where(Trip.id == trip_id)
    trip = db.execute(statement).scalar_one_or_none()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem não encontrada",
        )

    return trip


def _get_trip_member_ids(db: Session, trip_id: UUID) -> list[UUID]:
    statement = select(TripMember.user_id).where(TripMember.trip_id == trip_id)
    return list(db.execute(statement).scalars().all())


def _build_auto_payment_note(finance_id: UUID) -> str:
    return f"Auto-generated from finance {finance_id}"


def _split_amount_evenly(total_amount: Decimal, parts: int) -> list[Decimal]:
    if parts <= 0:
        return []

    normalized_total = _quantize(total_amount)
    total_cents = int((normalized_total * 100).to_integral_value(rounding=ROUND_DOWN))
    base_cents, remainder = divmod(total_cents, parts)

    shares = [Decimal(base_cents) / Decimal(100) for _ in range(parts)]
    for index in range(remainder):
        shares[index] += CENT

    return [_quantize(share) for share in shares]


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(CENT)


def _to_decimal(value: Decimal | int | float) -> Decimal:
    return Decimal(str(value))