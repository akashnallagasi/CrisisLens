import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.incident import Incident, EvidenceItem, TimelineEvent, AIAnalysis
from app.schemas.analysis import RunAnalysisRequest
from app.schemas.incident import AIAnalysisResponse
from app.services.meta_client import meta_client

router = APIRouter(prefix="/analysis", tags=["AI Intelligence (Meta Muse Spark)"])

@router.get("/status")
def get_ai_status():
    """
    Returns AI integration transparency status.
    Explicitly indicates whether live Meta Model API credentials are provided
    or whether the platform is operating in local Demonstration Mode.
    """
    return {
        "provider": "Meta Model API",
        "primary_model": settings.META_MODEL_ID,
        "segmentation_model": "meta-sam-3.1",
        "live_api_connected": meta_client.is_live,
        "mode": "Live Meta Model API" if meta_client.is_live else "Demonstration / Preview Mode",
        "safety_guardrails": [
            "Prohibits autonomous safe-road / all-clear declarations",
            "Enforces separation of ground observations from AI inferences",
            "Mandatory responder-in-the-loop verification protocol",
            "Strict non-authoritative advisory disclaimer"
        ],
        "disclaimer": settings.SAFETY_DISCLAIMER
    }

@router.post("/run", response_model=AIAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def run_ai_analysis(payload: RunAnalysisRequest, db: Session = Depends(get_db)):
    """
    Executes Meta Muse Spark multimodal analysis for a disaster incident.
    Synthesizes incoming evidence, assesses hydrological and infrastructural hazards,
    and identifies timeline anomalies.
    """
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence_items = incident.evidence_items
    evidence_descriptions = [
        f"[{e.source_type} at {e.observed_at.strftime('%Y-%m-%d %H:%M:%S UTC')} (submitted: {e.submitted_at.strftime('%H:%M:%S')})]: {e.raw_description}"
        for e in evidence_items
    ]
    has_images = any(e.media_type == "image" for e in evidence_items)

    # Call Meta Model client (live or transparent demo mode)
    result = await meta_client.analyze_incident(
        incident_title=incident.title,
        incident_description=incident.description,
        disaster_type=incident.disaster_type,
        evidence_descriptions=evidence_descriptions,
        has_images=has_images
    )

    # Save to database
    analysis = AIAnalysis(
        incident_id=incident.id,
        model_id=result.model_id,
        created_at=datetime.utcnow(),
        is_simulated=result.is_simulated,
        status=result.status,
        multimodal_summary=result.multimodal_summary,
        hazard_assessment=result.hazard_assessment,
        detected_features=json.dumps(result.detected_features),
        uncertainty_evaluation=result.uncertainty_evaluation,
        confidence_score=result.confidence_score,
        disclaimer=result.disclaimer,
        human_verified=False
    )
    db.add(analysis)

    # Also record an inferred timeline event if model identified critical risk
    if result.confidence_score >= 0.70:
        inferred_tl = TimelineEvent(
            incident_id=incident.id,
            evidence_id=None,
            event_time=datetime.utcnow(),
            recorded_at=datetime.utcnow(),
            event_type="ai_multimodal_synthesis",
            summary=f"[AI Assessment - {result.model_id}] {result.hazard_assessment[:120]}...",
            is_ai_inferred=True,
            confidence_score=result.confidence_score
        )
        db.add(inferred_tl)

    db.commit()
    db.refresh(analysis)

    feats = None
    if analysis.detected_features:
        try:
            feats = json.loads(analysis.detected_features)
        except Exception:
            feats = [analysis.detected_features]

    return AIAnalysisResponse(
        id=analysis.id,
        incident_id=analysis.incident_id,
        model_id=analysis.model_id,
        created_at=analysis.created_at,
        is_simulated=analysis.is_simulated,
        status=analysis.status,
        multimodal_summary=analysis.multimodal_summary,
        hazard_assessment=analysis.hazard_assessment,
        detected_features=feats,
        uncertainty_evaluation=analysis.uncertainty_evaluation,
        confidence_score=analysis.confidence_score,
        disclaimer=analysis.disclaimer,
        human_verified=analysis.human_verified,
        human_notes=analysis.human_notes
    )
