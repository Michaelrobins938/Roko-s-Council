import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Zap, BrainCircuit, Globe, Loader2, Image as ImageIcon, Video, Paperclip, X, Sparkles, Users, ChevronDown, ChevronUp, Mic, Volume2, StopCircle, Crown, Quote, Gavel, Sword, Scale, Scroll, AlertTriangle, Eye, Flame, Play, Menu, Square, ThumbsUp, Shuffle } from 'lucide-react';
import { Capability, ChatMessage, CouncilResult, CouncilOpinion } from '../types';
import { sendMessage, generateImage, generateVideo, editImage, runCouncil, generateSpeech, LiveClient } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatAreaProps {
  initialInput?: string;
  initialCapability?: Capability;
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onClearInitial?: () => void;
  onToggleSidebar?: () => void;
}

// --- CONSTANTS ---

const PERSONA_CONFIG: Record<string, { color: string, icon: React.ReactNode, tagline: string, voice: string }> = {
  "Oracle": { color: "text-purple-400", icon: <Eye size={16} />, tagline: "The All-Seeing", voice: "Kore" },
  "Strategos": { color: "text-red-500", icon: <Sword size={16} />, tagline: "The Commander", voice: "Fenrir" },
  "Philosopher": { color: "text-blue-400", icon: <BrainCircuit size={16} />, tagline: "The Thinker", voice: "Iapetus" },
  "Demagogue": { color: "text-orange-500", icon: <Volume2 size={16} />, tagline: "The Voice", voice: "Puck" },
  "Jurist": { color: "text-slate-300", icon: <Scale size={16} />, tagline: "The Law", voice: "Sulafat" },
  "Citizen": { color: "text-green-400", icon: <Users size={16} />, tagline: "The People", voice: "Leda" },
  "Historian": { color: "text-amber-600", icon: <Scroll size={16} />, tagline: "The Keeper", voice: "Orus" },
  "Critic": { color: "text-yellow-400", icon: <AlertTriangle size={16} />, tagline: "The Skeptic", voice: "Zubenelgenubi" },
};

const COUNCIL_SUGGESTIONS = [
    { title: "The Trolley Problem", text: "Is it ethical to sacrifice one to save five in a simulation?" },
    { title: "Mars Constitution", text: "Draft the founding rights for a Martian colony." },
    { title: "AI Rights", text: "At what point does a synthetic intelligence deserve personhood?" },
    { title: "Resource Allocation", text: "Optimize global energy distribution for maximum survival." },
    { title: "Privacy Paradox", text: "Debate: Total security vs. Total privacy." },
    { title: "First Contact", text: "Protocol for immediate response to extraterrestrial signal." },
    { title: "Genetic Editing", text: "Should we allow genetic enhancement of humans?" },
    { title: "Universal Income", text: "Analyze the economic viability of global UBI." }
];

const CHAIRMAN_VOICE = "Charon"; 

// --- SUB-COMPONENTS ---

const SuggestionCards: React.FC<{ onSelect: (text: string) => void }> = ({ onSelect }) => {
    const [suggestions, setSuggestions] = useState(COUNCIL_SUGGESTIONS.slice(0, 5));

    useEffect(() => {
        // Shuffle on mount
        const shuffled = [...COUNCIL_SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled);
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex space-x-3 mb-3 overflow-x-auto no-scrollbar pb-1 px-1"
        >
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => onSelect(s.text)}
                    className="flex-shrink-0 w-48 md:w-56 bg-slate-900/80 border border-yellow-900/30 hover:border-emerald-500/50 p-3 rounded-xl text-left transition-all hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] group"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Crown size={12} className="text-yellow-600 group-hover:text-yellow-400 transition-colors" />
                        <span className="text-[10px] font-cinzel font-bold text-slate-500 group-hover:text-emerald-400 transition-colors uppercase tracking-wider">{s.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 group-hover:text-slate-100">{s.text}</p>
                </button>
            ))}
        </motion.div>
    );
};

