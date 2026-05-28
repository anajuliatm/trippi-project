from sqlalchemy import Column, TIMESTAMP, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class TripMember(Base):
    __tablename__ = "trip_members"

    trip_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trips.id", ondelete="CASCADE"),
        primary_key=True
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )

    role = Column(String(20), default="member")

    joined_at = Column(TIMESTAMP, server_default=func.now())