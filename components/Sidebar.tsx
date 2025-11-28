import React from 'react';
import { Capability, Session, Tool } from '../types';
import { Eye, BarChart3, Image as ImageIcon, Video, MessageSquare, Users, X, Clock, Trash2, Home, FileSearch, Plus, Crown, ScrollText } from 'lucide-react';

interface SidebarProps {
  currentTool: Tool;
  onSelectTool: (tool: Tool) => void;
  onSelectPreset: (preset: { input: string, capability: Capability }) => void;
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentTool, onSelectTool, onSelectPreset, isOpen, onClose, 
    sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession 
}) => {
  
  const presets = [
    { label: 'Strategic Dominance', icon: <Users size={16} />, capability: Capability.COUNCIL, input: `Should we optimize for safety or speed in AI development? Debate.` },
    { label: 'Logic Core', icon: <BarChart3 size={16} />, capability: Capability.REASONING, input: `Analyze the following strategic opportunities...` },
  ];

  const tools = [
      { id: Tool.REAL_ESTATE, label: 'Estate Planning', icon: <Home size={18} /> },
      { id: Tool.IMAGE_STUDIO, label: 'Vision Studio', icon: <ImageIcon size={18} /> },
      { id: Tool.VIDEO_STUDIO, label: 'Simulation Gen', icon: <Video size={18} /> },
      { id: Tool.ANALYZER, label: 'Data Input', icon: <FileSearch size={18} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-yellow-900/20 flex flex-col h-full shrink-0
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Decorative Marble Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
        
        {/* Header - Roko's Council Branding */}
        <div className="relative p-6 border-b border-yellow-900/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
          <div className="flex items-center space-x-3">
            {/* Logo Mark */}
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <div className="relative bg-slate-950 border border-yellow-600/50 p-2.5 rounded-xl shadow-lg ring-1 ring-black/50">
                   <Eye className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={24} />
                </div>
                <div className="absolute -top-2 -right-2 transform rotate-12">
                    <Crown size={14} className="text-yellow-500 fill-yellow-500 drop-shadow-md" />
                </div>
            </div>
            
            {/* Logo Text */}
            <div className="flex flex-col">
                <h1 className="text-xl font-cinzel font-bold text-slate-100 tracking-wider">
                  ROKO'S <span className="text-emerald-500">COUNCIL</span>
                </h1>
                <div className="flex items-center gap-1.5">
                   <div className="h-px w-3 bg-yellow-700"></div>
                   <p className="text-[10px] text-yellow-600 uppercase tracking-[0.2em] font-bold">Basilisk Node</p>
                   <div className="h-px w-3 bg-yellow-700"></div>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden absolute top-4 right-4 text-slate-500 hover:text-emerald-400 p-2 rounded-lg hover:bg-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          
          {/* Main Actions */}
          <div className="p-4 space-y-2">
             <button
                onClick={onNewChat}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group border 
                ${currentTool === Tool.CHAT && !activeSessionId 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-900 hover:text-emerald-200 hover:border-emerald-900'}`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${currentTool === Tool.CHAT && !activeSessionId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 group-hover:bg-emerald-500 group-hover:text-black'}`}>
                    <Plus size={18} />
                </div>
                <span className="font-semibold text-sm tracking-wide">New Session</span>
              </button>

             <div className="grid grid-cols-2 gap-2 pt-2">
             {tools.map(tool => (
                 <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`flex flex-col items-center justify-center space-y-2 p-3 rounded-xl transition-all duration-200 border 
                    ${currentTool === tool.id 
                        ? 'bg-slate-900 border-yellow-700/40 text-emerald-400 shadow-inner' 
                        : 'border-transparent bg-slate-900/20 text-slate-500 hover:bg-slate-900 hover:text-slate-300 hover:border-slate-800'}`}
                 >
                    {tool.icon}
                    <span className="text-[10px] font-medium uppercase tracking-wider">{tool.label}</span>
                 </button>
             ))}
             </div>
          </div>

          <div className="flex items-center justify-center my-2 opacity-30">
             <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-600 to-transparent"></div>
             <div className="mx-2 text-yellow-600"><Crown size={10} /></div>
             <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-600 to-transparent"></div>
          </div>

          {/* Quick Presets */}
          <div className="px-4 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2 px-1">
                  Directives
              </p>
              <div className="space-y-1">
                {presets.map((preset, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectPreset({ input: preset.input, capability: preset.capability })}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-slate-800 hover:bg-slate-900/50 text-slate-400 hover:text-emerald-300 transition-colors text-left group"
                    >
                        <div className="text-slate-600 group-hover:text-emerald-500 transition-colors">{preset.icon}</div>
                        <span className="text-xs font-medium">{preset.label}</span>
                    </button>
                ))}
              </div>
          </div>

          {/* Chat History */}
          <div className="px-4 py-4">
             <div className="flex items-center justify-between mb-3 px-1">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                    Archives
                 </p>
             </div>
             
             <div className="space-y-1.5">
                 {sessions.map(session => (
                     <div 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all border 
                        ${activeSessionId === session.id && currentTool === Tool.CHAT 
                            ? 'bg-gradient-to-r from-slate-900 to-slate-900/50 border-yellow-900/30 text-emerald-100 shadow-sm border-l-2 border-l-emerald-500' 
                            : 'border-transparent text-slate-500 hover:bg-slate-900/30 hover:text-slate-300 border-l-2 border-l-transparent'}`}
                     >
                         <div className="flex items-center gap-3 overflow-hidden">
                             <ScrollText size={14} className={activeSessionId === session.id ? 'text-emerald-500' : 'text-slate-700'} />
                             <div className="flex flex-col min-w-0">
                                 <span className="text-xs font-bold truncate font-cinzel tracking-wide">{session.title}</span>
                                 <span className="text-[10px] opacity-60 truncate font-mono">{new Date(session.lastModified).toLocaleDateString()}</span>
                             </div>
                         </div>
                         <button 
                            onClick={(e) => onDeleteSession(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition-all"
                         >
                             <Trash2 size={12} />
                         </button>
                     </div>
                 ))}
                 {sessions.length === 0 && (
                     <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                        <Clock size={24} className="mx-auto text-slate-700 mb-2" />
                        <p className="text-xs text-slate-600 italic">No archives found.</p>
                     </div>
                 )}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-900/20 bg-slate-950 relative z-20">
          <button 
            onClick={async () => {
              const win = window as any;
              if (win.aistudio?.openSelectKey) {
                await win.aistudio.openSelectKey();
              }
            }}
            className="w-full group relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 transition-all hover:border-emerald-500/30"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
                <div className="relative">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                    API Key Active
                </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;