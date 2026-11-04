import React, { useState } from 'react';
import { Send, Bot, Sparkles, ShieldAlert, BookOpen, CheckCircle, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { Incident } from '../types';

interface LlamaCommandAssistantProps {
  currentIncident?: Incident | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sopCitation?: string;
  actionList?: string[];
}

const PRESET_QUERIES = [
  '🌊 Evaluate causeway transit safety & hydrodynamic lateral load',
  '🛡️ FEMA P-259 protocol for sandbag ring dikes during overtopping',
  '📋 Generate ICS-201 Incident Action Brief for City Mayor',
  '🚁 Calculate air evacuation staging zone parameters',
];

export const LlamaCommandAssistant: React.FC<LlamaCommandAssistantProps> = ({ currentIncident }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello Commander. I am the CrisisLens Tactical Command Assistant powered by Llama 3.3 70B and grounded in FEMA P-259 and NDMA standard operating procedures. How can I assist with tactical decisions for ${
        currentIncident ? `'${currentIncident.title}'` : 'active disaster operations'
      }?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sopCitation: 'NDMA SOP Section 4.2 / FEMA P-259 Guidance',
      actionList: [
        'Query floodwater flow dynamics & vehicle hazard thresholds',
        'Retrieve engineering protocols for levee & embankment defense',
        'Draft situational executive action briefing for leadership',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate Llama 3.3 70B reasoning
    setTimeout(() => {
      let replyText = '';
      let citation = '';
      let actions: string[] = [];

      const lower = query.toLowerCase();
      if (lower.includes('causeway') || lower.includes('transit') || lower.includes('lateral') || lower.includes('hydrodynamic')) {
        replyText =
          'HYDRODYNAMIC VELOCITY ALERT: Under FEMA P-259 Section 4.2, standing or flowing water exceeding 0.5m creates hazardous lateral hydrostatic forces. At water velocity > 1.5 m/s, friction between vehicle tires and roadbed degrades to near-zero. Cordon must remain completely closed to civilian traffic.';
        citation = 'FEMA P-259 (Sec 4.2): Hydrodynamic Flood Forces on Roadways';
        actions = [
          'Maintain hard barricades from Km 12 to 14 of causeway.',
          'Deploy high-clearance rescue boat units rather than vehicular extraction.',
          'Inviolable Rule: No all-clear declaration allowed without diver structural survey.',
        ];
      } else if (lower.includes('sandbag') || lower.includes('ring dike') || lower.includes('overtopping') || lower.includes('fema')) {
        replyText =
          'LEVEE OVERTOPPING PROTOCOL: Under FEMA P-259 Section 6.1, landward scour during overtopping induces backwards toe failure. Response crews must construct landward sandbag ring dikes around sand boils to equalize hydraulic head pressure.';
        citation = 'FEMA P-259 (Sec 6.1): Landward Containment & Levee Defense';
        actions = [
          'Never place heavy machinery directly on active saturated crest.',
          'Erect ring dikes 1.5m back from boils with minimum 2:1 slope.',
          'Evacuate residential structures within 500m downstream path.',
        ];
      } else if (lower.includes('ics') || lower.includes('mayor') || lower.includes('brief') || lower.includes('action')) {
        replyText =
          'EXECUTIVE SITUATION BRIEF (ICS-201 FORM): Sector 4 coastal estuary breach active. Water stage crest at +1.32m danger mark. Meta Muse Spark confirmed 45m masonry toe scour. NDRF 04 Battalion & SDRF mobilized. Evacuation radius set at 500m; 3 stranded vehicles being assisted.';
        citation = 'ICS-201 Standard Incident Briefing Form / NDMA SOP 3.4';
        actions = [
          'Brief Mayor on hard causeway closure & transit detours.',
          'Confirm deployment of 45 NDRF personnel with Gemini inflatable craft.',
          'Request district water pumps for Sector 4 drainage corridor.',
        ];
      } else {
        replyText = `Synthesized Tactical Assessment [Llama 3.3 70B]: Ground observations for ${
          currentIncident?.title || 'active hazard zone'
        } indicate priority focus must be placed on resident evacuation and physical hazard perimeter control. Emergency services should coordinate staging 400m northeast on high-ground terrain.`;
        citation = 'CrisisLens RAG Disaster Knowledge Repository';
        actions = [
          'Verify field responder trust signatures prior to resource dispatch.',
          'Coordinate with nearest hospital for casualty reception staging.',
          'Re-verify visual evidence with Meta SAM 3.1 segmentation.',
        ];
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sopCitation: citation,
        actionList: actions,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Llama 3.3 70B Disaster Command Assistant</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                FEMA/NDMA RAG Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Tactical decision support & standard operating procedures</p>
          </div>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-left truncate max-w-full"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3.5 space-y-2 ${
                m.sender === 'user'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-line">{m.text}</p>

              {m.sopCitation && (
                <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 text-[10px] text-sky-400 font-mono">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{m.sopCitation}</span>
                </div>
              )}

              {m.actionList && m.actionList.length > 0 && (
                <div className="space-y-1 pt-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Recommended Command Directives:
                  </span>
                  {m.actionList.map((action, i) => (
                    <div key={i} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-sky-400 italic p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Llama 3.3 synthesizing tactical emergency guidelines...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-slate-800 mt-2 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Llama 3.3: 'What is the evacuation protocol for flooded roadbeds?'"
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
