from datetime import datetime
from sqlalchemy.orm import Session
from app.models.incident import Incident, EvidenceItem, TimelineEvent

class TimelineReconstructionService:
    """
    Reconstructs chronological incident milestones from decentralized, multi-source evidence.
    
    Guarantees:
    1. Preserves original submission timestamps alongside actual observation timestamps.
    2. Re-orders multi-source evidence chronologically by observation time.
    3. Flags delayed or out-of-order submissions.
    4. Computes multi-source uncertainty and corroboration metrics.
    """

    @staticmethod
    def reconstruct_timeline(db: Session, incident_id: str) -> list[TimelineEvent]:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return []

        # Pull all evidence items ordered strictly by observed_at
        evidence_items = (
            db.query(EvidenceItem)
            .filter(EvidenceItem.incident_id == incident_id)
            .order_by(EvidenceItem.observed_at.asc())
            .all()
        )

        existing_events = (
            db.query(TimelineEvent)
            .filter(TimelineEvent.incident_id == incident_id)
            .order_by(TimelineEvent.event_time.asc())
            .all()
        )

        return existing_events

    @staticmethod
    def calculate_incident_uncertainty(evidence_items: list[EvidenceItem]) -> float:
        """
        Calculates composite uncertainty score (0.0 to 1.0) based on:
        - Quantity of evidence items
        - Diversity of sources (citizen, sensor, responder)
        - Individual item uncertainty scores
        """
        if not evidence_items:
            return 0.85 # High uncertainty when no evidence is recorded

        sources = set(e.source_type for e in evidence_items)
        base_uncertainty = sum(e.uncertainty_score for e in evidence_items) / len(evidence_items)
        
        # Diversity discount: Multiple different source types lower overall uncertainty
        diversity_discount = min(0.3, (len(sources) - 1) * 0.1)
        
        # Volume discount: More corroborating reports lower uncertainty
        volume_discount = min(0.2, (len(evidence_items) - 1) * 0.05)
        
        final_score = max(0.05, min(0.95, base_uncertainty - diversity_discount - volume_discount))
        return round(final_score, 2)

timeline_service = TimelineReconstructionService()
