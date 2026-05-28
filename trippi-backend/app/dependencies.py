# Cria e fecha conexão com o banco de dados automaticamente.
from app.database import SessionLocal

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()