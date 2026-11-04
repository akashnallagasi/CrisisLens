import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import validate_and_save_upload, sanitize_text
from app.models.incident import Incident, EvidenceItem, TimelineEvent, AIAnalysis
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentDetailResponse,
    EvidenceResponse,
    TimelineEventResponse,
    AIAnalysisResponse,
    HumanVerificationUpdate
)
from app.services.timeline_service import timeline_service
from app.services.meta_client import meta_client
from app.services.rag_service import rag_service

router = APIRouter(prefix="/incidents", tags=["Incidents & Evidence"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
def list_incidents(db: Session = Depends(get_db)):
    """
    Returns all registered disaster incidents with aggregated evidence, timeline counts,
    and composite uncertainty scores.
    """
    incidents = db.query(Incident).order_by(Incident.updated_at.desc()).all()
    results = []
    for inc in incidents:
        evidence_items = inc.evidence_items
        latest_obs = max([e.observed_at for e in evidence_items], default=inc.created_at)
        uncertainty = timeline_service.calculate_incident_uncertainty(evidence_items)
        
        results.append(
            IncidentResponse(
                id=inc.id,
                title=inc.title,
                description=inc.description,
                disaster_type=inc.disaster_type,
                severity=inc.severity,
                status=inc.status,
                latitude=inc.latitude,
                longitude=inc.longitude,
                location_name=inc.location_name,
                created_at=inc.created_at,
                updated_at=inc.updated_at,
                evidence_count=len(evidence_items),
                timeline_event_count=len(inc.timeline_events),
                latest_observation_time=latest_obs,
                overall_uncertainty=uncertainty
            )
        )
    return results

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    """
    Registers a new disaster incident.
    """
    cleaned_title = sanitize_text(data.title, 255)
    cleaned_desc = sanitize_text(data.description, 5000)
    cleaned_location = sanitize_text(data.location_name, 255)

    incident = Incident(
        title=cleaned_title,
        description=cleaned_desc,
        disaster_type=data.disaster_type,
        severity=data.severity,
        status=data.status,
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=cleaned_location
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return IncidentResponse(
        id=incident.id,
        title=incident.title,
        description=incident.description,
        disaster_type=incident.disaster_type,
        severity=incident.severity,
        status=incident.status,
        latitude=incident.latitude,
        longitude=incident.longitude,
        location_name=incident.location_name,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        evidence_count=0,
        timeline_event_count=0,
        latest_observation_time=None,
        overall_uncertainty=0.85
    )

@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    """
    Fetches comprehensive incident record including:
    - All multi-source evidence items
    - Reconstructed chronological timeline (ordered by true observation time)
    - Multimodal AI analyses and uncertainty assessments
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence_items = inc.evidence_items
    uncertainty = timeline_service.calculate_incident_uncertainty(evidence_items)
    latest_obs = max([e.observed_at for e in evidence_items], default=inc.created_at)

    # Format evidence items with parsed factors
    ev_responses = []
    for e in evidence_items:
        factors = None
        if e.uncertainty_factors:
            try:
                factors = json.loads(e.uncertainty_factors)
            except Exception:
                factors = [e.uncertainty_factors]
        ev_responses.append(
            EvidenceResponse(
                id=e.id,
                incident_id=e.incident_id,
                source_type=e.source_type,
                source_credibility=e.source_credibility,
                media_type=e.media_type,
                file_path=e.file_path,
                file_size=e.file_size,
                mime_type=e.mime_type,
                observed_at=e.observed_at,
                submitted_at=e.submitted_at,
                verification_status=e.verification_status,
                uncertainty_score=e.uncertainty_score,
                uncertainty_factors=factors,
                raw_description=e.raw_description,
                location_lat=e.location_lat,
                location_lon=e.location_lon
            )
        )

    # Format timeline events
    tl_responses = [
        TimelineEventResponse(
            id=t.id,
            incident_id=t.incident_id,
            evidence_id=t.evidence_id,
            event_time=t.event_time,
            recorded_at=t.recorded_at,
            event_type=t.event_type,
            summary=t.summary,
            is_ai_inferred=t.is_ai_inferred,
            confidence_score=t.confidence_score
        )
        for t in inc.timeline_events
    ]

    # Format AI analyses
    ai_responses = []
    for a in inc.ai_analyses:
        feats = None
        if a.detected_features:
            try:
                feats = json.loads(a.detected_features)
            except Exception:
                feats = [a.detected_features]
        guidelines = None
        if getattr(a, 'rag_guidelines', None):
            try:
                guidelines = json.loads(a.rag_guidelines)
            except Exception:
                guidelines = []
        ai_responses.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "model_id": a.model_id,
            "created_at": a.created_at,
            "is_simulated": a.is_simulated,
            "status": a.status,
            "primary_hazard": getattr(a, "primary_hazard", "Hydrological Inundation"),
            "damage_type": getattr(a, "damage_type", "Structural Submergence"),
            "multimodal_summary": a.multimodal_summary,
            "hazard_assessment": a.hazard_assessment,
            "detected_features": feats,
            "uncertainty_evaluation": a.uncertainty_evaluation,
            "confidence_score": a.confidence_score,
            "rag_guidelines": guidelines,
            "disclaimer": a.disclaimer,
            "human_verified": a.human_verified,
            "human_notes": a.human_notes
        })

    return IncidentDetailResponse(
        id=inc.id,
        title=inc.title,
        description=inc.description,
        disaster_type=inc.disaster_type,
        severity=inc.severity,
        status=inc.status,
        latitude=inc.latitude,
        longitude=inc.longitude,
        location_name=inc.location_name,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
        evidence_count=len(evidence_items),
        timeline_event_count=len(inc.timeline_events),
        latest_observation_time=latest_obs,
        overall_uncertainty=uncertainty,
        evidence_items=ev_responses,
        timeline_events=tl_responses,
        ai_analyses=ai_responses
    )

@router.post("/{incident_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def submit_evidence(
    incident_id: str,
    raw_description: str = Form(..., description="Observed description of the scene"),
    observed_at: datetime = Form(..., description="True ground timestamp when the event was observed"),
    source_type: str = Form("citizen_report", description="citizen_report, first_responder, field_sensor, satellite_feed"),
    location_lat: Optional[float] = Form(None),
    location_lon: Optional[float] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Submits a multi-source evidence item (with optional photo).
    Enforces distinct observation and submission timestamps, safe file validation,
    and automatic timeline integration.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    cleaned_desc = sanitize_text(raw_description, 5000)
    saved_filename = None
    file_mime = None
    file_bytes = None

    if file and file.filename:
        saved_filename, file_mime, file_bytes = await validate_and_save_upload(file)

    now = datetime.utcnow()
    
    # Calculate baseline uncertainty based on source
    credibility_map = {
        "citizen_report": 0.65,
        "first_responder": 0.92,
        "field_sensor": 0.95,
        "satellite_feed": 0.88
    }
    source_cred = credibility_map.get(source_type, 0.70)
    uncertainty_score = round(1.0 - (source_cred * 0.8), 2)
    
    uncertainty_factors = [
        f"Submitted via {source_type.replace('_', ' ')} channel",
        f"Observation-to-submission latency: {int((now - observed_at).total_seconds() / 60)} minutes"
    ]
    if not file:
        uncertainty_factors.append("No photographic evidence attached (text only)")

    evidence = EvidenceItem(
        incident_id=incident_id,
        source_type=source_type,
        source_credibility=source_cred,
        media_type="image" if saved_filename else "text_report",
        file_path=saved_filename,
        file_size=file_bytes,
        mime_type=file_mime,
        observed_at=observed_at,
        submitted_at=now,
        verification_status="unverified",
        uncertainty_score=uncertainty_score,
        uncertainty_factors=json.dumps(uncertainty_factors),
        raw_description=cleaned_desc,
        location_lat=location_lat or inc.latitude,
        location_lon=location_lon or inc.longitude
    )
    db.add(evidence)
    db.flush()

    # Automatically integrate this evidence into the chronological timeline
    timeline_event = TimelineEvent(
        incident_id=incident_id,
        evidence_id=evidence.id,
        event_time=observed_at,
        recorded_at=now,
        event_type="field_observation_reported",
        summary=f"[{source_type.replace('_', ' ').title()}] {cleaned_desc[:120]}...",
        is_ai_inferred=False,
        confidence_score=source_cred
    )
    db.add(timeline_event)

    inc.updated_at = now
    db.commit()
    db.refresh(evidence)

    return EvidenceResponse(
        id=evidence.id,
        incident_id=evidence.incident_id,
        source_type=evidence.source_type,
        source_credibility=evidence.source_credibility,
        media_type=evidence.media_type,
        file_path=evidence.file_path,
        file_size=evidence.file_size,
        mime_type=evidence.mime_type,
        observed_at=evidence.observed_at,
        submitted_at=evidence.submitted_at,
        verification_status=evidence.verification_status,
        uncertainty_score=evidence.uncertainty_score,
        uncertainty_factors=uncertainty_factors,
        raw_description=evidence.raw_description,
        location_lat=evidence.location_lat,
        location_lon=evidence.location_lon
    )

@router.get("/evidence/{evidence_id}/file")
def get_evidence_file(evidence_id: str, db: Session = Depends(get_db)):
    """
    Safely retrieves an uploaded evidence file.
    Validates that the file exists and is within the upload sandbox.
    """
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == evidence_id).first()
    if not evidence or not evidence.file_path:
        raise HTTPException(status_code=404, detail="Evidence file not found")

    file_path = (settings.UPLOAD_DIR / evidence.file_path).resolve()
    # Path traversal protection
    if not str(file_path).startswith(str(settings.UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")

    if not file_path.exists():
        # Fallback to sample placeholder image if local file is synthetic
        placeholder_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
            <rect width="100%" height="100%" fill="#1e293b"/>
            <text x="50%" y="45%" fill="#94a3b8" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">CrisisLens Evidence Capture</text>
            <text x="50%" y="55%" fill="#64748b" font-family="sans-serif" font-size="14" text-anchor="middle">{evidence.raw_description[:40]}</text>
        </svg>"""
        return FileResponse(
            status_code=200,
            content=placeholder_svg.encode("utf-8"),
            media_type="image/svg+xml"
        )

    return FileResponse(file_path, media_type=evidence.mime_type or "image/jpeg")

@router.patch("/{incident_id}/analysis/{analysis_id}/verify")
def update_human_verification(
    incident_id: str,
    analysis_id: str,
    data: HumanVerificationUpdate,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop verification endpoint. Allows an authorized emergency responder
    to verify or flag an AI assessment.
    """
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.id == analysis_id, AIAnalysis.incident_id == incident_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="AI analysis record not found")

    analysis.human_verified = data.human_verified
    if data.human_notes:
        analysis.human_notes = sanitize_text(data.human_notes, 2000)

    db.commit()
    return {"status": "success", "human_verified": analysis.human_verified, "notes": analysis.human_notes}

@router.post("/{incident_id}/analyze", response_model=AIAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_incident_endpoint(incident_id: str, db: Session = Depends(get_db)):
    """
    Meta Muse Spark multimodal analysis for an incident.
    Extracts:
    a) Primary Hazard & Damage Type
    b) Visible Structural/Flood Evidence
    c) AI Uncertainty & Confidence Rating
    d) Evidence-aware RAG disaster protocols from FEMA / NDMA
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence_items = inc.evidence_items
    evidence_descriptions = [
        f"[{e.source_type} at {e.observed_at.strftime('%Y-%m-%d %H:%M:%S UTC')} (delay: {int((e.submitted_at - e.observed_at).total_seconds()/60)}m)]: {e.raw_description}"
        for e in evidence_items
    ]
    has_images = any(e.media_type == "image" for e in evidence_items)

    result = await meta_client.analyze_incident(
        incident_title=inc.title,
        incident_description=inc.description,
        disaster_type=inc.disaster_type,
        evidence_descriptions=evidence_descriptions,
        has_images=has_images
    )

    analysis = AIAnalysis(
        incident_id=inc.id,
        model_id=result.model_id,
        created_at=datetime.utcnow(),
        is_simulated=result.is_simulated,
        status=result.status,
        primary_hazard=result.primary_hazard,
        damage_type=result.damage_type,
        multimodal_summary=result.multimodal_summary,
        hazard_assessment=result.hazard_assessment,
        detected_features=json.dumps(result.detected_features),
        uncertainty_evaluation=result.uncertainty_evaluation,
        confidence_score=result.confidence_score,
        rag_guidelines=json.dumps(result.rag_guidelines),
        disclaimer=result.disclaimer,
        human_verified=False
    )
    db.add(analysis)

    # Inferred timeline event
    if result.confidence_score >= 0.70:
        inferred_tl = TimelineEvent(
            incident_id=inc.id,
            evidence_id=None,
            event_time=datetime.utcnow(),
            recorded_at=datetime.utcnow(),
            event_type="ai_multimodal_synthesis",
            summary=f"[Meta Muse Spark] Primary Hazard: {result.primary_hazard}. Damage: {result.damage_type}. {result.hazard_assessment[:100]}...",
            is_ai_inferred=True,
            confidence_score=result.confidence_score
        )
        db.add(inferred_tl)

    db.commit()
    db.refresh(analysis)

    return AIAnalysisResponse(
        id=analysis.id,
        incident_id=analysis.incident_id,
        model_id=analysis.model_id,
        created_at=analysis.created_at,
        is_simulated=analysis.is_simulated,
        status=analysis.status,
        primary_hazard=analysis.primary_hazard,
        damage_type=analysis.damage_type,
        multimodal_summary=analysis.multimodal_summary,
        hazard_assessment=analysis.hazard_assessment,
        detected_features=result.detected_features,
        uncertainty_evaluation=analysis.uncertainty_evaluation,
        confidence_score=analysis.confidence_score,
        rag_guidelines=result.rag_guidelines,
        disclaimer=analysis.disclaimer,
        human_verified=analysis.human_verified,
        human_notes=analysis.human_notes
    )

