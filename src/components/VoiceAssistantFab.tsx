import React, { useState } from 'react';
import { Mic, Bot, Sparkles, Globe2 } from 'lucide-react';

interface VoiceAssistantFabProps {
  onClick: () => void;
  activeLanguage?: string;
}

export const VoiceAssistantFab: React.FC<VoiceAssistantFabProps> = ({
  onClick,
  activeLanguage = 'English',
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center group">
      {/* Tooltip Pill */}
      <div className="hidden sm:flex items-center space-x-1.5 mr-3 px-3 py-1.5 bg-slate-900/90 border border-sky-500/30 text-white rounded-full text-xs font-semibold shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        <span>Voice AI: Speak in any language</span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onClick}
        className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white shadow-2xl shadow-sky-500/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none"
        title="Open CrisisLens Voice Assistant"
      >
        <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 opacity-40 blur-sm group-hover:opacity-75 transition duration-300" />
        <div className="relative flex items-center justify-center">
          <Mic className="w-6 h-6 animate-pulse" />
        </div>

        {/* Global badge */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-sky-400 flex items-center justify-center text-[10px]">
          🌐
        </span>
      </button>
    </div>
  );
};
