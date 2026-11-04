from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RescueContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    contact_type: str = Field(..., description="water_rescue, national_force, police_fire, medical_ems, shelter_relief")
    phone_hotline: str = Field(..., min_length=3, max_length=50)
    alt_phone: Optional[str] = None
    coverage_city: str = "Coastal Metro Sector"
    coverage_radius_km: float = 25.0
    availability_status: str = "24/7 Active"
    latitude: float
    longitude: float
    specialization: Optional[str] = None

class RescueContactCreate(RescueContactBase):
    pass

class RescueContactResponse(RescueContactBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
