from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.trip_member import (
    TripMemberCreate,
    TripMemberResponse
)
from app.services import trip_member_service

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
    return trip_member_service.add_member(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        member=member,
    )


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
    return trip_member_service.list_trip_members(db=db, trip_id=trip_id)


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
    return trip_member_service.delete_member(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
    )