import React from 'react';
import { EvidenceItem } from '../types';
import { UncertaintyIndicator } from './UncertaintyIndicator';
import { Camera, Radio, FileText, CheckCircle, ShieldAlert, Clock, AlertTriangle, Eye } from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceItem;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Calculate submission delay in minutes
  const obsTime = new Date(evidence.observed_at).getTime();
  const subTime = new Date(evidence.submitted_at).getTime();
  const delayMinutes = Math.max(0, Math.round((subTime - obsTime) / 60000));

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'citizen_report': return <Camera className="w-4 h-4 text-amber-400" />;
      case 'field_sensor': return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'first_responder': return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      default: return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified_by_official':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Official Verified</span>
          </span>
        );
      case 'corroborated':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-800">
            <CheckCircle className="w-3 h-3 text-sky-400" />
            <span>Cross-Corroborated</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Pending Corroboration</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Evidence Image or Sensor Banner */}
      {evidence.media_type === 'image' && evidence.file_path && (
        <div className="relative h-48 bg-slate-950 overflow-hidden group">
          <img
            src={`/api/incidents/evidence/${evidence.id}/file`}
            alt={evidence.raw_description}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback placeholder if image not on disk
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute top-2 right-2">
            {getVerificationBadge(evidence.verification_status)}
          </div>
          <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700 font-mono">
            Ground Capture • {formatDateTime(evidence.observed_at)}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Source and Verification row if no image banner */}
        {(!evidence.file_path || evidence.media_type !== 'image') && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
              {getSourceIcon(evidence.source_type)}
              <span className="capitalize">{evidence.source_type.replace(/_/g, ' ')}</span>
            </div>
            {getVerificationBadge(evidence.verification_status)}
          </div>
        )}

        {/* Observation text */}
        <p className="text-sm text-slate-200 mb-3 line-clamp-3">
          "{evidence.raw_description}"
        </p>

        {/* CRITICAL TIMESTAMP COMPARISON: Observation vs Submission */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Ground Observation:</span>
            </span>
            <span className="font-mono font-medium text-sky-300">
              {formatDateTime(evidence.observed_at)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Platform Received:</span>
            </span>
            <span className="font-mono text-slate-400">
              {formatDateTime(evidence.submitted_at)}
            </span>
          </div>

          {delayMinutes > 15 && (
            <div className="text-[11px] text-amber-400/90 font-medium pt-1 border-t border-slate-800/60 flex items-center justify-between">
              <span>Delayed Transmission Lag:</span>
              <span className="bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.2 rounded font-mono">
                +{delayMinutes} mins delay
              </span>
            </div>
          )}
        </div>

        {/* Uncertainty Indicator Component */}
        <UncertaintyIndicator
          uncertaintyScore={evidence.uncertainty_score}
          factors={evidence.uncertainty_factors}
          size="sm"
        />
      </div>
    </div>
  );
};
