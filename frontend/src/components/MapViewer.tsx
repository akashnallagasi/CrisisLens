import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '../types';

interface MapViewerProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  center = [13.065, 80.24],
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // Free OpenStreetMap tile provider (no API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Severity color mapping
    const getSeverityColor = (sev: string) => {
      switch (sev) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'moderate': return '#eab308';
        default: return '#10b981';
      }
    };

    // Plot markers
    incidents.forEach((inc) => {
      const color = getSeverityColor(inc.severity);
      const isSelected = inc.id === selectedIncidentId;

      const customIcon = L.divIcon({
        className: 'custom-disaster-marker',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50%;
            background-color: ${color};
            border: 3px solid white;
            box-shadow: 0 0 15px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${inc.evidence_count}
          </div>
        `,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon }).addTo(map);

      // Popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color};">
              ${inc.disaster_type.toUpperCase()} • ${inc.severity.toUpperCase()}
            </span>
            <span style="font-size: 10px; background: #334155; color: #94a3b8; padding: 1px 6px; border-radius: 4px;">
              ${inc.status}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 700; color: #f8fafc; margin: 0 0 4px 0;">${inc.title}</h4>
          <p style="font-size: 11px; color: #cbd5e1; margin: 0 0 8px 0; line-height: 1.3;">${inc.location_name}</p>
          <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 6px;">
            <span>Evidence Items: <strong>${inc.evidence_count}</strong></span>
            <span>Uncertainty: <strong>${(inc.overall_uncertainty * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectIncident(inc.id);
      });

      markersRef.current[inc.id] = marker;
    });

    // Center on selected incident if provided
    if (selectedIncidentId) {
      const selected = incidents.find((i) => i.id === selectedIncidentId);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 14, { duration: 1.2 });
        markersRef.current[selected.id]?.openPopup();
      }
    }

    return () => {
      // Don't remove map entirely on simple updates, just markers
    };
  }, [incidents, selectedIncidentId, onSelectIncident]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-lg">
        <p className="font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
          <span>Hazard Severity</span>
        </p>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
            <span className="text-slate-300">Critical Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500" />
            <span className="text-slate-300">High / Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            <span className="text-slate-300">Moderate / Monitored</span>
          </div>
        </div>
      </div>
    </div>
  );
};
