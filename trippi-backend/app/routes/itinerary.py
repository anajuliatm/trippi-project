from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.itinerary import Itinerary
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryUpdate,
    ItineraryResponse
)

router = APIRouter(
    prefix="/itinerary",
    tags=["Itinerary"]
)

@router.post(
    "/trip/{trip_id}",
    response_model=ItineraryResponse,
    summary="Criar atividade",
    description="Cria uma nova atividade vinculada a uma viagem."
)
def create_activity(
    activity: ItineraryCreate,
    trip_id: str = Path(..., description="ID da viagem"),
    db: Session = Depends(get_db)
):

    if str(activity.trip_id) != trip_id:
        raise HTTPException(
            status_code=400,
            detail="trip_id diferente da rota"
        )

    new_activity = Itinerary(**activity.model_dump())

    db.add(new_activity)

    db.commit()

    db.refresh(new_activity)

    return new_activity


@router.get(
    "/trip/{trip_id}",
    response_model=list[ItineraryResponse],
    summary="Listar atividades",
    description="Retorna as atividades de uma viagem."
)
def get_trip_itinerary(
    trip_id: str = Path(..., description="ID da viagem"),
    db: Session = Depends(get_db)
):

    activities = (
        db.query(Itinerary)
        .filter(Itinerary.trip_id == trip_id)
        .all()
    )

    return activities


@router.get(
    "/trip/{trip_id}/activity/{activity_id}",
    response_model=ItineraryResponse,
    summary="Buscar atividade",
    description="Retorna uma atividade específica de uma viagem."
)
def get_activity_by_trip_and_id(
    trip_id: str = Path(..., description="ID da viagem"),
    activity_id: str = Path(..., description="ID da atividade"),
    db: Session = Depends(get_db)
):
    activity = (
        db.query(Itinerary)
        .filter(
            Itinerary.id == activity_id,
            Itinerary.trip_id == trip_id
        )
        .first()
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Atividade não encontrada para esta viagem"
        )

    return activity

@router.patch(
    "/trip/{trip_id}/activity/{activity_id}",
    response_model=ItineraryResponse,
    summary="Atualizar atividade",
    description="Atualiza parcialmente uma atividade de uma viagem."
)
def update_activity(
    activity_data: ItineraryUpdate,
    trip_id: str = Path(..., description="ID da viagem"),
    activity_id: str = Path(..., description="ID da atividade"),
    db: Session = Depends(get_db)
):

    activity = (
        db.query(Itinerary)
        .filter(
            Itinerary.id == activity_id,
            Itinerary.trip_id == trip_id
        )
        .first()
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Atividade não encontrada para esta viagem"
        )

    if activity_data.title is not None:
        activity.title = activity_data.title

    if activity_data.description is not None:
        activity.description = activity_data.description

    if activity_data.location is not None:
        activity.location = activity_data.location

    if activity_data.activity_date is not None:
        activity.activity_date = activity_data.activity_date

    if activity_data.activity_time is not None:
        activity.activity_time = activity_data.activity_time

    if activity_data.notes is not None:
        activity.notes = activity_data.notes

    if activity_data.estimated_cost is not None:
        activity.estimated_cost = activity_data.estimated_cost

    db.commit()

    db.refresh(activity)

    return activity

@router.delete(
    "/trip/{trip_id}/activity/{activity_id}",
    summary="Excluir atividade",
    description="Remove uma atividade de uma viagem."
)
def delete_activity(
    trip_id: str = Path(..., description="ID da viagem"),
    activity_id: str = Path(..., description="ID da atividade"),
    db: Session = Depends(get_db)
):

    activity = (
        db.query(Itinerary)
        .filter(
            Itinerary.id == activity_id,
            Itinerary.trip_id == trip_id
        )
        .first()
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Atividade não encontrada"
        )

    db.delete(activity)

    db.commit()

    return {"message": "Atividade do roteiro deletada "}