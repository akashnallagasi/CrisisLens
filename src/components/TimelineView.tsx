import React from 'react';
import { TimelineEvent } from '../types';
import { Clock, Cpu, CheckCircle2, AlertOctagon, Droplets, AlertTriangle } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  // Format timestamps
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getEventIcon = (type: string, isAi: boolean) => {
    if (isAi) return <Cpu className="w-4 h-4 text-purple-400" />;
    if (type.includes('breach') || type.includes('water')) return <Droplets className="w-4 h-4 text-sky-400" />;
    if (type.includes('obstruction') || type.includes('tree')) return <AlertOctagon className="w-4 h-4 text-amber-400" />;
    return <Clock className="w-4 h-4 text-emerald-400" />;
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium">No timeline events recorded yet.</p>
        <p className="text-xs text-slate-500 mt-1">Submit field evidence with observation times to reconstruct progression.</p>
      </div>
    );
  }

  // Sort events strictly by factual event_time (ground observation time)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-sky-500 before:via-indigo-500 before:to-slate-700">
      {sortedEvents.map((evt, idx) => {
        const isAi = evt.is_ai_inferred;
        return (
          <div key={evt.id || idx} className="relative group">
            {/* Timeline Marker Dot */}
            <div
              className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                isAi
                  ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-slate-900 border-sky-500 text-sky-400 shadow-md shadow-sky-500/20'
              }`}
            >
              {getEventIcon(evt.event_type, isAi)}
            </div>

            {/* Event Content Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isAi
                  ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-700/60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header: Ground Observation Time vs Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800/50">
                    {formatDate(evt.event_time)} • {formatTime(evt.event_time)}
                  </span>
                  <span className="text-xs text-slate-400">
                    (Observed ground time)
                  </span>
                </div>

                {/* AI vs Ground Observation Tag */}
                {isAi ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/90 text-purple-300 border border-purple-700/60">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    <span>AI-Inferred Milestone</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Empirical Observation</span>
                  </span>
                )}
              </div>

              {/* Event Summary */}
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {evt.summary}
              </p>

              {/* Footer: Confidence and Recording Lag Metadata */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">
                  Type: <strong className="text-slate-300">{evt.event_type.replace(/_/g, ' ')}</strong>
                </span>
                <div className="flex items-center space-x-3">
                  <span>
                    Confidence: <strong className="text-emerald-400">{Math.round(evt.confidence_score * 100)}%</strong>
                  </span>
                  <span className="text-slate-500">
                    Recorded at: {formatTime(evt.recorded_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
