import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// FEMA / NDMA RAG Knowledge Base
const DISASTER_KNOWLEDGE_BASE = [
  {
    id: 'fema-p259-sec4',
    agency: 'FEMA (Federal Emergency Management Agency)',
    source_document: 'FEMA P-259: Engineering Principles and Practices for Retrofitting Flood-Prone Structures',
    section: 'Section 4.2: Hydrostatic and Hydrodynamic Flood Forces',
    category: 'flood',
    keywords: ['flood', 'water', 'inundation', 'depth', 'embankment', 'submerged', 'breach', 'scour', 'river'],
    summary: 'Threshold criteria for floodwater depth and hydrodynamic velocity.',
    guidance:
      'Standing water exceeding 0.5 meters (1.6 ft) creates significant lateral hydrostatic pressure on residential masonry and makes roadways completely impassable for passenger vehicles. Where velocity exceeds 1.5 m/s, localized scour around roadbed culverts and bridge abutments accelerates rapidly. Submerged roadways must be cordoned off immediately.',
    responder_action: 'Establish immediate physical perimeter. Do not allow vehicular transit regardless of apparent shallow depth.',
    safety_level: 'CRITICAL_HAZARD',
  },
  {
    id: 'fema-p259-sec6',
    agency: 'FEMA (Federal Emergency Management Agency)',
    source_document: 'FEMA P-259: Levee & Floodwall Overtopping Defense Protocols',
    section: 'Section 6.1: Landward Containment and Ring Dikes',
    category: 'flood',
    keywords: ['breach', 'embankment', 'levee', 'overtopping', 'canal', 'overflow', 'sandbag', 'erosion'],
    summary: 'Containment protocol for overtopped stone levees and earthen canal embankments.',
    guidance:
      'When floodwaters overtop stone or earthen embankments, scour on the landward toe can induce catastrophic collapse. Response teams must construct landward sandbag ring dikes around sand boils and seepage exits to reduce hydraulic head. Never attempt heavy machinery positioning directly on an actively saturated crest.',
    responder_action: 'Deploy rapid sandbag shoring at breach shoulders; evacuate immediate downstream trajectory (minimum 500m).',
    safety_level: 'CRITICAL_HAZARD',
  },
  {
    id: 'ndma-flood-sop3',
    agency: 'NDMA (National Disaster Management Authority)',
    source_document: 'NDMA Guidelines: Management of Floods & Standard Operating Procedures',
    section: 'SOP 3.4: Urban Drainage & Low-Lying Settlement Evacuation',
    category: 'flood',
    keywords: ['settlement', 'evacuation', 'residential', 'boat', 'rescue', 'lowland', 'submerged', 'shelter'],
    summary: 'Evacuation staging and motorized rescue boat operations in urban floodwaters.',
    guidance:
      'During rapid water level rise in urban sectors, prioritize vertical evacuation of stranded residents to reinforced upper floors before executing waterborne transfers. Rescue boats must maintain idle speed (under 3 knots) to prevent wake-induced collapse of compromised boundary walls.',
    responder_action: 'Dispatch shallow-draft rescue craft with personal flotation devices (PFDs). Mark evacuated structures with fluorescent tags.',
    safety_level: 'HIGH_PRIORITY',
  },
  {
    id: 'ndma-cyclone-sop4',
    agency: 'NDMA (National Disaster Management Authority)',
    source_document: 'NDMA Guidelines: Management of Cyclones & Severe Wind Storms',
    section: 'SOP 4.7: Live Electrical Conductor Hazards in Saturated Ground',
    category: 'cyclone',
    keywords: ['cyclone', 'wind', 'power', 'grid', 'wire', 'cable', 'tree', 'electrical', 'sparks', 'conductor'],
    summary: 'Protocol for downed power lines and high-voltage grid disruptions.',
    guidance:
      'All fallen conductors must be treated as fully energized (11kV / 33kV) until official Lock-Out / Tag-Out (LOTO) clearance is received in writing from the electricity board substation. Standing water conducts fatal step-potential gradients up to 15 meters from the contact point. Chainsaw crews must NOT begin tree clearance until isolation is verified.',
    responder_action: 'Cordon off an absolute 20-meter exclusion zone. Await utility supervisor clearance before debris cutting.',
    safety_level: 'LIFE_THREATENING',
  },
  {
    id: 'ndma-cyclone-sop6',
    agency: 'NDMA (National Disaster Management Authority)',
    source_document: 'NDMA Standard Operating Procedure for Arterial Road Clearance',
    section: 'SOP 6.2: Clearance of Arterial Evacuation Routes',
    category: 'cyclone',
    keywords: ['arterial', 'highway', 'blocked', 'tree', 'obstruction', 'chainsaw', 'debris', 'roadway'],
    summary: 'Hierarchical prioritization for clearing cyclone-felled vegetation from transit corridors.',
    guidance:
      'Focus clearing crews on single-lane clearance along designated Primary Arterials first, before attempting full multi-lane clearing. This establishes an emergency conduit for ambulances and rescue vehicles within 90 minutes of storm passage.',
    responder_action: 'Clear minimum 3.5m carriage corridor along median shoulder; stack debris safely beyond the roadway curb.',
    safety_level: 'STANDARD_OPERATING_PROCEDURE',
  },
  {
    id: 'nims-ics-saf01',
    agency: 'NIMS / FEMA Incident Command System',
    source_document: 'National Incident Management System: Safety Officer Field Operations Guide',
    section: 'Section 2.4: Verification Invariants for Route Safety Declarations',
    category: 'safety_invariant',
    keywords: ['safe', 'verify', 'route', 'all-clear', 'responder', 'inspection', 'bridge', 'structural', 'infrastructure'],
    summary: 'Inviolable rule: Remote AI/drone sensors cannot independently certify routes or structures safe.',
    guidance:
      "Remote sensor telemetry, aerial imagery, and automated AI assessments provide advisory reconnaissance only. No roadway, bridge, or public facility may be designated 'OPEN' or 'SAFE' for public re-entry without a signed, physical ground inspection conducted by a qualified civil engineer or Incident Command Safety Officer.",
    responder_action: "Mark all AI assessments with 'Pending Responder Verification'. Maintain closures until physical inspection sign-off.",
    safety_level: 'MANDATORY_INVARIANT',
  },
];

