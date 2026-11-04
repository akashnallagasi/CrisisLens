from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.rescue_contacts import RescueContact
from app.schemas.rescue import RescueContactResponse, RescueContactCreate

router = APIRouter(prefix="/rescue-contacts", tags=["Emergency Rescue & Dispatch"])

@router.get("", response_model=List[RescueContactResponse])
def get_rescue_contacts(
    contact_type: Optional[str] = Query(None, description="Filter by contact_type"),
    availability_status: Optional[str] = Query(None, description="Filter by availability"),
    db: Session = Depends(get_db)
):
    """
    Returns verified emergency response units, hotlines, and rescue stations.
    """
    query = db.query(RescueContact)
    if contact_type and contact_type != "all":
        query = query.filter(RescueContact.contact_type == contact_type)
    if availability_status and availability_status != "all":
        query = query.filter(RescueContact.availability_status == availability_status)
    return query.order_by(RescueContact.name.asc()).all()

@router.post("", response_model=RescueContactResponse, status_code=status.HTTP_201_CREATED)
def create_rescue_contact(data: RescueContactCreate, db: Session = Depends(get_db)):
    """
    Registers a new emergency response unit or helpline.
    """
    contact = RescueContact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
