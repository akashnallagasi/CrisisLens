import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.incident import Incident, EvidenceItem, TimelineEvent, AIAnalysis
from app.models.rescue_contacts import RescueContact
from app.models.emergency_contact import EmergencyContact
from app.core.config import settings
from app.services.rag_service import rag_service

def seed_emergency_contacts(db: Session):
    """
    Seeds nearby police control rooms, city general hospitals, and FEMA/NDMA nodes.
    """
    if db.query(EmergencyContact).count() > 0:
        return

    contacts = [
        EmergencyContact(
            id="ec-police-control-01",
            name="City Police Control Room",
            category="police",
            phone="100",
            alt_phone="112",
            address="State Police HQ, 1 Fort St. George, Coastal Metro Sector",
            latitude=13.0820,
            longitude=80.2700,
            coverage_radius_km=40.0,
            availability_status="24/7 Active",
            trust_status="pending_verification",
            specialization="City-wide incident command, traffic cordon, missing persons desk",
        ),
        EmergencyContact(
            id="ec-police-coastal-02",
            name="Coastal Sector Police Station",
            category="police",
            phone="044-23452345",
            alt_phone="100",
            address="Harbor Road Junction, Bayside Estuary, Sector 4",
            latitude=13.0895,
            longitude=80.2785,
            coverage_radius_km=12.0,
            availability_status="24/7 Active",
            trust_status="pending_verification",
            specialization="Flood-zone patrol, boat launch escort, shoreline evacuation",
        ),
        EmergencyContact(
            id="ec-hospital-cgh-01",
            name="City General Hospital",
            category="hospital",
            phone="108",
            alt_phone="044-25305000",
            address="Government Rajaji Campus, Central Medical District",
            latitude=13.0765,
            longitude=80.2480,
            coverage_radius_km=25.0,
            availability_status="24/7 Active",
            trust_status="pending_verification",
            specialization="Trauma bay, mass-casualty surge beds, dialysis & ICU overflow",
        ),
        EmergencyContact(
            id="ec-hospital-trauma-02",
            name="District Trauma & Emergency Hospital",
            category="hospital",
            phone="102",
            alt_phone="044-24715511",
            address="Ring Highway Medical Park, South Junction",
            latitude=13.0510,
            longitude=80.2140,
            coverage_radius_km=20.0,
            availability_status="24/7 Active",
            trust_status="pending_verification",
            specialization="Orthopedic trauma, burn unit, ambulance staging apron",
        ),
        EmergencyContact(
            id="ec-ndma-neoc-01",
            name="NDMA National Emergency Operations Centre",
            category="fema_ndma",
            phone="1078",
            alt_phone="011-26701728",
            address="NDMA Bhawan Coordination Node, State SEOC Link Desk",
            latitude=13.0700,
            longitude=80.2500,
            coverage_radius_km=75.0,
            availability_status="24/7 Active",
            trust_status="pending_verification",
            specialization="National disaster protocol, inter-agency resource request, NDMA SOP relay",
        ),
        EmergencyContact(
            id="ec-fema-node-01",
            name="FEMA / NDMA Mutual-Aid Liaison Node",
            category="fema_ndma",
            phone="1070",
            alt_phone="1-800-621-3362",
            address="International Mutual-Aid Desk, Greater Metropolitan EOC",
            latitude=13.0640,
            longitude=80.2410,
            coverage_radius_km=80.0,
            availability_status="Standby",
            trust_status="pending_verification",
            specialization="Cross-border logistics, FEMA ICS templates, satellite comms fallback",
        ),
    ]
    db.add_all(contacts)
    db.commit()