function searchGuidelines(query: string, category?: string, topK: number = 3) {
  const queryTokens = new Set(query.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
  if (category) queryTokens.add(category.toLowerCase());

  const scored = DISASTER_KNOWLEDGE_BASE.map((doc) => {
    let score = 0;
    const docTokens = new Set([
      ...doc.keywords,
      ...(doc.summary.toLowerCase().match(/\b[a-z]{3,}\b/g) || []),
      ...(doc.guidance.toLowerCase().match(/\b[a-z]{3,}\b/g) || []),
      doc.category.toLowerCase(),
    ]);

    for (const t of queryTokens) {
      if (docTokens.has(t)) score += 1.5;
      if (doc.keywords.includes(t)) score += 2.5;
    }

    if (category && doc.category.toLowerCase() === category.toLowerCase()) {
      score *= 2.0;
    }

    return {
      ...doc,
      relevance_score: Math.round(score * 10) / 10,
    };
  })
    .filter((d) => d.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score);

  return scored.slice(0, topK);
}

// Distance calculation
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Synthetic Initial Seed Data
const now = new Date();
const tMinus6h = new Date(now.getTime() - 6 * 3600 * 1000).toISOString();
const tMinus4h = new Date(now.getTime() - 4 * 3600 * 1000).toISOString();
const tMinus3h = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
const tMinus2h = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
const tMinus1h = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();
const tMinus30m = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

let emergencyContacts = [
  {
    id: 'ec-police-control-01',
    name: 'City Police Control Room',
    category: 'police',
    phone: '100',
    alt_phone: '112',
    address: 'State Police HQ, 1 Fort St. George, Coastal Metro Sector',
    latitude: 13.082,
    longitude: 80.27,
    coverage_radius_km: 40.0,
    availability_status: '24/7 Active',
    trust_status: 'pending_verification',
    specialization: 'City-wide incident command, traffic cordon, missing persons desk',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
  {
    id: 'ec-police-coastal-02',
    name: 'Coastal Sector Police Station',
    category: 'police',
    phone: '044-23452345',
    alt_phone: '100',
    address: 'Harbor Road Junction, Bayside Estuary, Sector 4',
    latitude: 13.0895,
    longitude: 80.2785,
    coverage_radius_km: 12.0,
    availability_status: '24/7 Active',
    trust_status: 'pending_verification',
    specialization: 'Flood-zone patrol, boat launch escort, shoreline evacuation',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
  {
    id: 'ec-hospital-cgh-01',
    name: 'City General Hospital',
    category: 'hospital',
    phone: '108',
    alt_phone: '044-25305000',
    address: 'Government Rajaji Campus, Central Medical District',
    latitude: 13.0765,
    longitude: 80.248,
    coverage_radius_km: 25.0,
    availability_status: '24/7 Active',
    trust_status: 'pending_verification',
    specialization: 'Trauma bay, mass-casualty surge beds, dialysis & ICU overflow',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
  {
    id: 'ec-hospital-trauma-02',
    name: 'District Trauma & Emergency Hospital',
    category: 'hospital',
    phone: '102',
    alt_phone: '044-24715511',
    address: 'Ring Highway Medical Park, South Junction',
    latitude: 13.051,
    longitude: 80.214,
    coverage_radius_km: 20.0,
    availability_status: '24/7 Active',
    trust_status: 'pending_verification',
    specialization: 'Orthopedic trauma, burn unit, ambulance staging apron',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
  {
    id: 'ec-ndma-neoc-01',
    name: 'NDMA National Emergency Operations Centre',
    category: 'fema_ndma',
    phone: '1078',
    alt_phone: '011-26701728',
    address: 'NDMA Bhawan Coordination Node, State SEOC Link Desk',
    latitude: 13.07,
    longitude: 80.25,
    coverage_radius_km: 75.0,
    availability_status: '24/7 Active',
    trust_status: 'pending_verification',
    specialization: 'National disaster protocol, inter-agency resource request, NDMA SOP relay',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
  {
    id: 'ec-fema-node-01',
    name: 'FEMA / NDMA Mutual-Aid Liaison Node',
    category: 'fema_ndma',
    phone: '1070',
    alt_phone: '1-800-621-3362',
    address: 'International Mutual-Aid Desk, Greater Metropolitan EOC',
    latitude: 13.064,
    longitude: 80.241,
    coverage_radius_km: 80.0,
    availability_status: 'Standby',
    trust_status: 'pending_verification',
    specialization: 'Cross-border logistics, FEMA ICS templates, satellite comms fallback',
    created_at: tMinus6h,
    last_dispatched_at: null,
  },
];

let dispatchLogs: any[] = [];

let rescueContacts = [
  {
    id: 'rc-ndrf-01',
    name: 'NDRF 04 Coastal Water Rescue Battalion',
    contact_type: 'water_rescue',
    phone_hotline: '011-24363260',
    alt_phone: '1078',
    coverage_city: 'Bayside Coastal Sector',
    coverage_radius_km: 35.0,
    availability_status: '24/7 Active',
    latitude: 13.092,
    longitude: 80.28,
    specialization: 'Inflatable Gemini rescue craft, Swift water diving, Flood evacuation',
  },
  {
    id: 'rc-state-seoc',
    name: 'State Disaster Control & Emergency Operations (SEOC)',
    contact_type: 'national_force',
    phone_hotline: '1070',
    alt_phone: '044-28593990',
    coverage_city: 'Greater Metropolitan Region',
    coverage_radius_km: 75.0,
    availability_status: '24/7 Active',
    latitude: 13.07,
    longitude: 80.25,
    specialization: 'Multi-agency dispatch, Siren alert broadcast, Air force helicopter requisition',
  },
  {
    id: 'rc-ers-112',
    name: 'Unified Emergency Response Support (Police/Fire/EMS)',
    contact_type: 'police_fire',
    phone_hotline: '112',
    alt_phone: '100',
    coverage_city: 'All Sectors',
    coverage_radius_km: 50.0,
    availability_status: '24/7 Active',
    latitude: 13.082,
    longitude: 80.26,
    specialization: 'Rapid perimeter cordoning, Roadway tree clearing, Law and order',
  },
  {
    id: 'rc-medical-108',
    name: 'Disaster Trauma Ambulance & Mobile Paramedic Fleet',
    contact_type: 'medical_ems',
    phone_hotline: '108',
    alt_phone: '102',
    coverage_city: 'Central & Coastal Zones',
    coverage_radius_km: 30.0,
    availability_status: '24/7 Active',
    latitude: 13.076,
    longitude: 80.235,
    specialization: 'High-clearance 4x4 offroad ambulances, Hypothermia & trauma stabilization',
  },
  {
    id: 'rc-fire-101',
    name: 'Central Fire & Heavy Rescue Squad',
    contact_type: 'police_fire',
    phone_hotline: '101',
    alt_phone: '044-28414444',
    coverage_city: 'Central Corridor',
    coverage_radius_km: 20.0,
    availability_status: 'Standby',
    latitude: 13.055,
    longitude: 80.22,
    specialization: 'Hydraulic cutters, High-pressure flood pumping, Electrical de-energization support',
  },
  {
    id: 'rc-redcross-shelter',
    name: 'Red Cross Emergency Relief & Staging Camp',
    contact_type: 'shelter_relief',
    phone_hotline: '044-28172055',
    alt_phone: '1800-425-1070',
    coverage_city: 'North Sector Safe Ridge',
    coverage_radius_km: 25.0,
    availability_status: '24/7 Active',
    latitude: 13.085,
    longitude: 80.245,
    specialization: 'Dry rations, Clean potable water, Emergency sleeping cots for 800 people',
  },
];

// In-Memory Incidents Store
let incidents: any[] = [
  {
    id: 'inc-flood-delta-01',
    title: 'Bayside Estuary Inundation & Embankment Breach',
    description:
      'Flash flooding triggered by heavy storm surge runoff and high spring tide. Water levels rose rapidly across the coastal estuary, inundating low-lying residential sectors and threatening the arterial coastal causeway.',
    disaster_type: 'flood',
    severity: 'critical',
    status: 'active',
    latitude: 13.0827,
    longitude: 80.2707,
    location_name: 'Bayside Estuary, Sector 4',
    created_at: tMinus4h,
    updated_at: now.toISOString(),
    overall_uncertainty: 0.18,
    evidence_items: [
      {
        id: 'ev-01-citizen-early',
        incident_id: 'inc-flood-delta-01',
        source_type: 'citizen_report',
        source_credibility: 0.75,
        media_type: 'image',
        file_path: 'sample_flood_embankment.jpg',
        file_size: 2450000,
        mime_type: 'image/jpeg',
        observed_at: new Date(new Date(tMinus6h).getTime() + 30 * 60000).toISOString(),
        submitted_at: tMinus2h,
        verification_status: 'corroborated',
        uncertainty_score: 0.25,
        uncertainty_factors: [
          'Late submission due to local cell tower disruption',
          'Visual metadata matches ground sensor timestamp',
          'Clear landmarks confirmed by GIS map',
        ],
        raw_description:
          'Water overflowing the stone embankment by 40cm. Vehicles unable to cross the market junction.',
        location_lat: 13.0845,
        location_lon: 80.2715,
      },
      {
        id: 'ev-02-sensor-telemetry',
        incident_id: 'inc-flood-delta-01',
        source_type: 'field_sensor',
        source_credibility: 0.95,
        media_type: 'sensor',
        file_path: null,
        file_size: 1024,
        mime_type: 'application/json',
        observed_at: tMinus4h,
        submitted_at: new Date(new Date(tMinus4h).getTime() + 2 * 60000).toISOString(),
        verification_status: 'verified_by_official',
        uncertainty_score: 0.1,
        uncertainty_factors: [
          'Calibrated hydrological telemetry gauge',
          'Direct LoRaWAN satellite uplink',
        ],
        raw_description:
          'Estuary Gauge #09 recorded critical stage: 4.82m (threshold: 3.50m). Rate of rise: +0.45m/hr.',
        location_lat: 13.081,
        location_lon: 80.269,
      },
      {
        id: 'ev-03-drone-aerial',
        incident_id: 'inc-flood-delta-01',
        source_type: 'first_responder',
        source_credibility: 0.9,
        media_type: 'image',
        file_path: 'sample_aerial_inundation.jpg',
        file_size: 3850000,
        mime_type: 'image/jpeg',
        observed_at: tMinus3h,
        submitted_at: new Date(new Date(tMinus3h).getTime() + 12 * 60000).toISOString(),
        verification_status: 'verified_by_official',
        uncertainty_score: 0.15,
        uncertainty_factors: [
          'Official emergency services drone orthomosaic',
          'GPS locked at 120m altitude',
        ],
        raw_description:
          'Aerial orthomosaic confirms 1.2km section of East Canal Road submerged under 0.6m to 1.1m standing water.',
        location_lat: 13.085,
        location_lon: 80.273,
      },
      {
        id: 'ev-04-responder-patrol',
        incident_id: 'inc-flood-delta-01',
        source_type: 'first_responder',
        source_credibility: 0.88,
        media_type: 'text_report',
        file_path: null,
        file_size: 2048,
        mime_type: 'text/plain',
        observed_at: tMinus1h,
        submitted_at: new Date(new Date(tMinus1h).getTime() + 5 * 60000).toISOString(),
        verification_status: 'verified_by_official',
        uncertainty_score: 0.2,
        uncertainty_factors: [
          'On-site rescue team report',
          'Visual confirmation of 45 residents sheltered on second floor',
        ],
        raw_description:
          'Rescue Boat Squad Alpha deployed. 18 residents evacuated from North Block; water current holding steady at 1.8 knots.',
        location_lat: 13.0835,
        location_lon: 80.272,
      },
    ],
    timeline_events: [
      {
        id: 'tl-01',
        incident_id: 'inc-flood-delta-01',
        evidence_id: 'ev-01-citizen-early',
        event_time: new Date(new Date(tMinus6h).getTime() + 30 * 60000).toISOString(),
        recorded_at: tMinus2h,
        event_type: 'embankment_breach',
        summary:
          'Water crests stone embankment at Market Junction (reconstructed from delayed citizen photographic evidence).',
        is_ai_inferred: false,
        confidence_score: 0.82,
      },
      {
        id: 'tl-02',
        incident_id: 'inc-flood-delta-01',
        evidence_id: 'ev-02-sensor-telemetry',
        event_time: tMinus4h,
        recorded_at: new Date(new Date(tMinus4h).getTime() + 2 * 60000).toISOString(),
        event_type: 'sensor_critical_threshold',
        summary: 'Hydrological gauge #09 passes critical flood threshold at 4.82m (+0.45m/hr).',
        is_ai_inferred: false,
        confidence_score: 0.95,
      },
      {
        id: 'tl-03',
        incident_id: 'inc-flood-delta-01',
        evidence_id: 'ev-03-drone-aerial',
        event_time: tMinus3h,
        recorded_at: new Date(new Date(tMinus3h).getTime() + 12 * 60000).toISOString(),
        event_type: 'road_submerged',
        summary:
          'Drone inspection confirms complete inundation of East Canal Road arterial corridor.',
        is_ai_inferred: false,
        confidence_score: 0.92,
      },
      {
        id: 'tl-04',
        incident_id: 'inc-flood-delta-01',
        evidence_id: null,
        event_time: tMinus2h,
        recorded_at: new Date(new Date(tMinus2h).getTime() + 15 * 60000).toISOString(),
        event_type: 'peak_surge_predicted',
        summary:
          'Hydrological flow model identifies peak runoff crest occurring between 11:30 and 13:00.',
        is_ai_inferred: true,
        confidence_score: 0.74,
      },
      {
        id: 'tl-05',
        incident_id: 'inc-flood-delta-01',
        evidence_id: 'ev-04-responder-patrol',
        event_time: tMinus1h,
        recorded_at: new Date(new Date(tMinus1h).getTime() + 5 * 60000).toISOString(),
        event_type: 'rescue_operations_active',
        summary:
          'First responder boats deployed in Sector 4; primary rescue route established via High Ridge Way.',
        is_ai_inferred: false,
        confidence_score: 0.9,
      },
    ],
    ai_analyses: [
      {
        id: 'ai-01-flood-delta',
        incident_id: 'inc-flood-delta-01',
        model_id: 'meta-muse-spark-preview',
        created_at: tMinus30m,
        is_simulated: true,
        status: 'completed',
        primary_hazard: 'Hydrological Inundation & Embankment Breach',
        damage_type: 'Stone Levee Overwash & Scour Inundation',
        multimodal_summary:
          'Multimodal timeline synthesis synthesized 4 heterogeneous inputs across a 6-hour observation window. Although citizen photo was received 3.5 hours late due to infrastructure damage, observation metadata proves embankment failure occurred early, preceding sensor alarms. Spatial alignment indicates rapid flood plume moving west-northwest.',
        hazard_assessment:
          'HIGH HAZARD. Water depths range from 0.6m to 1.1m across residential Sector 4. East Canal Road is completely impassable. Advisory: Evacuation routing must avoid subterranean underpasses. Official ground verification required before approving any transit corridor.',
        detected_features: [
          'Overtopped containment stone levee with crest scouring',
          'Submerged commercial vehicles and street fixtures (0.8m depth)',
          'Turbid brown runoff indicating upstream embankment erosion',
          'Delayed-evidence timeline alignment anomaly resolved',
        ],
        uncertainty_evaluation:
          'Overall incident uncertainty: LOW (0.18). High confidence achieved by multi-source triangulation: citizen visual ground photo corroborates automated gauge reading within ±12 cm variance.',
        confidence_score: 0.88,
        rag_guidelines: searchGuidelines('flood embankment breach depth levee rescue boat', 'flood', 3),
        disclaimer:
          'CrisisLens AI provides situational intelligence for emergency coordination. Inviolable Safety Guardrail: AI outputs are non-authoritative advisory predictions and cannot certify roadways, bridges, or facilities 100% safe without physical first-responder inspection.',
        human_verified: true,
        human_notes: 'Verified by Incident Command Officer #42. Drone imagery matches GPS coordinates.',
      },
    ],
  },
  {
    id: 'inc-cyclone-grid-02',
    title: 'Cyclone Vardha: Grid Collapse & Arterial Tree Blockage',
    description:
      'Category 2 cyclonic wind gusts (115 km/h) caused widespread felling of mature trees, bringing down high-voltage transmission lines across Central Ring Highway.',
    disaster_type: 'cyclone',
    severity: 'high',
    status: 'active',
    latitude: 13.0475,
    longitude: 80.209,
    location_name: 'Central Ring Highway & South Junction',
    created_at: tMinus3h,
    updated_at: now.toISOString(),
    overall_uncertainty: 0.45,
    evidence_items: [
      {
        id: 'ev-05-social-photo',
        incident_id: 'inc-cyclone-grid-02',
        source_type: 'citizen_report',
        source_credibility: 0.6,
        media_type: 'image',
        file_path: 'sample_cyclone_grid.jpg',
        file_size: 1950000,
        mime_type: 'image/jpeg',
        observed_at: new Date(new Date(tMinus2h).getTime() - 20 * 60000).toISOString(),
        submitted_at: tMinus2h,
        verification_status: 'unverified',
        uncertainty_score: 0.45,
        uncertainty_factors: [
          'Single unverified photo from citizen mobile upload',
          'Timestamp inferred from EXIF creation time',
          'Live electrical hazard unconfirmed by utility operator',
        ],
        raw_description:
          'Massive banyan tree fell on power cables. Sparks visible, all 4 lanes blocked near Metro Station.',
        location_lat: 13.048,
        location_lon: 80.2095,
      },
    ],
    timeline_events: [
      {
        id: 'tl-06',
        incident_id: 'inc-cyclone-grid-02',
        evidence_id: 'ev-05-social-photo',
        event_time: new Date(new Date(tMinus2h).getTime() - 20 * 60000).toISOString(),
        recorded_at: tMinus2h,
        event_type: 'tree_fall_obstruction',
        summary:
          'Mature tree felling and electrical conductor drop reported on Central Ring Highway.',
        is_ai_inferred: false,
        confidence_score: 0.65,
      },
    ],
    ai_analyses: [
      {
        id: 'ai-02-cyclone-grid',
        incident_id: 'inc-cyclone-grid-02',
        model_id: 'meta-muse-spark-preview',
        created_at: tMinus1h,
        is_simulated: true,
        status: 'completed',
        primary_hazard: 'High-Wind Cyclonic Shearing & Live Grid Hazard',
        damage_type: 'Downed 11kV Conductors & Arterial Tree Occlusion',
        multimodal_summary:
          'Single citizen image indicates significant vehicular obstruction and electrical hazard. Awaiting corroboration from municipal utility telemetry.',
        hazard_assessment:
          'POTENTIAL FATAL ELECTRICAL HAZARD. Downed conductors in damp environment pose arc flash risk. DO NOT APPROACH. Roadway is impassable for emergency vehicles until grid isolation is confirmed by power utility.',
        detected_features: [
          'Severed 11kV distribution line on wet pavement',
          'Major road occlusion across both directional carriageways',
          'Felled mature banyan tree entangling secondary utility cables',
          'Absence of utility service vehicles at time of capture',
        ],
        uncertainty_evaluation:
          'Uncertainty HIGH (0.45). Requires verification: Whether power line is de-energized.',
        confidence_score: 0.62,
        rag_guidelines: searchGuidelines('cyclone wind wire power grid tree live conductor', 'cyclone', 3),
        disclaimer:
          'CrisisLens AI provides situational intelligence for emergency coordination. Inviolable Safety Guardrail: AI outputs are non-authoritative advisory predictions and cannot certify roadways, bridges, or facilities 100% safe without physical first-responder inspection.',
        human_verified: false,
        human_notes: null,
      },
    ],
  },
];

// Helper to compute overall uncertainty
function calculateUncertainty(items: any[]): number {
  if (!items || items.length === 0) return 0.85;
  const avg = items.reduce((sum, item) => sum + (item.uncertainty_score || 0.5), 0) / items.length;
  const sources = new Set(items.map((i) => i.source_type));
  const diversityDiscount = Math.min(0.3, (sources.size - 1) * 0.1);
  const volumeDiscount = Math.min(0.2, (items.length - 1) * 0.05);
  const finalScore = Math.max(0.05, Math.min(0.95, avg - diversityDiscount - volumeDiscount));
  return Math.round(finalScore * 100) / 100;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'CrisisLens API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    safety_guardrails_active: true,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'CrisisLens Full-Stack Node/Express API',
    version: '1.0.0',
    incidents_count: incidents.length,
    contacts_count: emergencyContacts.length,
    safety_guardrails_active: true,
  });
});

// Incidents List
app.get('/api/incidents', (_req, res) => {
  const result = incidents.map((inc) => {
    const evidenceItems = inc.evidence_items || [];
    const timelineEvents = inc.timeline_events || [];
    const latestObs = evidenceItems.length > 0
      ? evidenceItems.reduce((max: string, e: any) => (e.observed_at > max ? e.observed_at : max), evidenceItems[0].observed_at)
      : inc.created_at;

    return {
      id: inc.id,
      title: inc.title,
      description: inc.description,
      disaster_type: inc.disaster_type,
      severity: inc.severity,
      status: inc.status,
      latitude: inc.latitude,
      longitude: inc.longitude,
      location_name: inc.location_name,
      created_at: inc.created_at,
      updated_at: inc.updated_at,
      evidence_count: evidenceItems.length,
      timeline_event_count: timelineEvents.length,
      latest_observation_time: latestObs,
      overall_uncertainty: inc.overall_uncertainty || calculateUncertainty(evidenceItems),
    };
  });
  res.json(result);
});

// Create Incident
app.post('/api/incidents', (req, res) => {
  const { title, description, disaster_type, severity, status, latitude, longitude, location_name } = req.body;
  if (!title || !description) {
    return res.status(400).json({ detail: 'Title and description are required' });
  }

  const newId = `inc-${disaster_type || 'hazard'}-${Date.now().toString(36)}`;
  const newIncident = {
    id: newId,
    title,
    description,
    disaster_type: disaster_type || 'flood',
    severity: severity || 'high',
    status: status || 'active',
    latitude: Number(latitude) || 13.0827,
    longitude: Number(longitude) || 80.2707,
    location_name: location_name || 'Regional Emergency Coordinate',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    overall_uncertainty: 0.85,
    evidence_items: [],
    timeline_events: [],
    ai_analyses: [],
  };

  incidents.unshift(newIncident);

  res.status(201).json({
    id: newIncident.id,
    title: newIncident.title,
    description: newIncident.description,
    disaster_type: newIncident.disaster_type,
    severity: newIncident.severity,
    status: newIncident.status,
    latitude: newIncident.latitude,
    longitude: newIncident.longitude,
    location_name: newIncident.location_name,
    created_at: newIncident.created_at,
    updated_at: newIncident.updated_at,
    evidence_count: 0,
    timeline_event_count: 0,
    latest_observation_time: null,
    overall_uncertainty: 0.85,
  });
});

// Get Incident Detail
app.get('/api/incidents/:id', (req, res) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) {
    return res.status(404).json({ detail: 'Incident not found' });
  }

  const evidenceItems = inc.evidence_items || [];
  const timelineEvents = inc.timeline_events || [];
  const latestObs = evidenceItems.length > 0
    ? evidenceItems.reduce((max: string, e: any) => (e.observed_at > max ? e.observed_at : max), evidenceItems[0].observed_at)
    : inc.created_at;

  res.json({
    ...inc,
    evidence_count: evidenceItems.length,
    timeline_event_count: timelineEvents.length,
    latest_observation_time: latestObs,
    overall_uncertainty: inc.overall_uncertainty || calculateUncertainty(evidenceItems),
  });
});

// Submit Evidence
app.post('/api/incidents/:id/evidence', upload.single('file'), (req: Request, res: Response) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) {
    return res.status(404).json({ detail: 'Incident not found' });
  }

  const raw_description = req.body.raw_description || 'Unspecified ground report';
  const observed_at = req.body.observed_at || new Date().toISOString();
  const source_type = req.body.source_type || 'citizen_report';
  const location_lat = req.body.location_lat ? parseFloat(req.body.location_lat) : inc.latitude;
  const location_lon = req.body.location_lon ? parseFloat(req.body.location_lon) : inc.longitude;

  const credMap: Record<string, number> = {
    citizen_report: 0.65,
    first_responder: 0.92,
    field_sensor: 0.95,
    satellite_feed: 0.88,
  };
  const source_cred = credMap[source_type] || 0.7;
  const uncertainty_score = Math.round((1.0 - source_cred * 0.8) * 100) / 100;

  const nowIso = new Date().toISOString();
  const delayMinutes = Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(observed_at).getTime()) / 60000));

  const uncertainty_factors = [
    `Submitted via ${source_type.replace('_', ' ')} channel`,
    `Observation-to-submission latency: ${delayMinutes} minutes`,
  ];
  if (!req.file) {
    uncertainty_factors.push('No photographic evidence attached (text only)');
  }

  const newEvidence = {
    id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    incident_id: inc.id,
    source_type,
    source_credibility: source_cred,
    media_type: req.file ? 'image' : 'text_report',
    file_path: req.file ? req.file.filename : null,
    file_size: req.file ? req.file.size : 1024,
    mime_type: req.file ? req.file.mimetype : 'text/plain',
    observed_at: new Date(observed_at).toISOString(),
    submitted_at: nowIso,
    verification_status: 'unverified',
    uncertainty_score,
    uncertainty_factors,
    raw_description,
    location_lat,
    location_lon,
  };

  inc.evidence_items.push(newEvidence);

  // Add chronological timeline event
  const newTimelineEvent = {
    id: `tl-${Date.now().toString(36)}`,
    incident_id: inc.id,
    evidence_id: newEvidence.id,
    event_time: newEvidence.observed_at,
    recorded_at: nowIso,
    event_type: 'field_observation_reported',
    summary: `[${source_type.replace('_', ' ').toUpperCase()}] ${raw_description.slice(0, 120)}...`,
    is_ai_inferred: false,
    confidence_score: source_cred,
  };

  inc.timeline_events.push(newTimelineEvent);
  inc.updated_at = nowIso;
  inc.overall_uncertainty = calculateUncertainty(inc.evidence_items);

  res.status(201).json(newEvidence);
});

// Evidence File Server
app.get('/api/incidents/evidence/:evidence_id/file', (req, res) => {
  let foundEvidence: any = null;
  for (const inc of incidents) {
    const e = inc.evidence_items.find((item: any) => item.id === req.params.evidence_id);
    if (e) {
      foundEvidence = e;
      break;
    }
  }

  if (foundEvidence && foundEvidence.file_path) {
    const fullPath = path.join(UPLOAD_DIR, foundEvidence.file_path);
    if (fs.existsSync(fullPath)) {
      return res.sendFile(fullPath);
    }
  }

  // Fallback high-contrast SVG
  const desc = foundEvidence ? foundEvidence.raw_description.slice(0, 40) : 'CrisisLens Capture';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="100%" height="100%" fill="#0f172a"/>
    <circle cx="300" cy="180" r="45" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <path d="M285 180 L295 190 L315 170" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
    <text x="50%" y="260" fill="#f8fafc" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">CrisisLens Evidence Record</text>
    <text x="50%" y="285" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">${desc}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Run AI Analysis for incident
app.post('/api/incidents/:id/analyze', (req, res) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) {
    return res.status(404).json({ detail: 'Incident not found' });
  }

  const disasterType = inc.disaster_type;
  const guidelines = searchGuidelines(`${disasterType} ${inc.title}`, disasterType, 3);

  let primaryHazard = 'Hydrological Surge & Rapid Inundation';
  let damageType = 'Embankment Overwash & Arterial Scour';
  let detectedFeatures = [
    'Submerged passenger vehicles at downstream intersection',
    'High turbidity current indicating active levee erosion',
    'Hydrodynamic scour threat along bridge approach abutment',
    'Water depth approximately 0.6m to 1.1m overtopping stone embankment',
  ];
  let hazardAssessment =
    'HIGH HAZARD. Water depths range from 0.6m to 1.1m across residential zones. Primary roadway impassable. Inviolable Safety Guardrail: Model cannot declare routes safe without physical first-responder inspection.';
  let uncertaintyEval =
    'Uncertainty Score: 0.22 (Low). Corroborated across citizen visual ground capture, automated sensor telemetry, and aerial drone orthomosaic.';
  let confidenceScore = 0.86;

  if (disasterType === 'cyclone') {
    primaryHazard = 'High-Wind Cyclonic Shearing & Live Grid Hazard';
    damageType = 'Downed Transmission Conductors & Roadway Tree Occlusion';
    detectedFeatures = [
      'Severed overhead 11kV electrical distribution cable on wet pavement',
      'Felled mature tree occluding multiple vehicular carriageways',
      'Dangerous step-potential gradient hazard in saturated asphalt',
      'Absence of utility de-energization confirmation',
    ];
    hazardAssessment =
      'POTENTIAL FATAL ELECTRICAL HAZARD. Downed conductors in damp environment pose arc flash risk. DO NOT APPROACH. Roadway is impassable for emergency vehicles until grid isolation is confirmed by power utility.';
    uncertaintyEval =
      'Uncertainty Score: 0.38 (Moderate). Critical unknown: Grid energization state remains unconfirmed. Cordon perimeter must be maintained until electrical board LOTO clearance.';
    confidenceScore = 0.76;
  }

  const newAnalysis = {
    id: `ai-${Date.now().toString(36)}`,
    incident_id: inc.id,
    model_id: 'meta-muse-spark-preview',
    created_at: new Date().toISOString(),
    is_simulated: true,
    status: 'completed',
    primary_hazard: primaryHazard,
    damage_type: damageType,
    multimodal_summary: `Meta Muse Spark synthesized ${inc.evidence_items.length} heterogeneous evidence item(s) for '${inc.title}'. Observation metadata demonstrates advancing ground impact. Visible structural and flood evidence confirms severe infrastructural exposure.`,
    hazard_assessment: hazardAssessment,
    detected_features: detectedFeatures,
    uncertainty_evaluation: uncertaintyEval,
    confidence_score: confidenceScore,
    rag_guidelines: guidelines,
    disclaimer:
      'CrisisLens AI provides situational intelligence for emergency coordination. Inviolable Safety Guardrail: AI outputs are non-authoritative advisory predictions and cannot certify roadways, bridges, or facilities 100% safe without physical first-responder inspection.',
    human_verified: false,
    human_notes: null,
  };

  inc.ai_analyses.unshift(newAnalysis);

  // Inferred timeline event
  inc.timeline_events.push({
    id: `tl-ai-${Date.now().toString(36)}`,
    incident_id: inc.id,
    evidence_id: null,
    event_time: new Date().toISOString(),
    recorded_at: new Date().toISOString(),
    event_type: 'ai_multimodal_synthesis',
    summary: `[Meta Muse Spark] Primary Hazard: ${primaryHazard}. Damage: ${damageType}. ${hazardAssessment.slice(0, 100)}...`,
    is_ai_inferred: true,
    confidence_score: confidenceScore,
  });

  res.status(201).json(newAnalysis);
});

// Incident Protocols (RAG)
app.get('/api/incidents/:id/protocols', (req, res) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) {
    return res.status(404).json({ detail: 'Incident not found' });
  }

  const evidenceText = (inc.evidence_items || []).slice(0, 3).map((e: any) => e.raw_description).join(' ');
  const query = `${inc.disaster_type} ${inc.title} ${evidenceText}`;
  const guidelines = searchGuidelines(query, inc.disaster_type, 4);

  res.json({
    incident_id: inc.id,
    disaster_type: inc.disaster_type,
    query_matched: query,
    protocols: guidelines,
  });
});

// Human Verification update
app.patch('/api/incidents/:id/analysis/:analysis_id/verify', (req, res) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) return res.status(404).json({ detail: 'Incident not found' });

  const analysis = inc.ai_analyses.find((a: any) => a.id === req.params.analysis_id);
  if (!analysis) return res.status(404).json({ detail: 'Analysis not found' });

  analysis.human_verified = Boolean(req.body.human_verified);
  if (req.body.human_notes) {
    analysis.human_notes = req.body.human_notes;
  }

  res.json({
    status: 'success',
    human_verified: analysis.human_verified,
    notes: analysis.human_notes,
  });
});

// First Responder Action
app.post('/api/incidents/:id/action', (req, res) => {
  const inc = incidents.find((i) => i.id === req.params.id);
  if (!inc) return res.status(404).json({ detail: 'Incident not found' });

  const { action, notes } = req.body;
  const nowIso = new Date().toISOString();
  let message = '';

  if (action === 'mark_verified') {
    inc.evidence_items.forEach((ev: any) => {
      ev.verification_status = 'verified_by_official';
      ev.uncertainty_score = Math.max(0.05, ev.uncertainty_score * 0.4);
    });
    if (inc.ai_analyses.length > 0) {
      inc.ai_analyses[0].human_verified = true;
      inc.ai_analyses[0].human_notes = notes || 'Verified on-site by Incident Command Officer';
    }
    inc.timeline_events.push({
      id: `tl-${Date.now().toString(36)}`,
      incident_id: inc.id,
      evidence_id: null,
      event_time: nowIso,
      recorded_at: nowIso,
      event_type: 'responder_verification_approved',
      summary: `Incident ground reality officially VERIFIED by Field Responder. ${notes || ''}`,
      is_ai_inferred: false,
      confidence_score: 0.98,
    });
    message = 'Incident and AI analysis marked as officially verified.';
  } else if (action === 'flag_more_evidence') {
    inc.timeline_events.push({
      id: `tl-${Date.now().toString(36)}`,
      incident_id: inc.id,
      evidence_id: null,
      event_time: nowIso,
      recorded_at: nowIso,
      event_type: 'evidence_gap_flagged',
      summary: `RECONNAISSANCE REQUESTED: First responder flagged evidence as insufficient. ${notes || ''}`,
      is_ai_inferred: false,
      confidence_score: 0.5,
    });
    message = 'Evidence flagged as requiring additional ground/aerial reconnaissance.';
  } else if (action === 'escalate_priority') {
    inc.severity = 'critical';
    inc.timeline_events.push({
      id: `tl-${Date.now().toString(36)}`,
      incident_id: inc.id,
      evidence_id: null,
      event_time: nowIso,
      recorded_at: nowIso,
      event_type: 'priority_escalated_critical',
      summary: `PRIORITY ESCALATED: Severity elevated to CRITICAL by on-scene commander. ${notes || ''}`,
      is_ai_inferred: false,
      confidence_score: 0.95,
    });
    message = 'Incident severity escalated to CRITICAL priority.';
  } else {
    return res.status(400).json({ detail: `Unknown action: ${action}` });
  }

  inc.updated_at = nowIso;
  res.json({ status: 'success', action, message });
});

