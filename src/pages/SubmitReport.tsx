import React, { useState } from 'react';
import { Incident } from '../types';
import { api } from '../services/api';
import { Upload, Camera, MapPin, Clock, AlertTriangle, CheckCircle, ShieldAlert, FileText } from 'lucide-react';

interface SubmitReportProps {
  incidents: Incident[];
  onReportSubmitted: (incidentId: string) => void;
  onCancel: () => void;
}

export const SubmitReport: React.FC<SubmitReportProps> = ({
  incidents,
  onReportSubmitted,
  onCancel,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents.length > 0 ? incidents[0].id : 'new'
  );

  // New incident fields
  const [newTitle, setNewTitle] = useState('');
  const [newDisasterType, setNewDisasterType] = useState('flood');
  const [newSeverity, setNewSeverity] = useState('high');
  const [locationName, setLocationName] = useState('North River Crossing, Sector 2');
  const [latitude, setLatitude] = useState(13.082);
  const [longitude, setLongitude] = useState(80.270);

  // Evidence fields
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('citizen_report');
  
  // Default observation time: 30 minutes ago to illustrate distinct ground observation vs arrival time!
  const defaultObsTime = new Date(Date.now() - 30 * 60000).toISOString().slice(0, 16);
  const [observedAt, setObservedAt] = useState(defaultObsTime);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // Strict client-side validation
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selected.type)) {
        setError('Only JPG, PNG, and WebP image formats are permitted.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setError('File exceeds 10 MB limit.');
        return;
      }

      setError(null);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!description.trim()) {
      setError('Please provide an observation description.');
      return;
    }

    try {
      setSubmitting(true);
      let targetIncidentId = selectedIncidentId;

      // If user selected to create a new disaster incident first
      if (selectedIncidentId === 'new') {
        if (!newTitle.trim()) {
          setError('Please provide a title for the new incident.');
          setSubmitting(false);
          return;
        }

        const created = await api.createIncident({
          title: newTitle,
          description: description,
          disaster_type: newDisasterType,
          severity: newSeverity,
          status: 'active',
          latitude: Number(latitude),
          longitude: Number(longitude),
          location_name: locationName,
        });
        targetIncidentId = created.id;
      }

      // Prepare multi-part form data for evidence submission
      const formData = new FormData();
      formData.append('raw_description', description);
      formData.append('observed_at', new Date(observedAt).toISOString());
      formData.append('source_type', sourceType);
      formData.append('location_lat', latitude.toString());
      formData.append('location_lon', longitude.toString());
      
      if (file) {
        formData.append('file', file);
      }

      await api.submitEvidence(targetIncidentId, formData);
      setSuccess('Evidence successfully recorded and chronological timeline updated!');
      
      setTimeout(() => {
        onReportSubmitted(targetIncidentId);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Camera className="w-6 h-6 text-sky-400" />
          <span>Submit Ground Evidence Report</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Preserves verifiable ground observation timestamps separately from ingestion arrival timestamps.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        {/* Incident Target Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Target Incident Dossier
          </label>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                Existing: {i.title} ({i.disaster_type.toUpperCase()} • {i.location_name})
              </option>
            ))}
            <option value="new">+ Declare New Disaster Incident</option>
          </select>
        </div>

        {/* If New Incident: Additional metadata */}
        {selectedIncidentId === 'new' && (
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-sky-400">New Incident Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incident Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. South Canal Embankment Overwash"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Disaster Category</label>
                <select
                  value={newDisasterType}
                  onChange={(e) => setNewDisasterType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="flood">Flood & Inundation</option>
                  <option value="cyclone">Cyclone & Gale Winds</option>
                  <option value="landslide">Landslide & Mudflow</option>
                  <option value="storm_surge">Coastal Storm Surge</option>
                  <option value="infrastructure_failure">Infrastructure Failure</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CRITICAL FEATURE: Distinct Observation Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Ground Observation Timestamp</span>
            </label>
            <input
              type="datetime-local"
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Exact ground moment the disaster condition was witnessed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Reporting Source Channel
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="citizen_report">Citizen Field Capture</option>
              <option value="first_responder">First Responder Patrol Squad</option>
              <option value="field_sensor">Telemetry / Automated Sensor</option>
              <option value="satellite_feed">Satellite / Aerial Drone Feed</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Calibrates initial credibility & uncertainty metrics.
            </p>
          </div>
        </div>

        {/* Location Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Location Landmark</span>
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Sector 4 Bridge"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Observation Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Factual Ground Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what was directly witnessed (e.g., water depth, direction of flow, road blockages, structural failures)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500"
            required
          />
        </div>

        {/* File Upload (Securely isolated, restricted to JPG/PNG/WebP, max 10MB) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            Photographic Evidence (Optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-xl hover:border-sky-500 transition-colors bg-slate-950/40">
            <div className="space-y-2 text-center">
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Evidence Preview"
                    className="max-h-48 mx-auto rounded-lg border border-slate-700 shadow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Remove selected file
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="flex text-sm text-slate-400 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none">
                      <span>Upload image file</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, WebP up to 10MB • Strict validation enforced
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-lg shadow-sky-600/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{submitting ? 'Submitting & Indexing...' : 'Submit Evidence Dossier'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
