import uuid
from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class RescueContact(Base):
    __tablename__ = "rescue_contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    contact_type = Column(String(50), nullable=False)  # water_rescue, national_force, police_fire, medical_ems, shelter_relief
    phone_hotline = Column(String(50), nullable=False)
    alt_phone = Column(String(50), nullable=True)
    coverage_city = Column(String(100), nullable=False, default="Coastal Metro Sector")
    coverage_radius_km = Column(Float, nullable=False, default=25.0)
    availability_status = Column(String(50), nullable=False, default="24/7 Active")  # 24/7 Active, Standby, Deployed
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    specialization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