def seed_rescue_contacts(db: Session):
    """
    Seeds verified emergency response units, hotlines, and rescue hubs.
    """
    if db.query(RescueContact).count() > 0:
        return

    contacts = [
        RescueContact(
            id="rc-ndrf-01",
            name="NDRF 04 Coastal Water Rescue Battalion",
            contact_type="water_rescue",
            phone_hotline="011-24363260",
            alt_phone="1078",
            coverage_city="Bayside Coastal Sector",
            coverage_radius_km=35.0,
            availability_status="24/7 Active",
            latitude=13.0920,
            longitude=80.2800,
            specialization="Inflatable Gemini rescue craft, Swift water diving, Flood evacuation"
        ),
        RescueContact(
            id="rc-state-seoc",
            name="State Disaster Control & Emergency Operations (SEOC)",
            contact_type="national_force",
            phone_hotline="1070",
            alt_phone="044-28593990",
            coverage_city="Greater Metropolitan Region",
            coverage_radius_km=75.0,
            availability_status="24/7 Active",
            latitude=13.0700,
            longitude=80.2500,
            specialization="Multi-agency dispatch, Siren alert broadcast, Air force helicopter requisition"
        ),
        RescueContact(
            id="rc-ers-112",
            name="Unified Emergency Response Support (Police/Fire/EMS)",
            contact_type="police_fire",
            phone_hotline="112",
            alt_phone="100",
            coverage_city="All Sectors",
            coverage_radius_km=50.0,
            availability_status="24/7 Active",
            latitude=13.0820,
            longitude=80.2600,
            specialization="Rapid perimeter cordoning, Roadway tree clearing, Law and order"
        ),
        RescueContact(
            id="rc-medical-108",
            name="Disaster Trauma Ambulance & Mobile Paramedic Fleet",
            contact_type="medical_ems",
            phone_hotline="108",
            alt_phone="102",
            coverage_city="Central & Coastal Zones",
            coverage_radius_km=30.0,
            availability_status="24/7 Active",
            latitude=13.0760,
            longitude=80.2350,
            specialization="High-clearance 4x4 offroad ambulances, Hypothermia & trauma stabilization"
        ),
        RescueContact(
            id="rc-fire-101",
            name="Central Fire & Heavy Rescue Squad",
            contact_type="police_fire",
            phone_hotline="101",
            alt_phone="044-28414444",
            coverage_city="Central Corridor",
            coverage_radius_km=20.0,
            availability_status="Standby",
            latitude=13.0550,
            longitude=80.2200,
            specialization="Hydraulic cutters, High-pressure flood pumping, Electrical de-energization support"
        ),
        RescueContact(
            id="rc-redcross-shelter",
            name="Red Cross Emergency Relief & Staging Camp",
            contact_type="shelter_relief",
            phone_hotline="044-28172055",
            alt_phone="1800-425-1070",
            coverage_city="North Sector Safe Ridge",
            coverage_radius_km=25.0,
            availability_status="24/7 Active",
            latitude=13.0850,
            longitude=80.2450,
            specialization="Dry rations, Clean potable water, Emergency sleeping cots for 800 people"
        )
    ]
    db.add_all(contacts)
    db.commit()

