from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EmergencyContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., description="police, hospital, fema_ndma")
    phone: str = Field(..., min_length=3, max_length=50)
    alt_phone: Optional[str] = None
    address: str = Field(..., min_length=4, max_length=500)
    latitude: float
    longitude: float
    coverage_radius_km: float = 20.0
    availability_status: str = "24/7 Active"
    trust_status: str = "pending_verification"
    specialization: Optional[str] = None


class EmergencyContactCreate(EmergencyContactBase):
    pass


class DispatchLogResponse(BaseModel):
    id: str
    contact_id: str
    previous_status: str
    new_status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmergencyContactResponse(EmergencyContactBase):
    id: str
    created_at: datetime
    last_dispatched_at: Optional[datetime] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class DispatchTriggerRequest(BaseModel):
    notes: Optional[str] = Field(
        default="Emergency trigger initiated from CrisisLens dispatch panel.",
        max_length=500,
    )
