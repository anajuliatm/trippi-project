from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserEmailLookup, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post(
    "/",
    response_model=UserResponse,
    summary="Criar usuário",
    description="Cria um novo usuário."
)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(
            or_(
                func.lower(User.email) == func.lower(user.email),
                func.lower(User.username) == func.lower(user.username),
            )
        )
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Email ou username já cadastrados")


    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user

@router.get(
    "/by-email",
    response_model=UserResponse,
    summary="Buscar usuário por email",
    description="Retorna um usuário pelo email."
)
def get_user_by_email(
    email: str = Query(..., description="Email do usuário"),
    db: Session = Depends(get_db)
):
    lookup = UserEmailLookup(email=email)

    user = (
        db.query(User)
        .filter(func.lower(User.email) == func.lower(lookup.email))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    return user

@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Buscar usuário",
    description="Retorna um usuário pelo identificador."
)
def get_user(
    user_id: str = Path(..., description="ID do usuário"),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    return user

@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Atualizar usuário",
    description="Atualiza parcialmente um usuário existente."
)
def update_user(
    user_data: UserUpdate,
    user_id: str = Path(..., description="ID do usuário"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce não pode editar este usuário",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    conflict_filters = []

    if user_data.email is not None:
      conflict_filters.append(func.lower(User.email) == func.lower(user_data.email))

    if user_data.username is not None:
      conflict_filters.append(func.lower(User.username) == func.lower(user_data.username))

    if conflict_filters:
        existing_user = (
            db.query(User)
            .filter(User.id != user.id)
            .filter(or_(*conflict_filters))
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email ou username já cadastrados",
            )

    if user_data.username is not None:
        user.username = user_data.username

    if user_data.email is not None:
        user.email = user_data.email

    if user_data.password is not None:
        user.password = hash_password(user_data.password)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email ou username já cadastrados",
        )

    db.refresh(user)

    return user

@router.delete(
    "/{user_id}",
    summary="Excluir usuário",
    description="Remove um usuário pelo identificador."
)
def delete_user(
    user_id: str = Path(..., description="ID do usuário"),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    db.delete(user)

    db.commit()

    return {"message": "Usuário deletado"}