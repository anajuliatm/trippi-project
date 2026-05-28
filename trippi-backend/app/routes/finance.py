from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.finance import Finance
from app.schemas.finance import (
    FinanceCreate,
    FinanceResponse
)

router = APIRouter(
    prefix="/finance",
    tags=["Finance"]
)

@router.post("/", response_model=FinanceResponse)
def create_entry(
    entry: FinanceCreate,
    db: Session = Depends(get_db)
):

    new_entry = Finance(**entry.model_dump())

    db.add(new_entry)

    db.commit()

    db.refresh(new_entry)

    return new_entry


@router.get("/trip/{trip_id}",
            response_model=list[FinanceResponse])
def get_trip_finance(
    trip_id: str,
    db: Session = Depends(get_db)
):

    entries = (
        db.query(Finance)
        .filter(Finance.trip_id == trip_id)
        .all()
    )

    return entries