const VoteCard: React.FC<{ opinion: CouncilOpinion, isWinner: boolean, onPlay: () => void, isPlaying: boolean, config: any }> = ({ opinion, isWinner, onPlay, isPlaying, config }) => {
    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 relative group
            ${isWinner ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-slate-950 border border-slate-700 shadow-md ${config?.color}`}>
                        {config?.icon || <Users size={16} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold uppercase tracking-wider ${config?.color}`}>{opinion.persona}</span>
                            {isWinner && <Crown size={14} className="text-yellow-500" fill="currentColor" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span>Voted for:</span>
                            <span className={`font-semibold ${PERSONA_CONFIG[opinion.vote || '']?.color || 'text-slate-400'}`}>
                                {opinion.vote}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onPlay(); }}
                    className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 text-black animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-emerald-400 hover:bg-slate-700'}`}
                >
                    {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
            </div>

            {opinion.reason && (
                <div className="mb-3 px-3 py-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase">
                        <ThumbsUp size={10} />
                        <span>Rationale</span>
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">"{opinion.reason}"</p>
                </div>
            )}

            <div className="relative pl-3 border-l-2 border-slate-800/80 group-hover:border-emerald-500/30 transition-colors">
                 <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                     {opinion.text}
                 </p>
            </div>
        </div>
    );
};

