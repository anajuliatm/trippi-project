from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.models.trip_member import TripMember

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

    db.flush()

    # adiciona owner da viagem como membro da viagem
    owner_member = TripMember(
        trip_id=new_trip.id,
        user_id=trip.owner_id,
        role="owner"
    )

    db.add(owner_member)

    db.commit()

    db.refresh(new_trip)

    return new_trip


@router.get("/", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db)):

    trips = db.query(Trip).all()

    return trips

@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Viagem não encontrada"
        )

    if trip_data.destination is not None:
        trip.destination = trip_data.destination

    if trip_data.image_url is not None:
        trip.image_url = trip_data.image_url

    if trip_data.departure_date is not None:
        trip.departure_date = trip_data.departure_date

    if trip_data.return_date is not None:
        trip.return_date = trip_data.return_date

    if trip_data.is_active is not None:
        trip.is_active = trip_data.is_active

    if trip_data.budget is not None:
        trip.budget = trip_data.budget

    db.commit()

    db.refresh(trip)

    return trip

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: str,
    db: Session = Depends(get_db)
):

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=404,
            detail="Viagem não encontrada"
        )

    db.delete(trip)

    db.commit()

    return {"message": "Viagem deletada"}