from dataclasses import dataclass
from decimal import Decimal, ROUND_DOWN
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.finance import Finance
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.models.user import User
from app.schemas.finance import (
    FinanceCreate,
    FinanceUpdate,
    TripFinanceSummaryResponse,
    TripParticipantBalanceResponse,
    TripSettlementResponse,
)

EXPENSE_TYPE = "expense"
CENT = Decimal("0.01")


@dataclass(frozen=True)
class TripParticipantFinancial:
    user_id: UUID
    username: str
    paid: Decimal
    should_pay: Decimal


@dataclass(frozen=True)
class TripFinancialSnapshot:
    trip: Trip
    budget: Decimal
    budget_per_person: Decimal
    total_expenses: Decimal
    remaining_budget: Decimal
    participants: tuple[TripParticipantFinancial, ...]


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
        db.delete(finance)

    return {"message": "Lançamento deletado"}


def get_trip_summary(db: Session, trip_id: str | UUID) -> TripFinanceSummaryResponse:
    snapshot = calculate_trip_financials(db=db, trip_id=trip_id)
    return TripFinanceSummaryResponse(
        trip_id=snapshot.trip.id,
        participants=len(snapshot.participants),
        budget=snapshot.budget,
        budget_per_person=snapshot.budget_per_person,
        total_expenses=snapshot.total_expenses,
        remaining_budget=snapshot.remaining_budget,
    )


def get_trip_balances(db: Session, trip_id: str) -> list[TripParticipantBalanceResponse]:
    snapshot = calculate_trip_financials(db=db, trip_id=trip_id)
    return [
        TripParticipantBalanceResponse(
            user_id=participant.user_id,
            username=participant.username,
            paid=participant.paid,
            should_pay=participant.should_pay,
            balance=_quantize(participant.paid - participant.should_pay),
        )
        for participant in snapshot.participants
    ]


def get_trip_settlements(db: Session, trip_id: str) -> list[TripSettlementResponse]:
    snapshot = calculate_trip_financials(db=db, trip_id=trip_id)
    creditors: list[dict[str, UUID | str | Decimal]] = []
    debtors: list[dict[str, UUID | str | Decimal]] = []

    for participant in snapshot.participants:
        balance = _quantize(participant.paid - participant.should_pay)

        if balance >= CENT:
            creditors.append(
                {
                    "user_id": participant.user_id,
                    "username": participant.username,
                    "amount": balance,
                }
            )
            continue

        if balance <= -CENT:
            debtors.append(
                {
                    "user_id": participant.user_id,
                    "username": participant.username,
                    "amount": _quantize(-balance),
                }
            )

    creditors.sort(
        key=lambda participant: (
            -Decimal(participant["amount"]),
            str(participant["user_id"]),
        )
    )
    debtors.sort(
        key=lambda participant: (
            -Decimal(participant["amount"]),
            str(participant["user_id"]),
        )
    )

    settlements: list[TripSettlementResponse] = []
    creditor_index = 0
    debtor_index = 0

    while debtor_index < len(debtors) and creditor_index < len(creditors):
        debtor = debtors[debtor_index]
        creditor = creditors[creditor_index]
        amount = _quantize(
            min(
                Decimal(debtor["amount"]),
                Decimal(creditor["amount"]),
            )
        )

        if amount < CENT:
            break

        settlements.append(
            TripSettlementResponse(
                from_user_id=UUID(str(debtor["user_id"])),
                from_username=str(debtor["username"]),
                to_user_id=UUID(str(creditor["user_id"])),
                to_username=str(creditor["username"]),
                amount=amount,
            )
        )

        debtor["amount"] = _quantize(Decimal(debtor["amount"]) - amount)
        creditor["amount"] = _quantize(Decimal(creditor["amount"]) - amount)

        if Decimal(debtor["amount"]) < CENT:
            debtor_index += 1

        if Decimal(creditor["amount"]) < CENT:
            creditor_index += 1

    return settlements


def calculate_trip_financials(db: Session, trip_id: str | UUID) -> TripFinancialSnapshot:
    trip = _get_trip_or_404(db=db, trip_id=trip_id)
    participant_rows = _get_trip_participant_rows(db=db, trip_id=trip.id)

    if not participant_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A viagem nao possui participantes cadastrados",
        )

    participant_ids = [row.id for row in participant_rows]
    participant_count = len(participant_rows)
    paid_by_user = {participant_id: Decimal("0.00") for participant_id in participant_ids}
    should_pay_by_user = {participant_id: Decimal("0.00") for participant_id in participant_ids}

    paid_statement = (
        select(
            Finance.user_id.label("user_id"),
            func.coalesce(func.sum(Finance.amount), 0).label("paid"),
        )
        .where(Finance.trip_id == trip.id, Finance.type == EXPENSE_TYPE)
        .group_by(Finance.user_id)
    )

    total_expenses = Decimal("0.00")
    for row in db.execute(paid_statement):
        paid_amount = _quantize(_to_decimal(row.paid))
        total_expenses += paid_amount

        if row.user_id not in paid_by_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Existe despesa registrada para um usuario que nao participa da viagem",
            )

        paid_by_user[row.user_id] = paid_amount

    expense_statement = (
        select(Finance.id, Finance.user_id, Finance.amount)
        .where(Finance.trip_id == trip.id, Finance.type == EXPENSE_TYPE)
        .order_by(Finance.created_at.asc(), Finance.id.asc())
    )

    for expense in db.execute(expense_statement):
        if expense.user_id not in paid_by_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Existe despesa registrada para um usuario que nao participa da viagem",
            )

        shares = _split_amount_evenly(
            total_amount=_to_decimal(expense.amount),
            parts=participant_count,
        )

        for participant_id, share in zip(participant_ids, shares):
            should_pay_by_user[participant_id] += share

    participants = tuple(
        TripParticipantFinancial(
            user_id=row.id,
            username=row.username,
            paid=_quantize(paid_by_user[row.id]),
            should_pay=_quantize(should_pay_by_user[row.id]),
        )
        for row in participant_rows
    )

    budget = _quantize(_to_decimal(trip.budget))
    budget_per_person = _quantize(budget / Decimal(participant_count))

    return TripFinancialSnapshot(
        trip=trip,
        budget=budget,
        budget_per_person=budget_per_person,
        total_expenses=_quantize(total_expenses),
        remaining_budget=_quantize(budget - total_expenses),
        participants=participants,
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


def _get_trip_participant_rows(db: Session, trip_id: UUID) -> list:
    statement = (
        select(User.id, User.username)
        .join(TripMember, TripMember.user_id == User.id)
        .where(TripMember.trip_id == trip_id)
        .order_by(User.username.asc(), User.id.asc())
    )
    return list(db.execute(statement).all())


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