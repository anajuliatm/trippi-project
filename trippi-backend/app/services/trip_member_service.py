from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.finance import Finance
from app.models.trip import Trip
from app.models.trip_member import TripMember
from app.schemas.trip_member import TripMemberCreate
EXPENSE_TYPE = "expense"


def add_member(
    db: Session,
    trip_id: str,
    user_id: str,
    member: TripMemberCreate,
) -> TripMember:
    if str(member.trip_id) != trip_id or str(member.user_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="trip_id ou user_id diferente da rota",
        )

    new_member = TripMember(**member.model_dump())

    try:
        _get_trip_or_404(db=db, trip_id=member.trip_id)
        existing_member = db.execute(
            select(TripMember).where(
                TripMember.trip_id == member.trip_id,
                TripMember.user_id == member.user_id,
            )
        ).scalar_one_or_none()

        if existing_member is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário já participa da viagem",
            )

        db.add(new_member)
        db.flush()
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não foi possível adicionar o membro na viagem",
        ) from exc

    db.refresh(new_member)
    return new_member


def list_trip_members(db: Session, trip_id: str) -> list[TripMember]:
    _get_trip_or_404(db=db, trip_id=trip_id)

    statement = (
        select(TripMember)
        .where(TripMember.trip_id == trip_id)
        .order_by(TripMember.joined_at.asc(), TripMember.user_id.asc())
    )
    return list(db.execute(statement).scalars().all())


def delete_member(db: Session, trip_id: str, user_id: str) -> dict[str, str]:
    try:
        member = db.execute(
            select(TripMember).where(
                TripMember.trip_id == trip_id,
                TripMember.user_id == user_id,
            )
        ).scalar_one_or_none()

        if member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membro não encontrado",
            )

        member_count = db.execute(
            select(func.count()).select_from(TripMember).where(TripMember.trip_id == trip_id)
        ).scalar_one()
        if member_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A viagem precisa ter ao menos um participante",
            )

        has_expense = db.execute(
            select(Finance.id).where(
                Finance.trip_id == trip_id,
                Finance.user_id == user_id,
                Finance.type == EXPENSE_TYPE,
            )
        ).scalar_one_or_none()
        if has_expense is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover um membro com despesas registradas",
            )

        db.delete(member)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ão foi possível remover o membro da viagem",
        ) from exc

    return {"message": "Membro removido"}


def _get_trip_or_404(db: Session, trip_id: str) -> Trip:
    trip = db.execute(select(Trip).where(Trip.id == trip_id)).scalar_one_or_none()
    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viagem não encontrada",
        )

    return trip