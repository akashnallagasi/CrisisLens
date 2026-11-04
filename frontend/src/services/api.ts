import { Incident, IncidentDetail, EvidenceItem, AIAnalysis, AIStatusInfo, EmergencyContact, DispatchLog } from '../types';

const API_BASE = '/api';

export const api = {
  // Incidents
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
    return res.json();
  },

  async getIncident(id: string): Promise<IncidentDetail> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident details: ${res.statusText}`);
    return res.json();
  },

  async createIncident(data: {
    title: string;
    description: string;
    disaster_type: string;
    severity: string;
    status: string;
    latitude: number;
    longitude: number;
    location_name: string;
  }): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to create incident');
    }
    return res.json();
  },

  // Submit Evidence
  async submitEvidence(
    incidentId: string,
    formData: FormData
  ): Promise<EvidenceItem> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/evidence`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to submit evidence');
    }
    return res.json();
  },

  // AI Analysis (Meta Muse Spark)
  async getAIStatus(): Promise<AIStatusInfo> {
    const res = await fetch(`${API_BASE}/analysis/status`);
    if (!res.ok) throw new Error('Failed to retrieve AI model status');
    return res.json();
  },

  async runAIAnalysis(incidentId: string): Promise<AIAnalysis> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to run Meta Muse Spark analysis');
    }
    return res.json();
  },

  async getIncidentProtocols(incidentId: string) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/protocols`);
    if (!res.ok) throw new Error('Failed to fetch disaster protocols');
    return res.json();
  },

  async verifyAnalysis(incidentId: string, analysisId: string, verified: boolean, notes: string) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/analysis/${analysisId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ human_verified: verified, human_notes: notes }),
    });
    if (!res.ok) throw new Error('Failed to update verification status');
    return res.json();
  },

  // Rescue Contacts & Emergency Dispatch
  async getRescueContacts(contactType?: string): Promise<import('../types').RescueContact[]> {
    const query = contactType && contactType !== 'all' ? `?contact_type=${contactType}` : '';
    const res = await fetch(`${API_BASE}/rescue-contacts${query}`);
    if (!res.ok) throw new Error('Failed to retrieve emergency rescue contacts');
    return res.json();
  },

  // Nearby police, hospitals, FEMA/NDMA nodes (proxied to http://localhost:8000/api/contacts/)
  async getEmergencyContacts(category?: string): Promise<EmergencyContact[]> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE}/contacts/${query}`);
    if (!res.ok) throw new Error('Failed to retrieve emergency dispatch contacts');
    return res.json();
  },

  async dispatchEmergencyContact(contactId: string, notes?: string): Promise<EmergencyContact> {
    const res = await fetch(`${API_BASE}/contacts/${contactId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: notes || 'Emergency trigger initiated from CrisisLens dispatch panel.',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to log responder dispatch');
    }
    return res.json();
  },

  async getDispatchLogs(contactId: string): Promise<DispatchLog[]> {
    const res = await fetch(`${API_BASE}/contacts/${contactId}/logs`);
    if (!res.ok) throw new Error('Failed to retrieve dispatch audit log');
    return res.json();
  },

  // First Responder Actions
  async executeIncidentAction(incidentId: string, action: string, notes?: string) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to execute responder action');
    }
    return res.json();
  }
};
