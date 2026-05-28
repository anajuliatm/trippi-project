from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.itinerary import Itinerary
from app.schemas.itinerary import (
    ItineraryCreate,
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