from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastrar usuário",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email_taken = (
        db.query(User)
        .filter(func.lower(User.email) == func.lower(payload.email))
        .first()
    )
    username_taken = (
        db.query(User)
        .filter(func.lower(User.username) == func.lower(payload.username))
        .first()
    )

    conflict_errors = []
    if email_taken:
        conflict_errors.append("Email já cadastrado.")
    if username_taken:
        conflict_errors.append("Username já cadastrado.")
    if conflict_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="\n".join(conflict_errors),
        )

    new_user = User(
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),
    )

    db.add(new_user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou username já cadastrados.",
        )

    db.refresh(new_user)

    access_token = create_access_token(str(new_user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login do usuário",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )

    access_token = create_access_token(str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Usuário autenticado",
)
def me(current_user: User = Depends(get_current_user)):
    return current_user