import React, { useState } from 'react';
import { Incident } from '../types';
import { MapViewer } from '../components/MapViewer';
import { EmergencyDispatchPanel } from '../components/EmergencyDispatchPanel';
import { UncertaintyIndicator } from '../components/UncertaintyIndicator';
import { AlertTriangle, Droplets, Wind, ShieldAlert, ChevronRight, Filter, Clock, Eye, CheckCircle2, Zap, Sparkles, X } from 'lucide-react';

interface DashboardProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onOpenReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  incidents,
  onSelectIncident,
  onOpenReport,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    incidents.length > 0 ? incidents[0].id : null
  );
  const [simulating, setSimulating] = useState(false);
  const [simulationAlert, setSimulationAlert] = useState<string | null>(null);

  const handleRunSimulation = () => {
    setSimulating(true);
    setSimulationAlert('⚡ INGESTING LIVE TELEMETRY: Ultrasonic River Sensor #EST-44 recorded sudden +58cm stage surge (water velocity 2.1 m/s). Meta Muse Spark dynamically recalculating hazard contours...');

    setTimeout(() => {
      setSimulating(false);
      setSimulationAlert('✅ META MUSE SPARK SYNTHESIS COMPLETE: Breach cordon expanded 300m downstream. Staging zone relocated to High Ridge Staging Apron. NDRF Battalion 04 auto-alerted.');
      setTimeout(() => setSimulationAlert(null), 8000);
    }, 1800);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType === 'all') return true;
    return inc.disaster_type === filterType;
  });

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const totalEvidence = incidents.reduce((acc, i) => acc + i.evidence_count, 0);
  const avgUncertainty =
    incidents.length > 0
      ? incidents.reduce((acc, i) => acc + i.overall_uncertainty, 0) / incidents.length
      : 0.35;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flood': return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'cyclone': return <Wind className="w-4 h-4 text-cyan-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">MODERATE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Incidents */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Disaster Incidents</p>
            <p className="text-2xl font-extrabold text-white mt-1">{incidents.length}</p>
            <p className="text-[11px] text-sky-400 mt-0.5 font-medium">Reconstructing ground truth</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Critical Alerts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Critical Priority Zones</p>
            <p className="text-2xl font-extrabold text-rose-400 mt-1">{criticalCount}</p>
            <p className="text-[11px] text-rose-300 mt-0.5 font-medium">Immediate focus required</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Multi-Source Evidence */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Heterogeneous Evidence Items</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalEvidence}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">Citizen, sensor & responder</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Average Ground Certainty */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">System Certainty Index</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {Math.round((1 - avgUncertainty) * 100)}%
            </p>
            <p className="text-[11px] text-amber-400 mt-0.5 font-medium">
              {(avgUncertainty * 100).toFixed(0)}% composite uncertainty
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Map & Incident Stream Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Operational Incident Map</span>
                <span className="text-xs font-normal text-slate-400">(OpenStreetMap + CARTO Voyager)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Live spatial positioning with marker badges indicating corroborated evidence count.
              </p>
            </div>
            
            {/* Filter buttons & Live Demo Simulation Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunSimulation}
                disabled={simulating}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-300 ${simulating ? 'animate-spin' : ''}`} />
                <span>{simulating ? 'Simulating Surge...' : '⚡ Simulate Live Surge (Demo)'}</span>
              </button>

              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'all' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('flood')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'flood' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Floods
                </button>
                <button
                  onClick={() => setFilterType('cyclone')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    filterType === 'cyclone' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cyclones
                </button>
              </div>
            </div>
          </div>

          <div className="h-[520px] w-full">
            <MapViewer
              incidents={filteredIncidents}
              selectedIncidentId={selectedId}
              onSelectIncident={(id) => {
                setSelectedId(id);
                onSelectIncident(id);
              }}
            />
          </div>
        </div>

        {/* Right Column: Active Incident Dossiers (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Incident Feeds</h2>
            <button
              onClick={onOpenReport}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline"
            >
              + Submit Evidence
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {filteredIncidents.map((inc) => {
              const isSelected = inc.id === selectedId;
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedId(inc.id);
                    onSelectIncident(inc.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-sky-500/80 shadow-lg shadow-sky-950/50 ring-1 ring-sky-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700">
                        {getTypeIcon(inc.disaster_type)}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {inc.disaster_type}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {inc.title}
                        </h3>
                      </div>
                    </div>
                    {getSeverityBadge(inc.severity)}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {inc.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span>{inc.location_name}</span>
                    <span className="text-sky-400 font-medium">
                      {inc.evidence_count} evidence report{inc.evidence_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Uncertainty & Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <UncertaintyIndicator
                      uncertaintyScore={inc.overall_uncertainty}
                      size="sm"
                    />
                    <div className="flex items-center space-x-1 text-xs font-semibold text-sky-400 group-hover:translate-x-1 transition-transform">
                      <span>Inspect Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EmergencyDispatchPanel />
    </div>
  );
};
