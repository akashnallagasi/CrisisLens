import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Ensure backend root is in sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.meta_client import meta_client

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["safety_guardrails_active"] is True

def test_list_incidents():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 2  # Pre-seeded scenarios exist
    for inc in incidents:
        assert "overall_uncertainty" in inc
        assert "evidence_count" in inc

def test_incident_detail_and_timeline():
    # Test getting detail for scenario 1
    response = client.get("/api/incidents/inc-flood-delta-01")
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == "inc-flood-delta-01"
    assert len(detail["evidence_items"]) >= 4
    assert len(detail["timeline_events"]) >= 4

    # Crucial test: check that evidence observation time is preserved separately from submission time
    ev1 = detail["evidence_items"][0]
    assert "observed_at" in ev1
    assert "submitted_at" in ev1
    # Check that observed_at and submitted_at are distinct
    assert ev1["observed_at"] != ev1["submitted_at"]

def test_ai_status_and_transparency():
    response = client.get("/api/analysis/status")
    assert response.status_code == 200
    status_info = response.json()
    assert "provider" in status_info
    assert "primary_model" in status_info
    assert "disclaimer" in status_info
    assert "safety_guardrails" in status_info

def test_ai_safety_invariant_filter():
    # Test that forbidden declarations are intercepted by safety guard
    is_safe, reason = meta_client.validate_safety_invariants("The road is safe for all vehicles to travel.")
    assert is_safe is False
    assert "Safety violation" in reason

    is_safe_ok, _ = meta_client.validate_safety_invariants("Water levels have begun to plateau, but floodwaters remain high.")
    assert is_safe_ok is True

def test_emergency_contacts_seeded():
    response = client.get("/api/contacts/")
    assert response.status_code == 200
    contacts = response.json()
    assert len(contacts) >= 6
    categories = {c["category"] for c in contacts}
    assert {"police", "hospital", "fema_ndma"}.issubset(categories)
    for contact in contacts:
        assert contact["name"]
        assert contact["phone"]
        assert contact["address"]
        assert "latitude" in contact and "longitude" in contact
        assert contact["trust_status"] in ("pending_verification", "dispatched_verified")


def test_dispatch_logs_human_verification():
    listed = client.get("/api/contacts/?category=police")
    assert listed.status_code == 200
    contact = listed.json()[0]
    contact_id = contact["id"]

    dispatch = client.post(
        f"/api/contacts/{contact_id}/dispatch",
        json={"notes": "Field commander confirmed unit rollout."},
    )
    assert dispatch.status_code == 200
    body = dispatch.json()
    assert body["trust_status"] == "dispatched_verified"
    assert body["availability_status"] == "Deployed"

    logs = client.get(f"/api/contacts/{contact_id}/logs")
    assert logs.status_code == 200
    entries = logs.json()
    assert len(entries) >= 1
    assert entries[0]["new_status"] == "dispatched_verified"


def test_evidence_submission_latency_tracking():
    # Submit evidence with an observation time 2 hours ago
    past_obs = (datetime.utcnow() - timedelta(hours=2)).isoformat()
    response = client.post(
        "/api/incidents/inc-flood-delta-01/evidence",
        data={
            "raw_description": "Water receded by 5cm along the western retaining wall.",
            "observed_at": past_obs,
            "source_type": "first_responder",
            "location_lat": 13.083,
            "location_lon": 80.271
        }
    )
    assert response.status_code == 201
    created = response.json()
    assert created["raw_description"].startswith("Water receded")
    assert created["source_type"] == "first_responder"
    # Latency tracking is added to uncertainty factors
    factors = created["uncertainty_factors"]
    assert any("latency" in f.lower() for f in factors)