@router.get("/{incident_id}/protocols")
def get_incident_protocols(incident_id: str, db: Session = Depends(get_db)):
    """
    Returns relevant FEMA and NDMA disaster response guidelines and standard operating
    procedures for this incident based on its hazard classification and evidence.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence_text = " ".join([e.raw_description for e in inc.evidence_items[:3]])
    query = f"{inc.disaster_type} {inc.title} {evidence_text}"
    
    guidelines = rag_service.search_guidelines(
        query=query,
        category=inc.disaster_type,
        top_k=4
    )
    return {
        "incident_id": incident_id,
        "disaster_type": inc.disaster_type,
        "query_matched": query,
        "protocols": guidelines
    }

from pydantic import BaseModel
class ResponderActionRequest(BaseModel):
    action: str  # mark_verified, flag_more_evidence, escalate_priority
    notes: Optional[str] = None

@router.post("/{incident_id}/action")
def execute_responder_action(
    incident_id: str,
    data: ResponderActionRequest,
    db: Session = Depends(get_db)
):
    """
    Executes first-responder verification action:
    - mark_verified: Approves ground-truth evidence & marks AI assessment verified
    - flag_more_evidence: Flags gaps and requests aerial/ground recon
    - escalate_priority: Elevates incident severity to CRITICAL
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.utcnow()
    user_note = sanitize_text(data.notes or "", 500)

    if data.action == "mark_verified":
        # Mark all attached evidence as verified
        for ev in inc.evidence_items:
            ev.verification_status = "verified_by_official"
            ev.uncertainty_score = max(0.05, ev.uncertainty_score * 0.4)
        
        # Mark latest AI analysis verified
        if inc.ai_analyses:
            latest_ai = inc.ai_analyses[0]
            latest_ai.human_verified = True
            latest_ai.human_notes = user_note or "Verified on-site by Incident Command Officer"

        # Add timeline milestone
        tl = TimelineEvent(
            incident_id=inc.id,
            evidence_id=None,
            event_time=now,
            recorded_at=now,
            event_type="responder_verification_approved",
            summary=f"Incident ground reality officially VERIFIED by Field Responder. {user_note}",
            is_ai_inferred=False,
            confidence_score=0.98
        )
        db.add(tl)
        message = "Incident and AI analysis marked as officially verified."

    elif data.action == "flag_more_evidence":
        tl = TimelineEvent(
            incident_id=inc.id,
            evidence_id=None,
            event_time=now,
            recorded_at=now,
            event_type="evidence_gap_flagged",
            summary=f"RECONNAISSANCE REQUESTED: First responder flagged evidence as insufficient. {user_note}",
            is_ai_inferred=False,
            confidence_score=0.50
        )
        db.add(tl)
        message = "Evidence flagged as requiring additional ground/aerial reconnaissance."

    elif data.action == "escalate_priority":
        inc.severity = "critical"
        tl = TimelineEvent(
            incident_id=inc.id,
            evidence_id=None,
            event_time=now,
            recorded_at=now,
            event_type="priority_escalated_critical",
            summary=f"PRIORITY ESCALATED: Severity elevated to CRITICAL by on-scene commander. {user_note}",
            is_ai_inferred=False,
            confidence_score=0.95
        )
        db.add(tl)
        message = "Incident severity escalated to CRITICAL priority."

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {data.action}")

    inc.updated_at = now
    db.commit()
    return {"status": "success", "action": data.action, "message": message}
