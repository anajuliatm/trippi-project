from pydantic import BaseModel, EmailStr, field_validator
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
    password: Optional[str] = None

    @field_validator('username', mode='before')
    @classmethod
    def username_valido(cls, v):
        if v is None:
            return v
        stripped = v.strip()
        if not stripped:
            raise ValueError('O username não pode conter apenas espaços.')
        if len(stripped) < 3:
            raise ValueError('O username deve ter pelo menos 3 caracteres.')
        if len(stripped) > 50:
            raise ValueError('O username deve ter no máximo 50 caracteres.')
        return stripped

    @field_validator('password', mode='before')
    @classmethod
    def password_valida(cls, v):
        if v is None:
            return v
        if not v.strip():
            raise ValueError('A senha não pode conter apenas espaços.')
        if len(v) < 4:
            raise ValueError('A senha deve ter pelo menos 4 caracteres.')
        if len(v) > 128:
            raise ValueError('A senha deve ter no máximo 128 caracteres.')
        return v

class UserEmailLookup(BaseModel):
    email: EmailStr

class UserResponse(BaseModel): # Esquema para resposta de usuário - saída
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True