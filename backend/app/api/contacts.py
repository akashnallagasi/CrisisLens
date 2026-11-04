import logging
import math
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import sanitize_text
from app.models.emergency_contact import EmergencyContact, DispatchLog
from app.schemas.contact import (
    EmergencyContactResponse,
    DispatchLogResponse,
    DispatchTriggerRequest,
)

logger = logging.getLogger("crisislens.contacts")

router = APIRouter(prefix="/contacts", tags=["Emergency Contacts & Dispatch"])

DEFAULT_ORIGIN_LAT = 13.0827
DEFAULT_ORIGIN_LON = 80.2707


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return round(radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def _to_response(contact: EmergencyContact, origin_lat: float, origin_lon: float) -> EmergencyContactResponse:
    payload = EmergencyContactResponse.model_validate(contact)
    payload.distance_km = _haversine_km(origin_lat, origin_lon, contact.latitude, contact.longitude)
    return payload


@router.get("", response_model=List[EmergencyContactResponse])
@router.get("/", response_model=List[EmergencyContactResponse])
def list_emergency_contacts(
    category: Optional[str] = Query(None, description="Filter: police, hospital, fema_ndma"),
    lat: float = Query(DEFAULT_ORIGIN_LAT, description="Origin latitude for nearby ranking"),
    lon: float = Query(DEFAULT_ORIGIN_LON, description="Origin longitude for nearby ranking"),
    radius_km: float = Query(75.0, ge=1.0, le=500.0),
    db: Session = Depends(get_db),
):
    """
    Returns nearby emergency entities (police control rooms, city hospitals, FEMA/NDMA nodes).
    Ranked by distance from the provided origin (defaults to the active coastal incident sector).
    """
    query = db.query(EmergencyContact)
    if category and category != "all":
        query = query.filter(EmergencyContact.category == category)

    contacts = query.all()
    nearby = []
    for contact in contacts:
        item = _to_response(contact, lat, lon)
        if item.distance_km is not None and item.distance_km <= radius_km:
            nearby.append(item)

    nearby.sort(key=lambda c: (c.distance_km or 0, c.name))
    return nearby


@router.post("/{contact_id}/dispatch", response_model=EmergencyContactResponse)
def trigger_dispatch(
    contact_id: str,
    data: DispatchTriggerRequest,
    db: Session = Depends(get_db),
):
    """
    Human-in-the-loop emergency trigger. Logs the responder status transition
    from pending verification to dispatched & verified.
    """
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")

    previous = contact.trust_status
    now = datetime.utcnow()
    notes = sanitize_text(data.notes or "Emergency trigger initiated from CrisisLens dispatch panel.", 500)

    contact.trust_status = "dispatched_verified"
    contact.availability_status = "Deployed"
    contact.last_dispatched_at = now

    log = DispatchLog(
        contact_id=contact.id,
        previous_status=previous,
        new_status="dispatched_verified",
        notes=notes,
        created_at=now,
    )
    db.add(log)
    db.commit()
    db.refresh(contact)

    logger.info(
        "Dispatch logged contact=%s previous=%s new=%s notes=%s",
        contact.id,
        previous,
        contact.trust_status,
        notes,
    )
    return _to_response(contact, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LON)


@router.get("/{contact_id}/logs", response_model=List[DispatchLogResponse])
def list_dispatch_logs(contact_id: str, db: Session = Depends(get_db)):
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")
    return (
        db.query(DispatchLog)
        .filter(DispatchLog.contact_id == contact_id)
        .order_by(DispatchLog.created_at.desc())
        .all()
    )
