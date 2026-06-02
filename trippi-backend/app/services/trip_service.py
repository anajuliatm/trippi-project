from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.schemas.finance import TripFinanceSummaryResponse
from app.schemas.trip import TripCreate, TripUpdate
from app.services import finance_service

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
        db.add(new_trip)
        db.flush()
        owner_member.trip_id = new_trip.id
        db.add(owner_member)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel criar a viagem",
        ) from exc

    db.refresh(new_trip)
    return new_trip


def list_trips(db: Session, user_id: str) -> list[Trip]:
    statement = (
        select(Trip)
        .join(TripMember, TripMember.trip_id == Trip.id)
        .where(TripMember.user_id == user_id)
        .order_by(Trip.departure_date.asc(), Trip.created_at.desc())
    )
    return list(db.execute(statement).scalars().all())


def get_trip_by_id(db: Session, trip_id: str, user_id: str) -> Trip:
    return _get_trip_or_404_for_user(db=db, trip_id=trip_id, user_id=user_id)


def update_trip(
    db: Session,
    trip_id: str,
    trip_data: TripUpdate,
    user_id: str,
) -> Trip:
    trip: Trip | None = None

    try:
        trip = _get_trip_or_404_for_user(db=db, trip_id=trip_id, user_id=user_id)

        if str(trip.owner_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o dono da viagem pode atualiza-la",
            )

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

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel atualizar a viagem",
        ) from exc

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem nao encontrada",
        )

    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip_id: str, user_id: str) -> dict[str, str]:
    try:
        trip = _get_trip_or_404_for_user(db=db, trip_id=trip_id, user_id=user_id)

        if str(trip.owner_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o dono da viagem pode exclui-la",
            )

        db.delete(trip)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao foi possivel excluir a viagem",
        ) from exc

    return {"message": "Viagem deletada"}


def get_trip_summary(
    db: Session,
    trip_id: str,
    user_id: str,
) -> TripFinanceSummaryResponse:
    _get_trip_or_404_for_user(db=db, trip_id=trip_id, user_id=user_id)
    return finance_service.get_trip_summary(db=db, trip_id=trip_id)


def ensure_trip_access(db: Session, trip_id: str, user_id: str) -> Trip:
    return _get_trip_or_404_for_user(db=db, trip_id=trip_id, user_id=user_id)


def _get_trip_or_404(db: Session, trip_id: str) -> Trip:
    statement = select(Trip).where(Trip.id == trip_id)
    trip = db.execute(statement).scalar_one_or_none()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem nao encontrada",
        )

    return trip


def _get_trip_or_404_for_user(db: Session, trip_id: str, user_id: str) -> Trip:
    statement = (
        select(Trip)
        .join(TripMember, TripMember.trip_id == Trip.id)
        .where(
            Trip.id == trip_id,
            TripMember.user_id == user_id,
        )
    )
    trip = db.execute(statement).scalar_one_or_none()

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem nao encontrada",
        )

    return trip


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(CENT)


def _to_decimal(value: Decimal | int | float) -> Decimal:
    return Decimal(str(value))