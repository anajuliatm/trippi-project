from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.security import hash_password
from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

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
                User.email == user.email,
                User.username == user.username,
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

    if user_data.username is not None:
        user.username = user_data.username

    if user_data.email is not None:
        user.email = user_data.email

    if user_data.password is not None:
        user.password = hash_password(user_data.password)

    db.commit()

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