from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.trip_member import TripMember
from app.schemas.trip_member import (
    TripMemberCreate,
    TripMemberResponse
)

router = APIRouter(
    prefix="/trip-members",
    tags=["Trip Members"]
)

@router.post("/", response_model=TripMemberResponse)
def add_member(
    member: TripMemberCreate,
    db: Session = Depends(get_db)
):

    existing_member = (
        db.query(TripMember)
        .filter(
            TripMember.trip_id == member.trip_id,
            TripMember.user_id == member.user_id
        )
        .first()
    )

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="Usuário já participa da viagem"
        )

    new_member = TripMember(**member.model_dump())

    db.add(new_member)

    db.commit()

    db.refresh(new_member)

    return new_member


@router.get("/trip/{trip_id}",
            response_model=list[TripMemberResponse])
def get_trip_members(
    trip_id: str,
    db: Session = Depends(get_db)
):

    members = (
        db.query(TripMember)
        .filter(TripMember.trip_id == trip_id)
        .all()
    )

    return members

@router.put("/{trip_id}/{user_id}",
            response_model=TripMemberResponse)
def update_member(
    trip_id: str,
    user_id: str,
    member_data: TripMemberCreate,
    db: Session = Depends(get_db)
):

    member = (
        db.query(TripMember)
        .filter(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Membro não encontrado"
        )

    member.role = member_data.role

    db.commit()

    db.refresh(member)

    return member

@router.delete("/{trip_id}/{user_id}")
def delete_member(
    trip_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):

    member = (
        db.query(TripMember)
        .filter(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user_id
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Membro não encontrado"
        )

    db.delete(member)

    db.commit()

    return {"message": "Membro removido"}