def seed_synthetic_incidents(db: Session):
    """
    Seeds realistic synthetic disaster scenarios for the demonstration.
    Demonstrates:
    1. Multi-source evidence (citizen photo, water level sensor, drone aerial, official dispatch)
    2. Out-of-order submissions due to cellular network lag during severe storms
    3. Proper chronological timeline reconstruction using observation timestamps
    4. Transparent uncertainty and AI assessment indicators
    """
    seed_rescue_contacts(db)
    seed_emergency_contacts(db)

    if db.query(Incident).count() > 0:
        return

    now = datetime.utcnow()
    t_minus_6h = now - timedelta(hours=6)
    t_minus_4h = now - timedelta(hours=4)
    t_minus_3h = now - timedelta(hours=3)
    t_minus_2h = now - timedelta(hours=2)
    t_minus_1h = now - timedelta(hours=1)
    t_minus_30m = now - timedelta(minutes=30)

    # ----------------- Scenario 1: Coastal River Delta Flash Flood -----------------
    inc1 = Incident(
        id="inc-flood-delta-01",
        title="Bayside Estuary Inundation & Embankment Breach",
        description=(
            "Flash flooding triggered by heavy storm surge runoff and high spring tide. "
            "Water levels rose rapidly across the coastal estuary, inundating low-lying residential sectors "
            "and threatening the arterial coastal causeway."
        ),
        disaster_type="flood",
        severity="critical",
        status="active",
        latitude=13.0827,
        longitude=80.2707,
        location_name="Bayside Estuary, Sector 4",
        created_at=t_minus_4h,
        updated_at=now
    )
    db.add(inc1)

    # Evidence 1: Citizen photo captured early (T - 5.5h) but submitted LATE (T - 2h) due to cell outage
    ev1 = EvidenceItem(
        id="ev-01-citizen-early",
        incident_id=inc1.id,
        source_type="citizen_report",
        source_credibility=0.75,
        media_type="image",
        file_path="sample_flood_embankment.jpg",
        file_size=2450000,
        mime_type="image/jpeg",
        observed_at=t_minus_6h + timedelta(minutes=30),  # Observed at 06:30 relative
        submitted_at=t_minus_2h,                         # Submitted at 10:00 relative (delayed arrival!)
        verification_status="corroborated",
        uncertainty_score=0.25,
        uncertainty_factors=json.dumps([
            "Late submission due to local cell tower disruption",
            "Visual metadata matches ground sensor timestamp",
            "Clear landmarks confirmed by GIS map"
        ]),
        raw_description="Water overflowing the stone embankment by 40cm. Vehicles unable to cross the market junction.",
        location_lat=13.0845,
        location_lon=80.2715
    )

    # Evidence 2: Automated River Sensor reading (T - 4h, submitted immediately at T - 4h)
    ev2 = EvidenceItem(
        id="ev-02-sensor-telemetry",
        incident_id=inc1.id,
        source_type="field_sensor",
        source_credibility=0.95,
        media_type="sensor",
        file_path=None,
        file_size=1024,
        mime_type="application/json",
        observed_at=t_minus_4h,
        submitted_at=t_minus_4h + timedelta(minutes=2),
        verification_status="verified_by_official",
        uncertainty_score=0.10,
        uncertainty_factors=json.dumps([
            "Calibrated USGS/State hydrological telemetry gauge",
            "Direct LoRaWAN satellite uplink"
        ]),
        raw_description="Estuary Gauge #09 recorded critical stage: 4.82m (threshold: 3.50m). Rate of rise: +0.45m/hr.",
        location_lat=13.0810,
        location_lon=80.2690
    )

    # Evidence 3: Drone Reconnaissance Feed (Observed at T - 3h, submitted at T - 2.8h)
    ev3 = EvidenceItem(
        id="ev-03-drone-aerial",
        incident_id=inc1.id,
        source_type="first_responder",
        source_credibility=0.90,
        media_type="image",
        file_path="sample_aerial_inundation.jpg",
        file_size=3850000,
        mime_type="image/jpeg",
        observed_at=t_minus_3h,
        submitted_at=t_minus_3h + timedelta(minutes=12),
        verification_status="verified_by_official",
        uncertainty_score=0.15,
        uncertainty_factors=json.dumps([
            "Official emergency services drone orthomosaic",
            "GPS locked at 120m altitude"
        ]),
        raw_description="Aerial orthomosaic confirms 1.2km section of East Canal Road submerged under 0.6m to 1.1m standing water.",
        location_lat=13.0850,
        location_lon=80.2730
    )

    # Evidence 4: Recent First Responder Ground Report (T - 1h)
    ev4 = EvidenceItem(
        id="ev-04-responder-patrol",
        incident_id=inc1.id,
        source_type="first_responder",
        source_credibility=0.88,
        media_type="text_report",
        file_path=None,
        file_size=2048,
        mime_type="text/plain",
        observed_at=t_minus_1h,
        submitted_at=t_minus_1h + timedelta(minutes=5),
        verification_status="verified_by_official",
        uncertainty_score=0.20,
        uncertainty_factors=json.dumps([
            "On-site rescue team report",
            "Visual confirmation of 45 residents sheltered on second floor"
        ]),
        raw_description="Rescue Boat Squad Alpha deployed. 18 residents evacuated from North Block; water current holding steady at 1.8 knots.",
        location_lat=13.0835,
        location_lon=80.2720
    )

    db.add_all([ev1, ev2, ev3, ev4])

    # Reconstructed Timeline Events (Chronologically ordered by true ground time)
    tl1 = TimelineEvent(
        id="tl-01",
        incident_id=inc1.id,
        evidence_id=ev1.id,
        event_time=t_minus_6h + timedelta(minutes=30),
        recorded_at=t_minus_2h,
        event_type="embankment_breach",
        summary="Water crests stone embankment at Market Junction (reconstructed from delayed citizen photographic evidence).",
        is_ai_inferred=False,
        confidence_score=0.82
    )

    tl2 = TimelineEvent(
        id="tl-02",
        incident_id=inc1.id,
        evidence_id=ev2.id,
        event_time=t_minus_4h,
        recorded_at=t_minus_4h + timedelta(minutes=2),
        event_type="sensor_critical_threshold",
        summary="Hydrological gauge #09 passes critical flood threshold at 4.82m (+0.45m/hr).",
        is_ai_inferred=False,
        confidence_score=0.95
    )

    tl3 = TimelineEvent(
        id="tl-03",
        incident_id=inc1.id,
        evidence_id=ev3.id,
        event_time=t_minus_3h,
        recorded_at=t_minus_3h + timedelta(minutes=12),
        event_type="road_submerged",
        summary="Drone inspection confirms complete inundation of East Canal Road arterial corridor.",
        is_ai_inferred=False,
        confidence_score=0.92
    )

    tl4 = TimelineEvent(
        id="tl-04",
        incident_id=inc1.id,
        evidence_id=None,
        event_time=t_minus_2h,
        recorded_at=t_minus_2h + timedelta(minutes=15),
        event_type="peak_surge_predicted",
        summary="Hydrological flow model identifies peak runoff crest occurring between 11:30 and 13:00.",
        is_ai_inferred=True,
        confidence_score=0.74
    )

    tl5 = TimelineEvent(
        id="tl-05",
        incident_id=inc1.id,
        evidence_id=ev4.id,
        event_time=t_minus_1h,
        recorded_at=t_minus_1h + timedelta(minutes=5),
        event_type="rescue_operations_active",
        summary="First responder boats deployed in Sector 4; primary rescue route established via High Ridge Way.",
        is_ai_inferred=False,
        confidence_score=0.90
    )

    db.add_all([tl1, tl2, tl3, tl4, tl5])

    # Retrieve RAG disaster protocols for Scenario 1
    flood_protocols = rag_service.search_guidelines(
        query="flood embankment breach depth levee rescue boat",
        category="flood",
        top_k=3
    )

    # AI Analysis for Scenario 1
    ai1 = AIAnalysis(
        id="ai-01-flood-delta",
        incident_id=inc1.id,
        model_id="meta-muse-spark-preview",
        created_at=t_minus_30m,
        is_simulated=True,
        status="completed",
        primary_hazard="Hydrological Inundation & Embankment Breach",
        damage_type="Stone Levee Overwash & Scour Inundation",
        multimodal_summary=(
            "Multimodal timeline synthesis synthesized 4 heterogeneous inputs across a 6-hour observation window. "
            "Although citizen photo was received 3.5 hours late due to infrastructure damage, observation metadata "
            "proves embankment failure occurred at 06:30, preceding sensor alarms. "
            "Spatial alignment indicates rapid flood plume moving west-northwest."
        ),
        hazard_assessment=(
            "HIGH HAZARD. Water depths range from 0.6m to 1.1m across residential Sector 4. "
            "East Canal Road is completely impassable. "
            "Advisory: Evacuation routing must avoid subterranean underpasses. "
            "Official ground verification required before approving any transit corridor."
        ),
        detected_features=json.dumps([
            "Overtopped containment stone levee with crest scouring",
            "Submerged commercial vehicles and street fixtures (0.8m depth)",
            "Turbid brown runoff indicating upstream embankment erosion",
            "Delayed-evidence timeline alignment anomaly resolved"
        ]),
        uncertainty_evaluation=(
            "Overall incident uncertainty: LOW (0.18). "
            "High confidence achieved by multi-source tri-angulation: citizen visual ground photo corroborates "
            "automated gauge reading within ±12 cm variance."
        ),
        confidence_score=0.88,
        rag_guidelines=json.dumps(flood_protocols),
        disclaimer=settings.SAFETY_DISCLAIMER,
        human_verified=True,
        human_notes="Verified by Incident Command Officer #42. Drone imagery matches GPS coordinates."
    )
    db.add(ai1)

    # ----------------- Scenario 2: Cyclone High-Wind & Grid Disruption -----------------
    inc2 = Incident(
        id="inc-cyclone-grid-02",
        title="Cyclone Vardha: Grid Collapse & Arterial Tree Blockage",
        description=(
            "Category 2 cyclonic wind gusts (115 km/h) caused widespread felling of mature trees, "
            "bringing down high-voltage transmission lines across Central Ring Highway."
        ),
        disaster_type="cyclone",
        severity="high",
        status="active",
        latitude=13.0475,
        longitude=80.2090,
        location_name="Central Ring Highway & South Junction",
        created_at=t_minus_3h,
        updated_at=now
    )
    db.add(inc2)

    ev2_1 = EvidenceItem(
        id="ev-05-social-photo",
        incident_id=inc2.id,
        source_type="citizen_report",
        source_credibility=0.60,
        media_type="image",
        file_path="sample_cyclone_grid.jpg",
        file_size=1950000,
        mime_type="image/jpeg",
        observed_at=t_minus_2h - timedelta(minutes=20),
        submitted_at=t_minus_2h,
        verification_status="unverified",
        uncertainty_score=0.45,
        uncertainty_factors=json.dumps([
            "Single unverified photo from social network upload",
            "Timestamp inferred from EXIF creation time",
            "Live electrical hazard unconfirmed by utility operator"
        ]),
        raw_description="Massive banyan tree fell on power cables. Sparks visible, all 4 lanes blocked near Metro Station.",
        location_lat=13.0480,
        location_lon=80.2095
    )
    db.add(ev2_1)

    tl2_1 = TimelineEvent(
        id="tl-06",
        incident_id=inc2.id,
        evidence_id=ev2_1.id,
        event_time=t_minus_2h - timedelta(minutes=20),
        recorded_at=t_minus_2h,
        event_type="tree_fall_obstruction",
        summary="Mature tree felling and electrical conductor drop reported on Central Ring Highway.",
        is_ai_inferred=False,
        confidence_score=0.65
    )
    db.add(tl2_1)

    # Retrieve RAG disaster protocols for Scenario 2
    cyclone_protocols = rag_service.search_guidelines(
        query="cyclone wind wire power grid tree live conductor",
        category="cyclone",
        top_k=3
    )

    ai2 = AIAnalysis(
        id="ai-02-cyclone-grid",
        incident_id=inc2.id,
        model_id="meta-muse-spark-preview",
        created_at=t_minus_1h,
        is_simulated=True,
        status="completed",
        primary_hazard="High-Wind Cyclonic Shearing & Live Grid Hazard",
        damage_type="Downed 11kV Conductors & Arterial Tree Occlusion",
        multimodal_summary=(
            "Single citizen image indicates significant vehicular obstruction and electrical hazard. "
            "Awaiting corroboration from municipal utility telemetry."
        ),
        hazard_assessment=(
            "POTENTIAL FATAL ELECTRICAL HAZARD. Downed conductors in damp environment pose arc flash risk. "
            "DO NOT APPROACH. Roadway is impassable for emergency vehicles until grid isolation is confirmed by power utility."
        ),
        detected_features=json.dumps([
            "Severed 11kV distribution line on wet pavement",
            "Major road occlusion across both directional carriageways",
            "Felled mature banyan tree entangling secondary utility cables",
            "Absence of utility service vehicles at time of capture"
        ]),
        uncertainty_evaluation=(
            "Uncertainty HIGH (0.52). Requires verification: Whether power line is de-energized."
        ),
        confidence_score=0.62,
        rag_guidelines=json.dumps(cyclone_protocols),
        disclaimer=settings.SAFETY_DISCLAIMER,
        human_verified=False,
        human_notes=None
    )
    db.add(ai2)

    # ----------------- Seed Emergency Rescue Contacts -----------------
    if db.query(RescueContact).count() == 0:
        contacts = [
            RescueContact(
                id="rc-ndrf-01",
                name="NDRF 04 Coastal Water Rescue Battalion",
                contact_type="water_rescue",
                phone_hotline="011-24363260",
                alt_phone="1078",
                coverage_city="Bayside Coastal Sector",
                coverage_radius_km=35.0,
                availability_status="24/7 Active",
                latitude=13.0920,
                longitude=80.2800,
                specialization="Inflatable Gemini rescue craft, Swift water diving, Flood evacuation"
            ),
            RescueContact(
                id="rc-state-seoc",
                name="State Disaster Control & Emergency Operations (SEOC)",
                contact_type="national_force",
                phone_hotline="1070",
                alt_phone="044-28593990",
                coverage_city="Greater Metropolitan Region",
                coverage_radius_km=75.0,
                availability_status="24/7 Active",
                latitude=13.0700,
                longitude=80.2500,
                specialization="Multi-agency dispatch, Siren alert broadcast, Air force helicopter requisition"
            ),
            RescueContact(
                id="rc-ers-112",
                name="Unified Emergency Response Support (Police/Fire/EMS)",
                contact_type="police_fire",
                phone_hotline="112",
                alt_phone="100",
                coverage_city="All Sectors",
                coverage_radius_km=50.0,
                availability_status="24/7 Active",
                latitude=13.0820,
                longitude=80.2600,
                specialization="Rapid perimeter cordoning, Roadway tree clearing, Law and order"
            ),
            RescueContact(
                id="rc-medical-108",
                name="Disaster Trauma Ambulance & Mobile Paramedic Fleet",
                contact_type="medical_ems",
                phone_hotline="108",
                alt_phone="102",
                coverage_city="Central & Coastal Zones",
                coverage_radius_km=30.0,
                availability_status="24/7 Active",
                latitude=13.0760,
                longitude=80.2350,
                specialization="High-clearance 4x4 offroad ambulances, Hypothermia & trauma stabilization"
            ),
            RescueContact(
                id="rc-fire-101",
                name="Central Fire & Heavy Rescue Squad",
                contact_type="police_fire",
                phone_hotline="101",
                alt_phone="044-28414444",
                coverage_city="Central Corridor",
                coverage_radius_km=20.0,
                availability_status="Standby",
                latitude=13.0550,
                longitude=80.2200,
                specialization="Hydraulic cutters, High-pressure flood pumping, Electrical de-energization support"
            ),
            RescueContact(
                id="rc-redcross-shelter",
                name="Red Cross Emergency Relief & Staging Camp",
                contact_type="shelter_relief",
                phone_hotline="044-28172055",
                alt_phone="1800-425-1070",
                coverage_city="North Sector Safe Ridge",
                coverage_radius_km=25.0,
                availability_status="24/7 Active",
                latitude=13.0850,
                longitude=80.2450,
                specialization="Dry rations, Clean potable water, Emergency sleeping cots for 800 people"
            )
        ]
        db.add_all(contacts)

    db.commit()

