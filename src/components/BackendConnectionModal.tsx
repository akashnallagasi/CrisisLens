import React, { useState, useEffect } from 'react';
import { Server, Globe, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck, ExternalLink, Zap } from 'lucide-react';
import { api, getStoredBackendUrl, setStoredBackendUrl, isValidBackendUrl } from '../services/api';

interface BackendConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

export const BackendConnectionModal: React.FC<BackendConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
}) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getStoredBackendUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const testTarget = url.trim() || window.location.origin;
      const res = await api.testBackendConnection(testTarget);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setTestResult({
          success: true,
          message: `Connected successfully! Response time: ${latency}ms`,
          latencyMs: latency,
          details: res.data,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Server responded with an error or invalid format.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Check if the URL is correct and CORS is enabled.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = url.trim();
    if (trimmed && !isValidBackendUrl(trimmed)) {
      setTestResult({
        success: false,
        message: 'Invalid URL format. Please enter a valid HTTP/HTTPS URL (e.g., https://your-backend.onrender.com) or click "Use Embedded Engine".',
      });
      return;
    }
    setStoredBackendUrl(trimmed);
    onConnectionChanged();
    onClose();
  };

  const handleResetToEmbedded = () => {
    setUrl('');
    setStoredBackendUrl('');
    setTestResult({
      success: true,
      message: 'Switched to Embedded Full-Stack Disaster Intelligence Engine.',
    });
    onConnectionChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Backend Connection Settings</h2>
            <p className="text-xs text-slate-400">Connect to your Render.com deployed backend or local engine</p>
          </div>
        </div>

        {/* Current target input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Backend API Base URL (Render / Cloud / Local)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://crisislens.onrender.com (leave blank for embedded API)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-sky-400' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Leave blank to use the high-performance embedded full-stack engine running in this container.
          </p>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.details && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Service: {testResult.details.service || testResult.details.name || 'OK'} • Version: {testResult.details.version || '1.0.0'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Render.com Tips */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-sky-400">
            <Zap className="w-4 h-4" />
            <span>Render.com & Vercel Deployment Tips</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            <li>
              <strong>Render Free Tier Sleep:</strong> If your Render web service is asleep, the first request takes ~30-50s to spin up. CrisisLens includes automatic retries.
            </li>
            <li>
              <strong>CORS Configuration:</strong> Ensure your Render FastAPI has <code className="text-slate-200">allow_origins=["*"]</code> or includes your Vercel URL.
            </li>
            <li>
              <strong>Embedded Fallback:</strong> If Render is waking up, you can switch back to the Embedded engine at any time with 0 downtime.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetToEmbedded}
            className="text-xs text-slate-400 hover:text-sky-400 underline"
          >
            Reset to Embedded Engine
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
            >
              Apply & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
