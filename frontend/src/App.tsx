import React, { useEffect, useState } from 'react';
import { Incident } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SubmitReport } from './pages/SubmitReport';
import { IncidentDetail } from './pages/IncidentDetail';
import { AIIntelligence } from './pages/AIIntelligence';
import { EmergencyDispatchPanel } from './components/EmergencyDispatchPanel';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'submit' | 'ai' | 'dispatch'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setError(null);
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err: any) {
      console.error('Error fetching incidents:', err);
      setError('Unable to reach CrisisLens backend API. Please ensure the server is active.');
    } finally {
      setLoading(false);
    }
  };

  const checkAiStatus = async () => {
    try {
      const status = await api.getAIStatus();
      setIsAiLive(status.live_api_connected);
    } catch (err) {
      console.error('Error checking AI status:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    checkAiStatus();
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
  };

  const handleBackToDashboard = () => {
    setSelectedIncidentId(null);
    setCurrentTab('dashboard');
    fetchIncidents();
  };

  const handleReportSubmitted = (incidentId: string) => {
    fetchIncidents();
    setSelectedIncidentId(incidentId);
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedIncidentId(null);
          setCurrentTab(tab);
        }}
        activeCount={incidents.length}
        isAiLive={isAiLive}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchIncidents}
              className="flex items-center space-x-1 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Loading CrisisLens Disaster Operations...</p>
              <p className="text-xs text-slate-500">Connecting to multimodal evidence repository</p>
            </div>
          </div>
        ) : selectedIncidentId ? (
          <IncidentDetail
            incidentId={selectedIncidentId}
            onBack={handleBackToDashboard}
            onAddEvidence={() => {
              setCurrentTab('submit');
            }}
          />
        ) : currentTab === 'dashboard' ? (
          <Dashboard
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onOpenReport={() => setCurrentTab('submit')}
          />
        ) : currentTab === 'submit' ? (
          <SubmitReport
            incidents={incidents}
            onReportSubmitted={handleReportSubmitted}
            onCancel={() => setCurrentTab('dashboard')}
          />
        ) : currentTab === 'dispatch' ? (
          <EmergencyDispatchPanel />
        ) : (
          <AIIntelligence
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
          />
        )}
      </main>

      {/* Advisory Disaster Footer */}
      <footer className="border-t border-slate-900 bg-[#070b14] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CrisisLens • Meta Global AI Developer Hackathon 2026 • Evidence-Aware Multimodal Platform
          </span>
          <span className="text-[11px] text-slate-600">
            Advisory decision support only. Not an authoritative emergency response entity.
          </span>
        </div>
      </footer>
    </div>
  );
};
