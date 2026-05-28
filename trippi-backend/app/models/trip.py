from sqlalchemy import (
    Column,
    String,
    TIMESTAMP,
    Boolean,
    Date,
    Numeric,
    ForeignKey
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

import uuid

from app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    destination = Column(String(255), nullable=False)

    image_url = Column(String)

    departure_date = Column(Date, nullable=False)

    return_date = Column(Date, nullable=False)

    is_active = Column(Boolean, default=True)

    budget = Column(Numeric(10, 2), default=0)

    created_at = Column(TIMESTAMP, server_default=func.now())

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )