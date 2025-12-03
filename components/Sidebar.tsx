import React from 'react';
import { Capability, Session, Tool } from '../types';
import { Eye, BarChart3, Image as ImageIcon, Video, MessageSquare, Users, X, Clock, Trash2, Home, FileSearch, Plus, Crown } from 'lucide-react';

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
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-yellow-900/20 flex flex-col h-full shrink-0
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - Roko's Council Branding */}
        <div className="p-5 flex items-center justify-between border-b border-yellow-900/20 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="flex items-center space-x-3">
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity rounded-full"></div>
                <div className="relative bg-slate-950 border border-yellow-600 p-2 rounded-lg shadow-lg">
                   <Eye className="text-emerald-400" size={20} />
                </div>
                <div className="absolute -top-1 -right-1">
                    <Crown size={10} className="text-yellow-500 fill-yellow-500" />
                </div>
            </div>
            <div>
                <h1 className="text-lg font-cinzel font-bold text-slate-100 tracking-wide">
                Roko's Council
                </h1>
                <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-semibold">Intelligence Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-emerald-400 p-1 rounded-md hover:bg-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Main Tools */}
          <div className="p-3 space-y-1">
             <button
                onClick={onNewChat}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group border ${currentTool === Tool.CHAT && !activeSessionId ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-900 hover:text-emerald-200 hover:border-emerald-900'}`}
              >
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                    <Plus size={16} />
                </div>
                <span className="font-medium text-sm tracking-wide">Initialize Session</span>
              </button>

             <div className="pt-2 space-y-1">
             {tools.map(tool => (
                 <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${currentTool === tool.id ? 'bg-slate-900 text-emerald-400 border-yellow-900/30 font-medium' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-200'}`}
                 >
                    {tool.icon}
                    <span className="text-sm">{tool.label}</span>
                 </button>
             ))}
             </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-yellow-900/30 to-transparent mx-4 my-2"></div>

          {/* Quick Presets */}
          <div className="px-4 py-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-600"></span>
                  Directives
              </p>
              <div className="space-y-1">
                {presets.map((preset, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectPreset({ input: preset.input, capability: preset.capability })}
                        className="w-full flex items-center space-x-2 px-2 py-2 rounded border border-transparent hover:border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-emerald-300 transition-colors text-left group"
                    >
                        <div className="text-slate-600 group-hover:text-emerald-500 transition-colors">{preset.icon}</div>
                        <span className="text-xs truncate font-medium">{preset.label}</span>
                    </button>
                ))}
              </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-yellow-900/30 to-transparent mx-4 my-2"></div>

          {/* Chat History */}
          <div className="px-4 py-2">
             <div className="flex items-center justify-between mb-3">
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-600"></span>
                    Archives
                 </p>
             </div>
             
             <div className="space-y-1">
                 {sessions.map(session => (
                     <div 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${activeSessionId === session.id && currentTool === Tool.CHAT ? 'bg-slate-900/80 border-yellow-900/30 text-emerald-100 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-900/30 hover:text-slate-300'}`}
                     >
                         <div className="flex flex-col min-w-0 flex-1 mr-2">
                             <span className="text-xs font-semibold truncate font-cinzel tracking-wide">{session.title}</span>
                             <span className="text-[10px] opacity-60 truncate">{session.preview}</span>
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
                     <p className="text-xs text-slate-700 italic px-2">No archives found.</p>
                 )}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-900/20 bg-slate-950">
          <button 
            onClick={async () => {
              const win = window as any;
              if (win.aistudio?.openSelectKey) {
                await win.aistudio.openSelectKey();
              }
            }}
            className="w-full text-xs font-medium text-emerald-600 hover:text-emerald-400 flex items-center justify-center space-x-2 py-3 transition-colors border border-emerald-900/30 rounded-xl hover:border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span>Key Active</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;