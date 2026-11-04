from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

# ----------------- Evidence Schemas -----------------
class EvidenceBase(BaseModel):
    source_type: str = Field(..., description="Source origin (citizen_report, satellite_feed, field_sensor, first_responder)")
    source_credibility: float = Field(0.7, ge=0.0, le=1.0)
    media_type: str = Field("image", description="Type of evidence media")
    observed_at: datetime = Field(..., description="When the incident ground reality actually occurred")
    raw_description: str = Field(..., min_length=3, max_length=5000)
    verification_status: str = Field("unverified", description="unverified, corroborated, verified_by_official, disputed")
    uncertainty_score: float = Field(0.3, ge=0.0, le=1.0)
    uncertainty_factors: Optional[List[str]] = None
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceResponse(EvidenceBase):
    id: str
    incident_id: str
    file_path: Optional[str] = None
    file_size: Optional[float] = None
    mime_type: Optional[str] = None
    submitted_at: datetime
    
    class Config:
        from_attributes = True

# ----------------- Timeline Schemas -----------------
class TimelineEventBase(BaseModel):
    event_time: datetime = Field(..., description="Observation timestamp of the milestone")
    event_type: str = Field(..., description="Type of event (breach, water_level_spike, road_submerged, etc.)")
    summary: str = Field(..., min_length=3)
    is_ai_inferred: bool = Field(False, description="Whether event was inferred by AI model vs observed directly")
    confidence_score: float = Field(0.8, ge=0.0, le=1.0)
    evidence_id: Optional[str] = None

class TimelineEventCreate(TimelineEventBase):
    incident_id: str

class TimelineEventResponse(TimelineEventBase):
    id: str
    incident_id: str
    recorded_at: datetime

    class Config:
        from_attributes = True

# ----------------- AI Analysis Schemas -----------------
class AIAnalysisResponse(BaseModel):
    id: str
    incident_id: str
    model_id: str
    created_at: datetime
    is_simulated: bool
    status: str
    primary_hazard: Optional[str] = "Hydrological Inundation"
    damage_type: Optional[str] = "Embankment Erosion & Structural Submergence"
    multimodal_summary: str
    hazard_assessment: str
    detected_features: Optional[List[str]] = None
    uncertainty_evaluation: str
    confidence_score: float
    rag_guidelines: Optional[List[dict]] = None
    disclaimer: str
    human_verified: bool
    human_notes: Optional[str] = None

    class Config:
        from_attributes = True

class HumanVerificationUpdate(BaseModel):
    human_verified: bool
    human_notes: Optional[str] = None

# ----------------- Incident Schemas -----------------
class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5, max_length=5000)
    disaster_type: str = Field("flood", description="flood, cyclone, landslide, storm_surge, etc.")
    severity: str = Field("high", description="critical, high, moderate, low")
    status: str = Field("active", description="active, monitoring, contained, resolved")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: str = Field(..., min_length=2, max_length=255)

class IncidentCreate(IncidentBase):
    # Optional first evidence observation time and initial report
    initial_observed_at: Optional[datetime] = None

class IncidentResponse(IncidentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    timeline_event_count: int = 0
    latest_observation_time: Optional[datetime] = None
    overall_uncertainty: float = 0.35

    class Config:
        from_attributes = True

class IncidentDetailResponse(IncidentResponse):
    evidence_items: List[EvidenceResponse] = []
    timeline_events: List[TimelineEventResponse] = []
    ai_analyses: List[AIAnalysisResponse] = []

    class Config:
        from_attributes = True
