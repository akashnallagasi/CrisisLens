import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class EmergencyContact(Base):
    """Nearby police, hospital, and FEMA/NDMA dispatch entities."""

    __tablename__ = "emergency_contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # police, hospital, fema_ndma
    phone = Column(String(50), nullable=False)
    alt_phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    coverage_radius_km = Column(Float, nullable=False, default=20.0)
    availability_status = Column(String(50), nullable=False, default="24/7 Active")
    trust_status = Column(String(80), nullable=False, default="pending_verification")
    specialization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_dispatched_at = Column(DateTime, nullable=True)

    dispatch_logs = relationship(
        "DispatchLog",
        back_populates="contact",
        cascade="all, delete-orphan",
        order_by="DispatchLog.created_at.desc()",
    )


class DispatchLog(Base):
    """Human-in-the-loop audit trail for responder status updates."""

    __tablename__ = "dispatch_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    contact_id = Column(String(36), ForeignKey("emergency_contacts.id"), nullable=False)
    previous_status = Column(String(80), nullable=False)
    new_status = Column(String(80), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    contact = relationship("EmergencyContact", back_populates="dispatch_logs")
