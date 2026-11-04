export type DisasterType = 'flood' | 'cyclone' | 'landslide' | 'storm_surge' | 'infrastructure_failure' | 'wildfire';
export type SeverityLevel = 'critical' | 'high' | 'moderate' | 'low';
export type IncidentStatus = 'active' | 'monitoring' | 'contained' | 'resolved';
export type SourceType = 'citizen_report' | 'satellite_feed' | 'field_sensor' | 'first_responder' | 'official_bulletin';
export type VerificationStatus = 'unverified' | 'corroborated' | 'verified_by_official' | 'disputed';

export interface EvidenceItem {
  id: string;
  incident_id: string;
  source_type: SourceType;
  source_credibility: number;
  media_type: 'image' | 'sensor' | 'text_report';
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  observed_at: string; // The crucial ground-truth observation timestamp
  submitted_at: string; // When the report arrived at the platform
  verification_status: VerificationStatus;
  uncertainty_score: number; // 0.0 = high certainty, 1.0 = high uncertainty
  uncertainty_factors: string[] | null;
  raw_description: string;
  location_lat: number | null;
  location_lon: number | null;
}

export interface TimelineEvent {
  id: string;
  incident_id: string;
  evidence_id: string | null;
  event_time: string; // Actual time of event in the field
  recorded_at: string;
  event_type: string;
  summary: string;
  is_ai_inferred: boolean; // Distinction between ground observation vs AI inferred milestone
  confidence_score: number;
}

export interface DisasterProtocol {
  id: string;
  agency: string;
  source_document: string;
  section: string;
  category: string;
  summary: string;
  guidance: string;
  responder_action: string;
  safety_level: string;
  relevance_score: number;
}

export interface AIAnalysis {
  id: string;
  incident_id: string;
  model_id: string;
  created_at: string;
  is_simulated: boolean;
  status: string;
  primary_hazard?: string;
  damage_type?: string;
  multimodal_summary: string;
  hazard_assessment: string;
  detected_features: string[] | null;
  uncertainty_evaluation: string;
  confidence_score: number;
  rag_guidelines?: DisasterProtocol[] | null;
  disclaimer: string;
  human_verified: boolean;
  human_notes: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  disaster_type: DisasterType;
  severity: SeverityLevel;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  location_name: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  timeline_event_count: number;
  latest_observation_time: string | null;
  overall_uncertainty: number;
}

export interface IncidentDetail extends Incident {
  evidence_items: EvidenceItem[];
  timeline_events: TimelineEvent[];
  ai_analyses: AIAnalysis[];
}

export interface AIStatusInfo {
  provider: string;
  primary_model: string;
  segmentation_model: string;
  live_api_connected: boolean;
  mode: string;
  safety_guardrails: string[];
  disclaimer: string;
}

export type EmergencyCategory = 'police' | 'hospital' | 'fema_ndma';
export type TrustStatus = 'pending_verification' | 'dispatched_verified';

export interface EmergencyContact {
  id: string;
  name: string;
  category: EmergencyCategory;
  phone: string;
  alt_phone?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  coverage_radius_km: number;
  availability_status: string;
  trust_status: TrustStatus;
  specialization?: string | null;
  created_at?: string;
  last_dispatched_at?: string | null;
  distance_km?: number | null;
}

export interface DispatchLog {
  id: string;
  contact_id: string;
  previous_status: string;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface RescueContact {
  id: string;
  name: string;
  contact_type: 'water_rescue' | 'national_force' | 'police_fire' | 'medical_ems' | 'shelter_relief';
  phone_hotline: string;
  alt_phone?: string | null;
  coverage_city: string;
  coverage_radius_km: number;
  availability_status: '24/7 Active' | 'Standby' | 'Deployed';
  latitude: number;
  longitude: number;
  specialization?: string | null;
  created_at?: string;
}
