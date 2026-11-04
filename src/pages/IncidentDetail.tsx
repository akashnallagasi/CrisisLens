import React, { useEffect, useState } from 'react';
import { IncidentDetail as IncidentDetailType } from '../types';
import { api } from '../services/api';
import { TimelineView } from '../components/TimelineView';
import { EvidenceCard } from '../components/EvidenceCard';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { UncertaintyIndicator } from '../components/UncertaintyIndicator';
import { SamSegmentationModal } from '../components/SamSegmentationModal';
import { SituationBriefModal } from '../components/SituationBriefModal';
import { LlamaCommandAssistant } from '../components/LlamaCommandAssistant';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShieldAlert,
  Droplets,
  Wind,
  Plus,
  Layers,
  AlertTriangle,
  FileText,
  Bot,
  Sparkles,
} from 'lucide-react';

interface IncidentDetailProps {
  incidentId: string;
  onBack: () => void;
  onAddEvidence: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  incidentId,
  onBack,
  onAddEvidence,
}) => {
  const [detail, setDetail] = useState<IncidentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'ai' | 'llama'>('timeline');
  const [isSamModalOpen, setIsSamModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getIncident(incidentId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Reconstructing multi-source incident timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Incident Dossier Unavailable</h3>
        <p className="text-xs text-slate-400">{error || 'Incident not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">CRITICAL PRIORITY</span>;
      case 'high':
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">HIGH PRIORITY</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">MODERATE PRIORITY</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Map</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSamModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Meta SAM 3.1 Inspector</span>
          </button>

          <button
            onClick={() => setIsBriefModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-lg transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>ICS-201 Briefing</span>
          </button>

          <button
            onClick={onAddEvidence}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Attach New Evidence</span>
          </button>
        </div>
      </div>

      {/* Incident Header Dossier Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded border border-sky-800">
                {detail.disaster_type}
              </span>
              {getSeverityBadge(detail.severity)}
              <span className="text-xs text-slate-400 font-mono">
                ID: {detail.id}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white">{detail.title}</h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {detail.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="text-slate-200 font-medium">{detail.location_name}</span>
                <span>({detail.latitude.toFixed(4)}, {detail.longitude.toFixed(4)})</span>
              </span>

              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Incident Registered: {new Date(detail.created_at).toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Uncertainty Widget */}
          <div className="w-full sm:w-72">
            <UncertaintyIndicator
              uncertaintyScore={detail.overall_uncertainty}
              factors={[
                `${detail.evidence_items.length} heterogeneous evidence items analyzed`,
                `${detail.timeline_events.length} chronological milestones reconstructed`,
                'Observation times correlated against ground telemetry'
              ]}
              showDetails={true}
            />
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'timeline'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Reconstructed Timeline ({detail.timeline_events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'evidence'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Evidence Items ({detail.evidence_items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'ai'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>Meta Muse Spark Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('llama')}
          className={`flex items-center space-x-2 py-3 px-2 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'llama'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4 text-sky-400" />
          <span>Llama 3.3 Command Assistant</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/40 text-xs text-sky-200 flex items-start space-x-2">
            <Clock className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Chronological Truth Reconstruction:</strong> This timeline orders events strictly by their
              factual ground observation timestamp. Reports received out-of-order due to storm-induced cellular latency
              are automatically sequenced into their true historical progression.
            </p>
          </div>

          <TimelineView events={detail.timeline_events} />
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Preserves both ground observation timestamps and platform receipt timestamps for auditing.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSamModalOpen(true)}
                className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Meta SAM 3.1 Segmentation</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={onAddEvidence}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                + Add Evidence
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detail.evidence_items.map((ev) => (
              <EvidenceCard key={ev.id} evidence={ev} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <AIAnalysisPanel
          analyses={detail.ai_analyses}
          incidentId={detail.id}
          onRefresh={fetchDetail}
        />
      )}

      {activeTab === 'llama' && (
        <LlamaCommandAssistant currentIncident={detail} />
      )}

      {/* Meta SAM 3.1 Visual Segmentation Inspector Modal */}
      <SamSegmentationModal
        isOpen={isSamModalOpen}
        onClose={() => setIsSamModalOpen(false)}
        incidentTitle={detail.title}
        evidenceDescription={detail.description}
      />

      {/* ICS-201 Official Incident Briefing Modal */}
      <SituationBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        incident={detail}
      />
    </div>
  );
};
