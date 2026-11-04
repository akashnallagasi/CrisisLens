import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    disaster_type = Column(String(50), nullable=False, default="flood")
    severity = Column(String(30), nullable=False, default="high")  # critical, high, moderate, low
    status = Column(String(30), nullable=False, default="active")  # active, monitoring, contained, resolved
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=False)
    
    # Crucial timestamp separation
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    evidence_items = relationship("EvidenceItem", back_populates="incident", cascade="all, delete-orphan", order_by="EvidenceItem.observed_at")
    timeline_events = relationship("TimelineEvent", back_populates="incident", cascade="all, delete-orphan", order_by="TimelineEvent.event_time")
    ai_analyses = relationship("AIAnalysis", back_populates="incident", cascade="all, delete-orphan", order_by="AIAnalysis.created_at.desc()")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    
    # Source and authenticity
    source_type = Column(String(50), nullable=False, default="citizen_report") # citizen_report, satellite_feed, field_sensor, first_responder
    source_credibility = Column(Float, nullable=False, default=0.7) # 0.0 to 1.0
    media_type = Column(String(30), nullable=False, default="image") # image, sensor, text_report
    
    # Secure storage (never executable, uuid filename)
    file_path = Column(String(255), nullable=True)
    file_size = Column(Float, nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # CRITICAL: Separate Observation Time from Submission Time
    # observed_at is when the ground reality occurred; submitted_at is when the platform received it.
    observed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Evidence status & uncertainty tracking
    verification_status = Column(String(40), nullable=False, default="unverified") # unverified, corroborated, verified_by_official, disputed
    uncertainty_score = Column(Float, nullable=False, default=0.35) # 0.0 (high confidence) to 1.0 (high uncertainty)
    uncertainty_factors = Column(Text, nullable=True) # JSON list string of explanatory factors
    
    raw_description = Column(Text, nullable=False)
    location_lat = Column(Float, nullable=True)
    location_lon = Column(Float, nullable=True)

    incident = relationship("Incident", back_populates="evidence_items")
    timeline_events = relationship("TimelineEvent", back_populates="evidence")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    evidence_id = Column(String(36), ForeignKey("evidence_items.id"), nullable=True)
    
    # The factual ground timestamp when this milestone occurred
    event_time = Column(DateTime, nullable=False)
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    event_type = Column(String(50), nullable=False) # water_level_spike, breach_observed, access_blocked, evacuation_recommended
    summary = Column(Text, nullable=False)
    
    # Clear distinction: Is this an empirical observation or an AI-inferred event?
    is_ai_inferred = Column(Boolean, nullable=False, default=False)
    confidence_score = Column(Float, nullable=False, default=0.8)

    incident = relationship("Incident", back_populates="timeline_events")
    evidence = relationship("EvidenceItem", back_populates="timeline_events")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    
    model_id = Column(String(100), nullable=False, default="meta-muse-spark-preview")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Transparent indicator: True if running in demonstration/mock mode without live credentials
    is_simulated = Column(Boolean, nullable=False, default=True)
    status = Column(String(30), nullable=False, default="completed")
    
    # Multimodal assessment
    primary_hazard = Column(String(255), nullable=True, default="Hydrological Inundation")
    damage_type = Column(String(255), nullable=True, default="Embankment Erosion & Structural Submergence")
    multimodal_summary = Column(Text, nullable=False)
    hazard_assessment = Column(Text, nullable=False)
    detected_features = Column(Text, nullable=True) # JSON list string of visible structural/flood evidence
    uncertainty_evaluation = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.75)
    rag_guidelines = Column(Text, nullable=True) # JSON list of matched FEMA/NDMA protocols with citations
    
    # Mandatory non-authoritative disclaimer
    disclaimer = Column(Text, nullable=False)
    
    # Human-in-the-loop validation
    human_verified = Column(Boolean, nullable=False, default=False)
    human_notes = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="ai_analyses")
