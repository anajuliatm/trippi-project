from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.trip_member import (
    TripMemberCreate,
    TripMemberResponse
)
from app.services import trip_member_service
from app.socket import sio

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
async def add_member(
    member: TripMemberCreate,
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = trip_member_service.add_member(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        member=member,
    )
    await sio.emit("trip_updated", {}, room=trip_id)
    return result


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
async def delete_member(
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = trip_member_service.delete_member(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        is_self_removal=str(current_user.id) == user_id,
    )
    await sio.emit("trip_updated", {}, room=trip_id)
    return result