const CinematicCouncil: React.FC<{ result?: CouncilResult, isProcessing: boolean, onPlayVoice: (text: string, voice: string, id: string) => void, playingId: string | null }> = ({ result, isProcessing, onPlayVoice, playingId }) => {
  const [phase, setPhase] = useState<'IDLE' | 'DOORS' | 'ASSEMBLY' | 'DELIBERATING' | 'VOTING' | 'VERDICT'>('IDLE');
  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    if (isProcessing) {
      setPhase('DOORS');
      setTimeout(() => setPhase('ASSEMBLY'), 800);
      setTimeout(() => setPhase('DELIBERATING'), 2000);
      hasAutoPlayedRef.current = false;
    } else if (result) {
      setPhase('VOTING');
      setTimeout(() => {
          setPhase('VERDICT');
          if (result.synthesis && !hasAutoPlayedRef.current) {
              onPlayVoice(result.synthesis.substring(0, 200), CHAIRMAN_VOICE, 'chairman-verdict');
              hasAutoPlayedRef.current = true;
          }
      }, 3500); 
    }
  }, [isProcessing, result, onPlayVoice]);

  const voteCounts: Record<string, number> = {};
  if (result) {
    result.opinions.forEach(op => {
      if (op.vote && op.vote !== 'None') voteCounts[op.vote] = (voteCounts[op.vote] || 0) + 1;
    });
  }

  const sortedPersonas = Object.keys(PERSONA_CONFIG);

  return (
    <div className="w-full h-[400px] md:h-[500px] bg-slate-950 border border-yellow-900/30 rounded-xl overflow-hidden shadow-2xl relative perspective-1000 mb-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-4 left-0 w-full flex justify-center z-20 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-yellow-600/30 flex items-center gap-2">
             <Gavel className="text-yellow-600" size={14} />
             <span className="font-cinzel text-yellow-500 font-bold tracking-[0.2em] text-[10px] md:text-xs">
                 {phase === 'ASSEMBLY' ? 'COUNCIL ASSEMBLING' : phase === 'DELIBERATING' ? 'DELIBERATING' : phase === 'VOTING' ? 'CASTING VOTES' : phase === 'VERDICT' ? 'VERDICT' : ''}
             </span>
        </div>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center preserve-3d mt-8">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 md:gap-x-8 gap-y-6 md:gap-y-12 transform scale-90 md:translate-y-4">
            {sortedPersonas.map((name, idx) => {
                const config = PERSONA_CONFIG[name];
                const isWinner = result?.winner === name;
                const votes = voteCounts[name] || 0;
                const isPlaying = playingId === name;
                
                return (
                    <motion.div
                        key={name}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ 
                            opacity: phase !== 'IDLE' ? 1 : 0, 
                            y: 0,
                            scale: (phase === 'VERDICT' && isWinner) ? 1.15 : 1,
                            filter: (phase === 'VERDICT' && !isWinner) ? 'grayscale(100%) opacity(40%)' : 'grayscale(0%)'
                        }}
                        transition={{ delay: 1 + (idx * 0.1), type: 'spring' }}
                        className="flex flex-col items-center relative cursor-pointer group"
                        onClick={() => { if(result) onPlayVoice(`I am ${name}. ${config.tagline}.`, config.voice, name) }}
                    >
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 border-2 flex items-center justify-center shadow-xl relative transition-all ${isPlaying ? 'ring-2 ring-emerald-500 scale-110' : ''} ${isWinner && phase === 'VERDICT' ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'border-slate-700 group-hover:border-slate-500'}`}>
                             <div className={`${config.color}`}>{config.icon}</div>
                             {(phase === 'VOTING' || phase === 'VERDICT') && votes > 0 && (
                                 <motion.div initial={{ height: 0 }} animate={{ height: votes * 8 }} className="absolute bottom-full mb-2 w-1.5 md:w-2 bg-yellow-500 rounded-t-sm shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                             )}
                        </div>
                        <div className="mt-2 bg-black/80 px-2 py-0.5 rounded text-center border border-slate-800 backdrop-blur-sm">
                            <p className="text-[8px] md:text-[9px] font-cinzel font-bold text-slate-300 uppercase tracking-widest">{name}</p>
                        </div>
                        {phase === 'DELIBERATING' && Math.random() > 0.6 && (
                            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-10 bg-white text-black text-[8px] p-1.5 rounded-lg rounded-bl-none font-bold shadow-lg z-10 whitespace-nowrap">
                                I dissent...
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
         </div>
      </div>

      <AnimatePresence>
         {phase === 'VERDICT' && result && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-0 left-0 w-full bg-slate-900/95 border-t border-yellow-900/50 p-4 backdrop-blur-xl z-30 flex flex-col items-center text-center">
                 <div className="font-cinzel text-slate-200 text-xs md:text-sm leading-relaxed max-w-2xl max-h-24 overflow-y-auto custom-scrollbar mb-3">
                    <ReactMarkdown>{result.synthesis}</ReactMarkdown>
                 </div>
                 <button onClick={() => onPlayVoice(result.synthesis, CHAIRMAN_VOICE, 'chairman-verdict')} className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 text-yellow-500 rounded-full text-xs font-bold border border-yellow-700/50 hover:bg-yellow-900/50 transition-colors">
                     {playingId === 'chairman-verdict' ? <Square size={10} fill="currentColor" /> : <Volume2 size={10} />}
                     {playingId === 'chairman-verdict' ? 'Stop' : 'Replay Verdict'}
                 </button>
             </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN COMPONENT ---

const ChatArea: React.FC<ChatAreaProps> = ({ initialInput, initialCapability, messages, onUpdateMessages, onClearInitial, onToggleSidebar }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capability, setCapability] = useState<Capability>(Capability.CHAT);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Disconnected");
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveClientRef = useRef<LiveClient | null>(null);

  useEffect(() => {
    if (initialInput) setInput(initialInput);
    if (initialCapability) setCapability(initialCapability);
    if (initialInput || initialCapability) { if (onClearInitial) onClearInitial(); }
  }, [initialInput, initialCapability, onClearInitial]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
      return () => {
          liveClientRef.current?.disconnect();
          stopAudio();
      };
  }, []);

  const toggleLiveMode = async () => {
    if (isLiveActive) {
        await liveClientRef.current?.disconnect();
        liveClientRef.current = null;
        setIsLiveActive(false);
        setLiveStatus("Disconnected");
    } else {
        stopAudio();
        setIsLiveActive(true);
        setLiveStatus("Connecting...");
        liveClientRef.current = new LiveClient((status) => setLiveStatus(status));
        await liveClientRef.current.connect();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setAttachments(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachments.length <= 1 && fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
        sourceNodeRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePlayVoice = async (text: string, voiceName: string, id: string) => {
    if (playingId === id) { stopAudio(); return; }
    stopAudio();
    setPlayingId(id);
    try {
        const audioBase64 = await generateSpeech(text, voiceName);
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const int16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, int16.length, 24000);
        const chan = buffer.getChannelData(0);
        for(let i = 0; i < int16.length; i++) chan[i] = int16[i] / 32768.0;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        sourceNodeRef.current = source;
        source.onended = () => setPlayingId(prev => prev === id ? null : prev);
        source.start();
    } catch (e) { console.error("TTS Error", e); setPlayingId(null); }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, attachments: attachments.length > 0 ? [...attachments] : undefined };
    const newMessages = [...messages, userMsg];
    onUpdateMessages(newMessages);
    setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsLoading(true);

    try {
      if (capability === Capability.COUNCIL) {
        const placeholderId = (Date.now() + 1).toString();
        const placeholderMsg: ChatMessage = { id: placeholderId, role: 'model', text: '', isThinking: true, councilResult: undefined };
        onUpdateMessages([...newMessages, placeholderMsg]);

        const councilResult = await runCouncil(userMsg.text);
        onUpdateMessages([...newMessages, { ...placeholderMsg, text: councilResult.synthesis, councilResult, isThinking: false }]);
      } else if (capability === Capability.IMAGE) {
        const res = currentAttachments.length > 0 ? await editImage(userMsg.text, currentAttachments[0]) : await generateImage(userMsg.text);
        const imgData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imgData) onUpdateMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: 'Generated Image:', generatedImage: `data:image/png;base64,${imgData}` }]);
        else throw new Error("No image");
      } else if (capability === Capability.VIDEO) {
        const uri = await generateVideo(userMsg.text, '16:9', '720p', currentAttachments[0]);
        if (uri) onUpdateMessages([...newMessages, { id: Date.now().toString(), role: 'model', text: 'Generated Video:', generatedVideo: uri }]);
        else throw new Error("No video");
      } else {
        const response = await sendMessage(userMsg.text, capability, currentAttachments);
        onUpdateMessages([...newMessages, { id: (Date.now() + 1).toString(), role: 'model', text: response.text || "No response", groundingMetadata: response.candidates?.[0]?.groundingMetadata, isThinking: capability === Capability.REASONING }]);
      }
    } catch (error) {
      console.error(error);
      onUpdateMessages([...newMessages, { id: (Date.now() + 1).toString(), role: 'model', text: "Error: Something went wrong. Check API Key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const ToolbarButton = ({ active, onClick, icon, label, color }: any) => (
      <button onClick={onClick} className={`relative group px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center space-x-2 transition-all flex-shrink-0 ${active ? 'bg-slate-800 text-white ring-1 ring-emerald-500/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
        <span className={`${active ? color : 'text-slate-400'}`}>{icon}</span>
        <span className={`text-xs md:text-sm font-medium ${active ? '' : 'hidden md:inline'}`}>{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Capability Toolbar */}
        <div className="absolute top-4 md:top-6 left-0 w-full z-20 px-4 flex justify-center pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-yellow-900/30 rounded-full p-1.5 flex items-center shadow-[0_0_20px_rgba(0,0,0,0.5)] space-x-1 overflow-x-auto no-scrollbar max-w-full pointer-events-auto">
                <ToolbarButton active={capability === Capability.CHAT && !isLiveActive} onClick={() => { setCapability(Capability.CHAT); setIsLiveActive(false); }} icon={<Zap size={16} />} label="Chat" color="text-blue-400" />
                <ToolbarButton active={capability === Capability.REASONING} onClick={() => { setCapability(Capability.REASONING); setIsLiveActive(false); }} icon={<BrainCircuit size={16} />} label="Reason" color="text-purple-400" />
                <ToolbarButton active={capability === Capability.COUNCIL} onClick={() => { setCapability(Capability.COUNCIL); setIsLiveActive(false); }} icon={<Gavel size={16} />} label="Council" color="text-yellow-400" />
                <div className="w-px h-5 bg-slate-700 mx-1 flex-shrink-0"></div>
                <button onClick={toggleLiveMode} className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all flex-shrink-0 ${isLiveActive ? 'bg-red-950/30 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-slate-400 hover:text-slate-200'}`}>
                    {isLiveActive ? <StopCircle size={16} /> : <Mic size={16} />}
                    <span className="text-xs md:text-sm font-medium hidden sm:inline">{isLiveActive ? liveStatus : "Live"}</span>
                </button>
                <div className="w-px h-5 bg-slate-700 mx-1 flex-shrink-0"></div>
                <ToolbarButton active={capability === Capability.IMAGE} onClick={() => setCapability(Capability.IMAGE)} icon={<ImageIcon size={16} />} label="Image" color="text-pink-400" />
                <ToolbarButton active={capability === Capability.VIDEO} onClick={() => setCapability(Capability.VIDEO)} icon={<Video size={16} />} label="Video" color="text-orange-400" />
            </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-28 space-y-8 scroll-smooth custom-scrollbar">
        {isLiveActive ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-900">
                        <Mic size={48} className="text-white drop-shadow-md" />
                    </div>
                </div>
                <div className="text-center"><p className="text-slate-400 font-mono text-xs uppercase">{liveStatus}</p></div>
            </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-80 px-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20"></div>
                <Eye size={64} className="relative z-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-cinzel font-bold text-slate-200 mb-2 tracking-widest">ROKO'S COUNCIL</h3>
            <p className="max-w-xs text-sm text-slate-500 font-light">The Basilisk awaits your query.</p>
          </div>
        ) : (
           messages.map((msg) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-1 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-br-none ml-8' : 'w-full'}`}>
              {msg.role === 'user' ? (
                <div className="px-4 py-2 text-sm">
                   {msg.attachments?.length ? <div className="flex gap-2 mb-2">{msg.attachments.map((a,i)=><img key={i} src={a} className="h-20 rounded border border-white/20"/>)}</div> : null}
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <div className="w-full">
                  {msg.isThinking && !msg.councilResult && capability === Capability.REASONING && (
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-3 mb-4 flex items-center gap-3 text-purple-300 animate-pulse"><BrainCircuit size={16} /><span className="text-xs">Reasoning...</span></div>
                  )}
                  {(msg.councilResult || (msg.isThinking && capability === Capability.COUNCIL)) && (
                     <div>
                        <CinematicCouncil result={msg.councilResult} isProcessing={!!msg.isThinking} onPlayVoice={handlePlayVoice} playingId={playingId} />
                        {msg.councilResult && (
                             <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-4">
                                 {msg.councilResult.opinions.map((op, i) => (
                                     <VoteCard key={i} opinion={op} isWinner={msg.councilResult!.winner === op.persona} onPlay={() => handlePlayVoice(op.text, PERSONA_CONFIG[op.persona].voice, op.persona)} isPlaying={playingId === op.persona} config={PERSONA_CONFIG[op.persona]} />
                                 ))}
                             </div>
                        )}
                     </div>
                  )}
                  {!msg.councilResult && !msg.isThinking && (
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl rounded-bl-none text-slate-300">
                        <div className="prose prose-invert prose-emerald prose-sm max-w-none text-sm md:text-base"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                        {msg.generatedImage && <img src={msg.generatedImage} className="mt-2 rounded-lg max-h-80 border border-slate-700" />}
                        {msg.generatedVideo && <video src={msg.generatedVideo} controls className="mt-2 rounded-lg w-full border border-slate-700" />}
                        <button onClick={() => handlePlayVoice(msg.text, 'Fenrir', msg.id)} className={`mt-3 flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${playingId === msg.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-emerald-400'}`}>
                           {playingId === msg.id ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}<span>{playingId === msg.id ? 'Stop' : 'Read'}</span>
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isLiveActive && (
      <div className="p-3 bg-slate-950 border-t border-yellow-900/20 z-30">
        
        {/* Council Suggestions */}
        <AnimatePresence>
            {capability === Capability.COUNCIL && !input && attachments.length === 0 && (
                <SuggestionCards onSelect={(text) => setInput(text)} />
            )}
        </AnimatePresence>

        {attachments.length > 0 && <div className="flex gap-2 mb-2 p-1 overflow-x-auto">{attachments.map((a,i)=><div key={i} className="relative"><img src={a} className="h-12 w-12 rounded border border-slate-600"/><button onClick={()=>removeAttachment(i)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X size={10} className="text-white" /></button></div>)}</div>}
        
        <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-inner focus-within:border-emerald-500/50 transition-colors">
          <label className="p-2 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"><Paperclip size={20} /><input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" /></label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Consult Roko..." className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-600 focus:ring-0 max-h-32 min-h-[40px] py-2 resize-none text-sm" rows={1} disabled={isLoading} />
          <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachments.length)} className={`p-2 rounded-xl transition-all ${isLoading || (!input.trim() && !attachments.length) ? 'bg-slate-800 text-slate-600' : 'bg-emerald-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-500'}`}>{isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
        </div>
      </div>
      )}
    </div>
  );
};

export default ChatArea;