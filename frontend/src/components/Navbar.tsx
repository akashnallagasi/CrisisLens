import React from 'react';
import { Eye, Cpu, PlusCircle, Activity, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'submit' | 'ai' | 'dispatch';
  setCurrentTab: (tab: 'dashboard' | 'submit' | 'ai' | 'dispatch') => void;
  activeCount: number;
  isAiLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeCount,
  isAiLive,
}) => {
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

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Operations Map</span>
              <span className="ml-1.5 px-1.5 py-0.2 bg-slate-800 text-slate-300 text-xs rounded-full">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('dispatch')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
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
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'submit'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Submit Evidence</span>
            </button>

            <button
              onClick={() => setCurrentTab('ai')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'ai'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Meta Muse Spark</span>
              {isAiLive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" title="Connected to Meta Model API" />
              ) : (
                <span className="px-1.5 py-0.2 bg-amber-950/80 text-amber-400 border border-amber-800/50 text-[10px] rounded">
                  Demo
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
