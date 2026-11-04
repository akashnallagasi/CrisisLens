import React, { useEffect, useState } from 'react';
import { Incident, AIStatusInfo } from '../types';
import { api } from '../services/api';
import { Cpu, ShieldCheck, AlertTriangle, CheckCircle, Info, ExternalLink, Terminal, ShieldAlert } from 'lucide-react';

interface AIIntelligenceProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
}

export const AIIntelligence: React.FC<AIIntelligenceProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [aiStatus, setAiStatus] = useState<AIStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAIStatus()
      .then(setAiStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Meta Muse Spark Intelligence Core</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multimodal reasoning and evidence-aware synthesis engine for disaster response.
            </p>
          </div>
        </div>
      </div>

      {/* Model & Connectivity Status Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Meta Model API Status</span>
              {aiStatus?.live_api_connected ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Production Endpoint</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Demonstration Engine Active</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparent reporting: Never pretends that unconfigured live APIs are connected.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-500 block">Configured Model Identifier</span>
            <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-800">
              {aiStatus?.primary_model || 'meta-muse-spark-preview'}
            </span>
          </div>
        </div>

        {/* Technical Architecture Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Reasoning</p>
            <p className="text-sm font-bold text-white mt-1">Meta Muse Spark</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multimodal cross-temporal synthesis, anomaly detection, evidence triangulation.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Segmentation Hook</p>
            <p className="text-sm font-bold text-white mt-1">Meta SAM 3.1</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Segment Anything Model for automated water inundation and obstacle contouring.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secret Storage</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">Isolated Backend Env</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Zero API key exposure to client code; strict backend validation.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Policy & Human-in-the-Loop Protocol */}
      <div className="bg-slate-900/90 border border-amber-900/40 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-amber-300 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Disaster AI Safety Invariants & Guardrails</span>
        </h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          In disaster intelligence systems, AI models must operate strictly as advisory tools to assist human
          coordinators, never as autonomous emergency authorities. CrisisLens enforces these inviolable rules:
        </p>

        <div className="space-y-2">
          {aiStatus?.safety_guardrails.map((rule, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{rule}</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs text-amber-200/90 font-mono">
          {aiStatus?.disclaimer}
        </div>
      </div>

      {/* Quick Launchpad to Analyze Active Scenarios */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Active Scenarios Available for AI Synthesis</h3>
        <p className="text-xs text-slate-400">
          Select an incident below to view its multi-source timeline and execute Meta Muse Spark assessment:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc.id)}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-purple-500/70 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-400">
                  {inc.disaster_type} • {inc.severity}
                </span>
                <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {inc.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inc.evidence_count} evidence reports • {(inc.overall_uncertainty * 100).toFixed(0)}% uncertainty
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
