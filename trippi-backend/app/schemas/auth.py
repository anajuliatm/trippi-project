from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)
    @field_validator('password')
    @classmethod
    def password_valida(cls, v):
        if not v.strip():
            raise ValueError('senha não pode conter apenas espaços')
        if len(v) < 4:
            raise ValueError('senha deve ter pelo menos 4 caracteres')
        return v


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(max_length=128)

    @field_validator('username')
    @classmethod
    def username_nao_pode_ser_espacos(cls, v):
        stripped = v.strip()
        if len(stripped) < 3:
            raise ValueError('username deve ter pelo menos 3 caracteres além de espaços')
        return stripped
    
    @field_validator('password')
    @classmethod
    def password_valida(cls, v):
        if not v.strip():
            raise ValueError('senha não pode conter apenas espaços')
        if len(v) < 4:
            raise ValueError('senha deve ter pelo menos 4 caracteres')
        return v


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse