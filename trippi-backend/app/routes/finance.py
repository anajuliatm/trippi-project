from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.finance import Finance
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

    if str(entry.trip_id) != trip_id or str(entry.user_id) != user_id:
        raise HTTPException(
            status_code=400,
            detail="trip_id ou user_id diferente da rota"
        )

    new_entry = Finance(**entry.model_dump())

    db.add(new_entry)

    db.commit()

    db.refresh(new_entry)

    return new_entry


@router.get(
    "/trip/{trip_id}",
    response_model=list[FinanceResponse],
    summary="Listar lançamentos financeiros",
    description="Retorna os lançamentos financeiros de uma viagem."
)
def get_all_trip_finances(
    trip_id: str = Path(..., description="ID da viagem"),
    db: Session = Depends(get_db)
):

    entries = (
        db.query(Finance)
        .filter(Finance.trip_id == trip_id)
        .all()
    )

    return entries

@router.get(
    "/trip/{trip_id}/user/{user_id}",
    response_model=list[FinanceResponse],
    summary="Listar lançamentos financeiros por usuário",
    description="Retorna os lançamentos financeiros de uma viagem filtrados por usuário."
)
def get_trip_finance(
    trip_id: str = Path(..., description="ID da viagem"),
    user_id: str = Path(..., description="ID do usuário"),
    db: Session = Depends(get_db)
):

    entries = (
        db.query(Finance)
        .filter(
            Finance.trip_id == trip_id,
            Finance.user_id == user_id
        )
        .all()
    )

    return entries

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

    finance = (
        db.query(Finance)
        .filter(
            Finance.id == finance_id,
            Finance.trip_id == trip_id,
            Finance.user_id == user_id
        )
        .first()
    )

    if not finance:
        raise HTTPException(
            status_code=404,
            detail="Lançamento não encontrado para esta viagem e usuário"
        )

    if finance_data.type is not None:
        finance.type = finance_data.type

    if finance_data.description is not None:
        finance.description = finance_data.description

    if finance_data.amount is not None:
        finance.amount = finance_data.amount

    db.commit()

    db.refresh(finance)

    return finance

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

    finance = (
        db.query(Finance)
        .filter(
            Finance.id == finance_id,
            Finance.trip_id == trip_id,
            Finance.user_id == user_id
        )
        .first()
    )

    if not finance:
        raise HTTPException(
            status_code=404,
            detail="Lançamento não encontrado para esta viagem e usuário"
        )

    db.delete(finance)

    db.commit()

    return {"message": "Lançamento deletado"}