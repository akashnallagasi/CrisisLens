import React, { useState } from 'react';
import { AIAnalysis, DisasterProtocol } from '../types';
import {
  Cpu,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  BookOpen,
  FileCheck2,
  ExternalLink,
  Flame,
  Droplets,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

interface AIAnalysisPanelProps {
  analyses: AIAnalysis[];
  incidentId: string;
  onRefresh: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  analyses,
  incidentId,
  onRefresh,
}) => {
  const [running, setRunning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'synthesis' | 'rag'>('synthesis');

  const latest = analyses && analyses.length > 0 ? analyses[0] : null;

  const handleRunAnalysis = async () => {
    try {
      setRunning(true);
      setError(null);
      await api.runAIAnalysis(incidentId);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger Meta Muse Spark analysis');
    } finally {
      setRunning(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!latest) return;
    try {
      setVerifying(true);
      const newStatus = !latest.human_verified;
      await api.verifyAnalysis(
        incidentId,
        latest.id,
        newStatus,
        newStatus ? 'Ground-truth verified on-site by Incident Command Officer' : ''
      );
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update verification status');
    } finally {
      setVerifying(false);
    }
  };

  // Confidence percentage
  const confidencePct = latest ? Math.round(latest.confidence_score * 100) : 0;

  return (
    <div className="bg-slate-900/95 border border-purple-900/30 rounded-xl p-5 shadow-2xl space-y-5">
      {/* Top Banner: Model ID, Connection Status & Re-Run Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600/20 to-sky-500/20 border border-purple-500/30 text-purple-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">Meta Muse Spark Multimodal Synthesis</h3>
              {latest?.is_simulated ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                  Demonstration Engine
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Live Meta Model API
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Evidence triangulation, visual damage extraction & RAG response protocol matching
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={running}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/20 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Synthesizing Multimodal Model...' : 'Re-Run Meta Muse Spark'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MANDATORY SAFETY INVARIANT BADGE & RESTRICTION NOTICE */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center space-x-2">
            {latest?.human_verified ? (
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm shadow-emerald-900/50">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Verified by Designated First Responder</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 shadow-sm shadow-amber-900/50">
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>AI Assessment - Pending Responder Verification</span>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleVerification}
            disabled={verifying || !latest}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              latest?.human_verified
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>
              {latest?.human_verified ? 'Revoke Verification' : 'Verify as Field Responder'}
            </span>
          </button>
        </div>

        {/* Explicit Safety Invariant Notice */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p>
            <strong>SAFETY INVARIANT ENFORCEMENT:</strong> CrisisLens AI synthesis provides situational assessment support only.
            In accordance with disaster safety governance, the AI model is strictly <strong>restricted from declaring roadways or structures 100% safe</strong> without
            physical on-site verification by authorized emergency personnel.
          </p>
        </div>
      </div>

      {!latest ? (
        <div className="text-center py-8 text-slate-400">
          <Cpu className="w-10 h-10 text-purple-400/50 mx-auto mb-2" />
          <p className="text-sm font-semibold">No AI analysis generated yet for this incident.</p>
          <p className="text-xs text-slate-500 mt-1">Click below to synthesize all attached images, sensor data, and ground reports.</p>
          <button
            onClick={handleRunAnalysis}
            className="mt-4 px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg shadow-purple-600/20"
          >
            Execute Meta Muse Spark Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sub-Tabs: Multimodal Synthesis vs Evidence RAG Knowledge Base */}
          <div className="flex border-b border-slate-800 space-x-3">
            <button
              onClick={() => setActiveSubTab('synthesis')}
              className={`flex items-center space-x-1.5 pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeSubTab === 'synthesis'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Multimodal Analysis & Damage Extraction</span>
            </button>

            <button
              onClick={() => setActiveSubTab('rag')}
              className={`flex items-center space-x-1.5 pb-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeSubTab === 'rag'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Official Protocols (FEMA / NDMA RAG)</span>
              {latest.rag_guidelines && latest.rag_guidelines.length > 0 && (
                <span className="px-1.5 py-0.2 bg-sky-950 text-sky-300 border border-sky-800 text-[10px] rounded-full">
                  {latest.rag_guidelines.length}
                </span>
              )}
            </button>
          </div>

          {activeSubTab === 'synthesis' ? (
            <div className="space-y-4">
              {/* Feature a): Primary Hazard & Damage Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span className="font-semibold uppercase tracking-wider">Primary Hazard Classification</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {latest.primary_hazard || 'Hydrological Surge & Embankment Breach'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold uppercase tracking-wider">Damage & Failure Mode</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {latest.damage_type || 'Embankment Overwash & Arterial Scour'}
                  </p>
                </div>
              </div>

              {/* Feature b): Visible Structural / Flood Evidence extracted from images */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Visible Structural & Flood Evidence (Multimodal Vision)</span>
                </h4>
                {latest.detected_features && latest.detected_features.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {latest.detected_features.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No structural anomalies detected from current media.</p>
                )}
              </div>

              {/* Multimodal Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Cross-Temporal Situational Synthesis
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {latest.multimodal_summary}
                </div>
              </div>

              {/* Hazard Assessment Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Ground Hazard Assessment
                </h4>
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 leading-relaxed font-sans">
                  {latest.hazard_assessment}
                </div>
              </div>

              {/* Feature c): AI Uncertainty & Confidence Rating */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">AI Confidence & Uncertainty Rating</span>
                  <span className="font-mono font-bold text-purple-400">{confidencePct}% Model Confidence</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {latest.uncertainty_evaluation}
                </p>
              </div>
            </div>
          ) : (
            /* Evidence-Aware RAG Tab: FEMA / NDMA Standard Disaster Guidelines */
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 flex items-start space-x-2">
                <FileCheck2 className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Evidence-Aware Knowledge Base:</strong> The system automatically retrieves verified protocols
                  from <strong>FEMA</strong> and <strong>NDMA</strong> official manuals matched to the specific hazard type,
                  providing actionable guidance with source citations.
                </p>
              </div>

              {latest.rag_guidelines && latest.rag_guidelines.length > 0 ? (
                <div className="space-y-3">
                  {latest.rag_guidelines.map((proto, idx) => (
                    <div
                      key={proto.id || idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
                    >
                      {/* Agency & Citation Title */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                            {proto.agency}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {proto.section}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          {proto.safety_level}
                        </span>
                      </div>

                      {/* Official Guidance */}
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {proto.guidance}
                      </p>

                      {/* Immediate Responder Action */}
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="text-[11px] text-emerald-200">
                          <strong className="text-emerald-300">Mandated Responder Action: </strong>
                          {proto.responder_action}
                        </div>
                      </div>

                      {/* Exact Citation Reference */}
                      <div className="text-[10px] font-mono text-slate-500 pt-1 flex items-center justify-between">
                        <span>Source: {proto.source_document}</span>
                        <span className="text-sky-400 font-semibold">Matched Score: {proto.relevance_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs">No matching protocols indexed for this specific incident.</p>
                </div>
              )}
            </div>
          )}

          {latest.human_notes && (
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Responder Log: </span>
              {latest.human_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