// AI Status
app.get('/api/analysis/status', (_req, res) => {
  res.json({
    provider: 'Meta Model API',
    primary_model: process.env.META_MODEL_ID || 'meta-muse-spark-preview',
    segmentation_model: 'meta-sam-3.1',
    live_api_connected: Boolean(process.env.META_API_KEY && !process.env.META_API_KEY.startsWith('your_')),
    mode: process.env.META_API_KEY ? 'Live Meta Model API' : 'Demonstration / Preview Mode',
    safety_guardrails: [
      'Prohibits autonomous safe-road / all-clear declarations',
      'Enforces separation of ground observations from AI inferences',
      'Mandatory responder-in-the-loop verification protocol',
      'Strict non-authoritative advisory disclaimer',
    ],
    disclaimer:
      'CrisisLens AI provides situational intelligence for emergency coordination. Inviolable Safety Guardrail: AI outputs are non-authoritative advisory predictions and cannot certify roadways, bridges, or facilities 100% safe without physical first-responder inspection.',
  });
});

// Emergency Contacts
app.get('/api/contacts', (req, res) => {
  const category = req.query.category as string;
  const originLat = req.query.lat ? parseFloat(req.query.lat as string) : 13.0827;
  const originLon = req.query.lon ? parseFloat(req.query.lon as string) : 80.2707;
  const radiusKm = req.query.radius_km ? parseFloat(req.query.radius_km as string) : 75.0;

  let filtered = emergencyContacts;
  if (category && category !== 'all') {
    filtered = filtered.filter((c) => c.category === category);
  }

  const result = filtered
    .map((c) => {
      const distance = haversineKm(originLat, originLon, c.latitude, c.longitude);
      return {
        ...c,
        distance_km: distance,
      };
    })
    .filter((c) => c.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json(result);
});

// Dispatch Emergency Contact
app.post('/api/contacts/:id/dispatch', (req, res) => {
  const contact = emergencyContacts.find((c) => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({ detail: 'Emergency contact not found' });
  }

  const previous = contact.trust_status;
  const nowIso = new Date().toISOString();
  const notes = req.body.notes || 'Emergency trigger initiated from CrisisLens dispatch panel.';

  contact.trust_status = 'dispatched_verified';
  contact.availability_status = 'Deployed';
  contact.last_dispatched_at = nowIso;

  const log = {
    id: `log-${Date.now().toString(36)}`,
    contact_id: contact.id,
    previous_status: previous,
    new_status: 'dispatched_verified',
    notes,
    created_at: nowIso,
  };
  dispatchLogs.unshift(log);

  const distance = haversineKm(13.0827, 80.2707, contact.latitude, contact.longitude);
  res.json({
    ...contact,
    distance_km: distance,
  });
});

// Dispatch Logs
app.get('/api/contacts/:id/logs', (req, res) => {
  const logs = dispatchLogs.filter((l) => l.contact_id === req.params.id);
  res.json(logs);
});

// Rescue Contacts
app.get('/api/rescue-contacts', (req, res) => {
  const contact_type = req.query.contact_type as string;
  const availability = req.query.availability_status as string;

  let filtered = rescueContacts;
  if (contact_type && contact_type !== 'all') {
    filtered = filtered.filter((c) => c.contact_type === contact_type);
  }
  if (availability && availability !== 'all') {
    filtered = filtered.filter((c) => c.availability_status === availability);
  }

  res.json(filtered);
});

// Start Server & mount Vite in development or serve static dist in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('Error mounting Vite middleware:', err);
    }
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`CrisisLens server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
