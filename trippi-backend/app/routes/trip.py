from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.finance import (
    TripFinanceSummaryResponse,
    TripParticipantBalanceResponse,
    TripSettlementResponse,
)
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services import finance_service, trip_service

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post(
    "/",
    response_model=TripResponse,
    summary="Criar viagem",
    description="Cria uma nova viagem."
)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    return trip_service.create_trip(db=db, trip_data=trip)


@router.get(
    "/",
    response_model=list[TripResponse],
    summary="Listar viagens",
    description="Retorna todas as viagens cadastradas."
)
def get_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db),):
    return trip_service.list_trips(db=db, user_id=str(current_user.id))


@router.get(
    "/{trip_id}",
    response_model=TripResponse,
    summary="Buscar viagem",
    description="Retorna uma viagem pelo identificador."
)
def get_trip_by_id(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return trip_service.get_trip_by_id(db=db, trip_id=trip_id, user_id=str(current_user.id))


@router.get(
    "/{trip_id}/summary",
    response_model=TripFinanceSummaryResponse,
    summary="Resumo financeiro da viagem",
    description="Retorna orçamento, contribuições, despesas e saldo restante da viagem."
)
def get_trip_summary(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return trip_service.get_trip_summary(db=db, trip_id=trip_id, user_id=str(current_user.id))


@router.get(
    "/{trip_id}/balances",
    response_model=list[TripParticipantBalanceResponse],
    summary="Saldos dos participantes",
    description="Retorna quanto cada participante pagou, deveria pagar e seu saldo final."
)
def get_trip_balances(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip_service.ensure_trip_access(db=db, trip_id=trip_id, user_id=str(current_user.id))
    finance_service.sync_trip_itinerary_expenses(
        db=db,
        trip_id=trip_id,
        fallback_user_id=current_user.id,
    )
    return finance_service.get_trip_balances(db=db, trip_id=trip_id)


@router.get(
    "/{trip_id}/settlements",
    response_model=list[TripSettlementResponse],
    summary="Sugestoes de acerto da viagem",
    description="Retorna sugestoes de acerto calculadas em memoria a partir dos saldos dos participantes."
)
def get_trip_settlements(trip_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip_service.ensure_trip_access(db=db, trip_id=trip_id, user_id=str(current_user.id))
    finance_service.sync_trip_itinerary_expenses(
        db=db,
        trip_id=trip_id,
        fallback_user_id=current_user.id,
    )
    return finance_service.get_trip_settlements(db=db, trip_id=trip_id)

@router.patch(
    "/{trip_id}",
    response_model=TripResponse,
    summary="Atualizar viagem",
    description="Atualiza parcialmente uma viagem existente."
)
def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return trip_service.update_trip(
        db=db,
        trip_id=trip_id,
        trip_data=trip_data,
        user_id=str(current_user.id)
    )

@router.delete(
    "/{trip_id}",
    summary="Excluir viagem",
    description="Remove uma viagem pelo identificador."
)
def delete_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return trip_service.delete_trip(db=db, trip_id=trip_id, user_id=str(current_user.id))