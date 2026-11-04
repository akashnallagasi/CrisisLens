import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react';

interface UncertaintyIndicatorProps {
  uncertaintyScore: number; // 0.0 (high confidence) to 1.0 (high uncertainty)
  factors?: string[] | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const UncertaintyIndicator: React.FC<UncertaintyIndicatorProps> = ({
  uncertaintyScore,
  factors = [],
  size = 'md',
  showDetails = false,
}) => {
  // Confidence is inverse of uncertainty
  const confidencePct = Math.round((1 - uncertaintyScore) * 100);
  
  let tierColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let barColor = 'bg-emerald-500';
  let tierLabel = 'High Confidence';
  let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;

  if (uncertaintyScore > 0.6) {
    tierColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    barColor = 'bg-rose-500';
    tierLabel = 'High Uncertainty';
    icon = <ShieldAlert className="w-4 h-4 text-rose-400" />;
  } else if (uncertaintyScore > 0.3) {
    tierColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    barColor = 'bg-amber-500';
    tierLabel = 'Moderate Uncertainty';
    icon = <AlertCircle className="w-4 h-4 text-amber-400" />;
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${tierColor}`}>
        {icon}
        <span>{confidencePct}% Ground Confidence</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-semibold text-slate-200">Evidence Certainty Score</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${tierColor}`}>
          {tierLabel} ({confidencePct}%)
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-slate-500 mb-2">
        <span>0% High Speculation</span>
        <span>Uncertainty Score: {(uncertaintyScore * 100).toFixed(0)}%</span>
        <span>100% Fully Corroborated</span>
      </div>

      {showDetails && factors && factors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center space-x-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Uncertainty Drivers & Evidence Context:</span>
          </p>
          <ul className="space-y-1">
            {factors.map((factor, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start space-x-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
