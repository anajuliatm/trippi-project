from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class TripCreate(BaseModel):
    destination: str
    image_url: str | None = None
    departure_date: date
    return_date: date
    budget: Decimal = 0

    @field_validator('destination')
    @classmethod
    def destination_valido(cls, v):
        stripped = v.strip()
        if not stripped:
            raise ValueError('O destino não pode estar vazio.')
        if len(stripped) > 255:
            raise ValueError('O destino deve ter no máximo 255 caracteres.')
        return stripped

    @field_validator('budget')
    @classmethod
    def budget_nao_negativo(cls, v):
        if v < 0:
            raise ValueError('O orçamento não pode ser negativo.')
        return v

    @model_validator(mode='after')
    def datas_validas(self):
        if self.return_date < self.departure_date:
            raise ValueError('A data de volta não pode ser anterior à data de ida.')
        return self

class TripUpdate(BaseModel):
    destination: Optional[str] = None
    image_url: Optional[str] = None
    departure_date: Optional[date] = None
    return_date: Optional[date] = None
    is_active: Optional[bool] = None
    budget: Optional[float] = None

    @field_validator('destination')
    @classmethod
    def destination_valido(cls, v):
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError('O destino não pode estar vazio.')
        if len(stripped) > 255:
            raise ValueError('O destino deve ter no máximo 255 caracteres.')
        return stripped

    @field_validator('budget')
    @classmethod
    def budget_nao_negativo(cls, v):
        if v is not None and v < 0:
            raise ValueError('O orçamento não pode ser negativo.')
        return v

    @model_validator(mode='after')
    def datas_validas(self):
        if self.departure_date is not None and self.return_date is not None:
            if self.return_date < self.departure_date:
                raise ValueError('A data de volta não pode ser anterior à data de ida.')
        return self

class TripResponse(BaseModel):
    id: UUID
    owner_id: UUID
    destination: str
    image_url: str | None
    departure_date: date
    return_date: date
    is_active: bool
    budget: Decimal
    created_at: datetime

    class Config:
        from_attributes = True