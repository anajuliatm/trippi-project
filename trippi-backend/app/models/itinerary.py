from sqlalchemy import (
    Column,
    String,
    TIMESTAMP,
    Date,
    Time,
    Numeric,
    ForeignKey,
    Text
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

import uuid

from app.database import Base

class Itinerary(Base):
    __tablename__ = "itinerary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    trip_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="CASCADE"),
        nullable=False
    )

    title = Column(String(255), nullable=False)

    description = Column(Text)

    location = Column(String(255))

    activity_date = Column(Date, nullable=False)

    activity_time = Column(Time)

    notes = Column(Text)

    estimated_cost = Column(Numeric(10, 2), default=0)

    created_at = Column(TIMESTAMP, server_default=func.now())