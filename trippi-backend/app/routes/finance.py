from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.services import finance_service
from app.services import trip_service
from app.schemas.finance import (
    FinanceCreate,
    FinanceUpdate,
    FinanceResponse
)

router = APIRouter(
    prefix="/finance",
    tags=["Finances"]
)

@router.post(
    "/trip/{trip_id}/user/{user_id}",
    response_model=FinanceResponse,
    summary="Criar lançamento financeiro",
    description="Cria um lançamento financeiro vinculado a uma viagem."
)
def create_entry(
    entry: FinanceCreate,
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    db: Session = Depends(get_db)
):
    return finance_service.create_finance_entry(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        entry=entry,
    )


@router.get(
    "/trip/{trip_id}",
    response_model=list[FinanceResponse],
    summary="Listar lançamentos financeiros",
    description="Retorna os lançamentos financeiros de uma viagem."
)
def get_all_trip_finances(
    trip_id: str = Path(..., description="ID da viagem"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip_service.ensure_trip_access(db=db, trip_id=trip_id, user_id=str(current_user.id))
    finance_service.sync_trip_itinerary_expenses(
        db=db,
        trip_id=trip_id,
        fallback_user_id=current_user.id,
    )
    return finance_service.list_trip_finances(db=db, trip_id=trip_id)

@router.get(
    "/trip/{trip_id}/user/{user_id}",
    response_model=list[FinanceResponse],
    summary="Listar lançamentos financeiros por usuário",
    description="Retorna os lançamentos financeiros de uma viagem filtrados por usuário."
)
def get_trip_finance(
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip_service.ensure_trip_access(db=db, trip_id=trip_id, user_id=str(current_user.id))
    finance_service.sync_trip_itinerary_expenses(
        db=db,
        trip_id=trip_id,
        fallback_user_id=current_user.id,
    )
    return finance_service.list_user_trip_finances(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
    )

@router.patch(
    "/trip/{trip_id}/user/{user_id}/entry/{finance_id}",
    response_model=FinanceResponse,
    summary="Atualizar lançamento financeiro",
    description="Atualiza parcialmente um lançamento financeiro existente."
)
def update_finance(
    finance_data: FinanceUpdate,
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    finance_id: str = Path(..., description="ID do lançamento financeiro"),
    db: Session = Depends(get_db)
):
    return finance_service.update_finance_entry(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        finance_id=finance_id,
        finance_data=finance_data,
    )

@router.delete(
    "/trip/{trip_id}/user/{user_id}/entry/{finance_id}",
    summary="Excluir lançamento financeiro",
    description="Remove um lançamento financeiro pelo identificador."
)
def delete_finance(
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    finance_id: str = Path(..., description="ID do lançamento financeiro"),
    db: Session = Depends(get_db)
):
    return finance_service.delete_finance_entry(
        db=db,
        trip_id=trip_id,
        user_id=user_id,
        finance_id=finance_id,
    )