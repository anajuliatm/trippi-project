from sqlalchemy import (
    Column,
    String,
    TIMESTAMP,
    Numeric,
    ForeignKey,
    Text
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

import uuid

from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    trip_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )

    from_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    to_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    amount = Column(Numeric(10, 2), nullable=False)

    note = Column(Text)

    status = Column(String(20), default="pending")

    created_at = Column(TIMESTAMP, server_default=func.now())

    settled_at = Column(TIMESTAMP)