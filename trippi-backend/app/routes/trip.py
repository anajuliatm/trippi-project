from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripResponse

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):

    new_trip = Trip(
        owner_id=trip.owner_id,
        destination=trip.destination,
        image_url=trip.image_url,
        departure_date=trip.departure_date,
        return_date=trip.return_date,
        budget=trip.budget
    )

    db.add(new_trip)

    db.commit()

    db.refresh(new_trip)

    return new_trip


@router.get("/", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db)):

    trips = db.query(Trip).all()

    return trips