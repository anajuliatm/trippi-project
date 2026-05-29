from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.finance import Finance
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.schemas.finance import TripFinanceSummaryResponse
from app.schemas.trip import TripCreate, TripUpdate

EXPENSE_TYPE = "expense"
CONTRIBUTION_TYPE = "contribution"
CENT = Decimal("0.01")


def create_trip(db: Session, trip_data: TripCreate) -> Trip:
    new_trip = Trip(
        owner_id=trip_data.owner_id,
        destination=trip_data.destination,
        image_url=trip_data.image_url,
        departure_date=trip_data.departure_date,
        return_date=trip_data.return_date,
        budget=trip_data.budget,
    )

    owner_member = TripMember(
        trip_id=new_trip.id,
        user_id=trip_data.owner_id,
        role="owner",
    )

    try:
        with db.begin():
            db.add(new_trip)
            db.flush()
            owner_member.trip_id = new_trip.id
            db.add(owner_member)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel criar a viagem",
        ) from exc

    db.refresh(new_trip)
    return new_trip


def list_trips(db: Session) -> list[Trip]:
    statement = select(Trip).order_by(Trip.created_at.desc())
    return list(db.execute(statement).scalars().all())


def get_trip_by_id(db: Session, trip_id: str) -> Trip:
    return _get_trip_or_404(db=db, trip_id=trip_id)


def update_trip(db: Session, trip_id: str, trip_data: TripUpdate) -> Trip:
    trip: Trip | None = None

    try:
        with db.begin():
            trip = _get_trip_or_404(db=db, trip_id=trip_id)

            if trip_data.destination is not None:
                trip.destination = trip_data.destination

            if trip_data.image_url is not None:
                trip.image_url = trip_data.image_url

            if trip_data.departure_date is not None:
                trip.departure_date = trip_data.departure_date

            if trip_data.return_date is not None:
                trip.return_date = trip_data.return_date

            if trip_data.is_active is not None:
                trip.is_active = trip_data.is_active

            if trip_data.budget is not None:
                trip.budget = Decimal(str(trip_data.budget)).quantize(CENT)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel atualizar a viagem",
        ) from exc

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem não encontrada",
        )

    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip_id: str) -> dict[str, str]:
    with db.begin():
        trip = _get_trip_or_404(db=db, trip_id=trip_id)
        db.delete(trip)

    return {"message": "Viagem deletada"}


def get_trip_summary(db: Session, trip_id: str) -> TripFinanceSummaryResponse:
    trip = _get_trip_or_404(db=db, trip_id=trip_id)

    totals_statement = select(
        func.coalesce(
            func.sum(Finance.amount).filter(Finance.type == CONTRIBUTION_TYPE),
            0,
        ).label("total_contributions"),
        func.coalesce(
            func.sum(Finance.amount).filter(Finance.type == EXPENSE_TYPE),
            0,
        ).label("total_expenses"),
    ).where(Finance.trip_id == trip.id)
    totals = db.execute(totals_statement).one()

    budget = _to_decimal(trip.budget)
    total_contributions = _quantize(_to_decimal(totals.total_contributions))
    total_expenses = _quantize(_to_decimal(totals.total_expenses))

    return TripFinanceSummaryResponse(
        trip_id=trip.id,
        budget=_quantize(budget),
        total_contributions=total_contributions,
        total_expenses=total_expenses,
        remaining_balance=_quantize(total_contributions - total_expenses),
    )


def _get_trip_or_404(db: Session, trip_id: str) -> Trip:
    statement = select(Trip).where(Trip.id == trip_id)
    trip = db.execute(statement).scalar_one_or_none()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem não encontrada",
        )

    return trip


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(CENT)


def _to_decimal(value: Decimal | int | float) -> Decimal:
    return Decimal(str(value))