from fastapi import APIRouter, Depends, HTTPException
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

@router.post("/", response_model=ItineraryResponse)
def create_activity(
    activity: ItineraryCreate,
    db: Session = Depends(get_db)
):

    new_activity = Itinerary(**activity.model_dump())

    db.add(new_activity)

    db.commit()

    db.refresh(new_activity)

    return new_activity


@router.get("/trip/{trip_id}",
            response_model=list[ItineraryResponse])
def get_trip_itinerary(
    trip_id: str,
    db: Session = Depends(get_db)
):

    activities = (
        db.query(Itinerary)
        .filter(Itinerary.trip_id == trip_id)
        .all()
    )

    return activities

@router.patch("/{activity_id}",
            response_model=ItineraryResponse)
def update_activity(
    activity_id: str,
    activity_data: ItineraryUpdate,
    db: Session = Depends(get_db)
):

    activity = (
        db.query(Itinerary)
        .filter(Itinerary.id == activity_id)
        .first()
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Atividade não encontrada"
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

@router.delete("/{activity_id}")
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db)
):

    activity = (
        db.query(Itinerary)
        .filter(Itinerary.id == activity_id)
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