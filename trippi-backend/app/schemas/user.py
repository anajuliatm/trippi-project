from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel): # Esquema para criação de usuário - entrada
    username: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=4, max_length=128)

    @field_validator('username', mode='before')
    @classmethod
    def username_nao_pode_ser_espacos(cls, v):
        if v is None:
            return v
        stripped = v.strip()
        if len(stripped) < 3:
            raise ValueError('username deve ter pelo menos 3 caracteres além de espaços')
        return stripped

    @field_validator('password', mode='before')
    @classmethod
    def password_valida(cls, v):
        if v is None:
            return v
        if not v.strip():
            raise ValueError('senha não pode conter apenas espaços')
        if len(v) < 4:
            raise ValueError('senha deve ter pelo menos 4 caracteres')
        return v

class UserResponse(BaseModel): # Esquema para resposta de usuário - saída
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True