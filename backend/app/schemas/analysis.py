from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class RunAnalysisRequest(BaseModel):
    incident_id: str
    focus_area: Optional[str] = Field("multimodal_hazard_assessment", description="Analysis objective")
    include_segmentation: bool = Field(False, description="Attempt SAM 3.1 segmentation if model is configured")
    temperature: float = Field(0.2, ge=0.0, le=1.0)

class AIAnalysisResultValidated(BaseModel):
    model_id: str
    is_simulated: bool
    status: str
    primary_hazard: str = Field(..., description="Primary hazard classification, e.g. Hydrological Inundation")
    damage_type: str = Field(..., description="Damage type, e.g. Embankment Overwash & Scour")
    multimodal_summary: str
    hazard_assessment: str
    detected_features: List[str] = Field(..., description="Visible structural and flood evidence detected from imagery/sensors")
    uncertainty_evaluation: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    rag_guidelines: List[dict] = Field(default_factory=list, description="Matched official FEMA/NDMA protocols with citations")
    disclaimer: str
    prohibited_actions_checked: bool = Field(True, description="Enforces that AI did not declare safe zones or issue authoritative instructions")
