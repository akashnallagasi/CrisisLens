import React from 'react';
import { Eye, Cpu, PlusCircle, Activity, Radio, Server, CheckCircle2, Wifi, Mic } from 'lucide-react';
import { getStoredBackendUrl } from '../services/api';

interface NavbarProps {
  currentTab: 'dashboard' | 'submit' | 'ai' | 'dispatch';
  setCurrentTab: (tab: 'dashboard' | 'submit' | 'ai' | 'dispatch') => void;
  activeCount: number;
  isAiLive: boolean;
  onOpenBackendSettings: () => void;
  onOpenVoiceAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeCount,
  isAiLive,
  onOpenBackendSettings,
  onOpenVoiceAssistant,
}) => {
  const customBackendUrl = getStoredBackendUrl();
  const isCustomBackend = Boolean(customBackendUrl);

  return (
    <header className="sticky top-0 z-50 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hackathon Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 p-[2px] flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-[#0b1120] rounded-[10px] flex items-center justify-center">
                <Eye className="w-5 h-5 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Crisis<span className="text-sky-400">Lens</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded-full">
                  Meta AI Hackathon 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Evidence-Aware Multimodal Disaster Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Items & Backend Switcher */}
          <div className="flex items-center space-x-2">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Operations Map</span>
                <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 text-xs rounded-full">
                  {activeCount}
                </span>
              </button>

              <button
                onClick={() => setCurrentTab('dispatch')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'dispatch'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Dispatch</span>
              </button>

              <button
                onClick={() => setCurrentTab('submit')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'submit'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Submit Evidence</span>
                <span className="sm:hidden">Submit</span>
              </button>

              <button
                onClick={() => setCurrentTab('ai')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentTab === 'ai'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">Meta Muse Spark</span>
                {isAiLive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" title="Connected to Meta Model API" />
                ) : (
                  <span className="px-1.5 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] rounded font-semibold" title="Full demonstration engine active (No API key required)">
                    Ready
                  </span>
                )}
              </button>
            </nav>

            {/* Voice AI Assistant Button */}
            <button
              onClick={onOpenVoiceAssistant}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
              title="Open Voice AI Assistant (Speaks any language)"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span className="hidden sm:inline">Voice AI</span>
            </button>

            {/* Backend Connection Pill Button */}
            <button
              onClick={onOpenBackendSettings}
              title="Click to configure Render.com backend URL or Embedded Engine"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/60 text-slate-300 text-xs font-medium transition-all group"
            >
              <Server className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline text-slate-400">Backend:</span>
              <span className={`font-semibold ${isCustomBackend ? 'text-sky-300' : 'text-emerald-300'}`}>
                {isCustomBackend ? 'Render.com' : 'Embedded Engine'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isCustomBackend ? 'bg-sky-400' : 'bg-emerald-400'} animate-pulse`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
