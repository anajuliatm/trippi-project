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

@router.put("/{finance_id}",
            response_model=FinanceResponse)
def update_finance(
    finance_id: str,
    finance_data: FinanceCreate,
    db: Session = Depends(get_db)
):

    finance = (
        db.query(Finance)
        .filter(Finance.id == finance_id)
        .first()
    )

    if not finance:
        raise HTTPException(
            status_code=404,
            detail="Lançamento não encontrado"
        )

    finance.type = finance_data.type
    finance.description = finance_data.description
    finance.amount = finance_data.amount

    db.commit()

    db.refresh(finance)

    return finance

@router.delete("/{finance_id}")
def delete_finance(
    finance_id: str,
    db: Session = Depends(get_db)
):

    finance = (
        db.query(Finance)
        .filter(Finance.id == finance_id)
        .first()
    )

    if not finance:
        raise HTTPException(
            status_code=404,
            detail="Lançamento não encontrado"
        )

    db.delete(finance)

    db.commit()

    return {"message": "Lançamento deletado"}