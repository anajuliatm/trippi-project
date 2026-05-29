from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.trip_member import TripMember
from app.schemas.trip_member import (
    TripMemberCreate,
    TripMemberResponse
)

router = APIRouter(
    prefix="/trip_member",
    tags=["Trip Members"]
)

@router.post(
    "/trip/{trip_id}/user/{user_id}",
    response_model=TripMemberResponse,
    summary="Adicionar membro",
    description="Adiciona um membro a uma viagem."
)
def add_member(
    member: TripMemberCreate,
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    db: Session = Depends(get_db)
):

    if str(member.trip_id) != trip_id or str(member.user_id) != user_id:
        raise HTTPException(
            status_code=400,
            detail="trip_id ou user_id diferente da rota"
        )

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


@router.get(
    "/trip/{trip_id}",
    response_model=list[TripMemberResponse],
    summary="Listar membros",
    description="Retorna os membros de uma viagem."
)
def get_trip_members(
    trip_id: str = Path(..., description="ID da viagem"),
    db: Session = Depends(get_db)
):

    members = (
        db.query(TripMember)
        .filter(TripMember.trip_id == trip_id)
        .all()
    )

    return members


@router.delete(
    "/trip/{trip_id}/user/{user_id}",
    summary="Remover membro",
    description="Remove um membro de uma viagem."
)
def delete_member(
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
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