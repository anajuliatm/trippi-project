from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def password_valida(cls, v):
        if not v.strip():
            raise ValueError('A senha não pode conter apenas espaços')
        if len(v) < 4:
            raise ValueError('A senha deve ter pelo menos 4 caracteres')
        if len(v) > 128:
            raise ValueError('A senha deve ter no máximo 128 caracteres')
        return v


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator('username')
    @classmethod
    def username_valido(cls, v):
        stripped = v.strip()
        if not stripped:
            raise ValueError('O username não pode conter apenas espaços')
        if len(stripped) < 3:
            raise ValueError('O username deve ter pelo menos 3 caracteres')
        if len(stripped) > 50:
            raise ValueError('O username deve ter no máximo 50 caracteres')
        return stripped

    @field_validator('password')
    @classmethod
    def password_valida(cls, v):
        if not v.strip():
            raise ValueError('A senha não pode conter apenas espaços')
        if len(v) < 4:
            raise ValueError('A senha deve ter pelo menos 4 caracteres')
        if len(v) > 128:
            raise ValueError('A senha deve ter no máximo 128 caracteres')
        return v


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse