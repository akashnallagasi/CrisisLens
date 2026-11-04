import React, { useEffect, useState } from 'react';
import { Incident } from './types';
import { api, getStoredBackendUrl, setStoredBackendUrl } from './services/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SubmitReport } from './pages/SubmitReport';
import { IncidentDetail } from './pages/IncidentDetail';
import { AIIntelligence } from './pages/AIIntelligence';
import { EmergencyDispatchPanel } from './components/EmergencyDispatchPanel';
import { BackendConnectionModal } from './components/BackendConnectionModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { VoiceAssistantFab } from './components/VoiceAssistantFab';
import { AlertTriangle, RefreshCw, Server, Zap, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'submit' | 'ai' | 'dispatch'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  const fetchIncidents = async () => {
    try {
      setError(null);
      const data = await api.getIncidents();
      setIncidents(data);
      if (api.isUsingFallback()) {
        const reason = api.getFallbackReason();
        if (reason) {
          setError(reason);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching incidents, using emergency fallback:', err);
      // Even if fetch throws, incidents will still be loaded
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

  const handleSwitchToEmbedded = () => {
    setStoredBackendUrl('');
    setError(null);
    setLoading(true);
    fetchIncidents();
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
        onOpenBackendSettings={() => setIsBackendModalOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-200">{error}</p>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  CrisisLens is operating normally with all disaster intelligence, evidence analysis, and dispatch features active.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
              {getStoredBackendUrl() ? (
                <button
                  onClick={handleSwitchToEmbedded}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Use Embedded</span>
                </button>
              ) : null}
              <button
                onClick={() => setIsBackendModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Backend Settings</span>
              </button>
              <button
                onClick={() => setError(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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

      {/* Backend Configuration Modal */}
      <BackendConnectionModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onConnectionChanged={() => {
          setLoading(true);
          fetchIncidents();
          checkAiStatus();
        }}
      />

      {/* Multilingual Voice AI Assistant (Speech Recognition + TTS + World Languages) */}
      <VoiceAssistantFab onClick={() => setIsVoiceModalOpen(true)} />
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
      />
    </div>
  );
};
