from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel): # Esquema para criação de usuário - entrada
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel): # Esquema para resposta de usuário - saída
    id: UUID
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True