import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, BrainCircuit, Loader2, Image as ImageIcon, Video, Paperclip, X, Sparkles, Users, Mic, Volume2, StopCircle, Crown, Gavel, Sword, Scale, Scroll, AlertTriangle, Eye, Play, Square, ThumbsUp, Shuffle, User } from 'lucide-react';
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

// --- CONFIGURATION ---

const PERSONA_CONFIG: Record<string, { color: string, icon: React.ReactNode, tagline: string, voice: string }> = {
  "Oracle": { color: "text-purple-400 border-purple-500/50", icon: <Eye size={18} />, tagline: "The All-Seeing", voice: "Kore" },
  "Strategos": { color: "text-red-500 border-red-500/50", icon: <Sword size={18} />, tagline: "The Commander", voice: "Fenrir" },
  "Philosopher": { color: "text-blue-400 border-blue-500/50", icon: <BrainCircuit size={18} />, tagline: "The Thinker", voice: "Iapetus" },
  "Demagogue": { color: "text-orange-500 border-orange-500/50", icon: <Volume2 size={18} />, tagline: "The Voice", voice: "Puck" },
  "Jurist": { color: "text-slate-300 border-slate-400/50", icon: <Scale size={18} />, tagline: "The Law", voice: "Sulafat" },
  "Citizen": { color: "text-emerald-400 border-emerald-500/50", icon: <Users size={18} />, tagline: "The People", voice: "Leda" },
  "Historian": { color: "text-amber-600 border-amber-600/50", icon: <Scroll size={18} />, tagline: "The Keeper", voice: "Orus" },
  "Critic": { color: "text-yellow-400 border-yellow-500/50", icon: <AlertTriangle size={18} />, tagline: "The Skeptic", voice: "Zubenelgenubi" },
};

const COUNCIL_SUGGESTIONS = [
    { title: "The Trolley Problem", text: "Is it ethical to sacrifice one to save five in a simulation?" },
    { title: "Mars Constitution", text: "Draft the founding rights for a Martian colony." },
    { title: "AI Personhood", text: "At what point does a synthetic intelligence deserve personhood?" },
    { title: "Resource Algorithm", text: "Optimize global energy distribution for maximum survival." },
    { title: "Privacy Paradox", text: "Debate: Total security vs. Total privacy." },
    { title: "First Contact", text: "Protocol for immediate response to extraterrestrial signal." },
    { title: "Genetic Enhancement", text: "Should we allow genetic editing of humans?" },
    { title: "Universal Income", text: "Analyze the economic viability of global UBI." }
];

const CHAIRMAN_VOICE = "Charon"; 

// --- SUB-COMPONENTS ---

const SuggestionCards: React.FC<{ onSelect: (text: string) => void }> = ({ onSelect }) => {
    const [suggestions, setSuggestions] = useState(COUNCIL_SUGGESTIONS.slice(0, 5));

    const shuffle = () => {
        const shuffled = [...COUNCIL_SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 5));
    };

    useEffect(() => { shuffle(); }, []);

    return (
        <div className="mb-4 animate-fadeIn">
            <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={10} className="text-yellow-600" />
                    Council Decrees
                </span>
                <button onClick={shuffle} className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-slate-900">
                    <Shuffle size={12} />
                </button>
            </div>
            <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 px-1">
                {suggestions.map((s, i) => (
                    <motion.button 
                        key={`${i}-${s.title}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSelect(s.text)}
                        className="flex-shrink-0 w-56 bg-slate-900/90 border border-yellow-900/30 hover:border-emerald-500/50 p-3 rounded-xl text-left transition-all hover:bg-slate-900 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:via-emerald-500/10 transition-all duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Crown size={12} className="text-yellow-700 group-hover:text-yellow-500 transition-colors" />
                                <span className="text-[10px] font-cinzel font-bold text-slate-400 group-hover:text-emerald-400 transition-colors uppercase tracking-wider">{s.title}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-200">{s.text}</p>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

const VoteCard: React.FC<{ opinion: CouncilOpinion, isWinner: boolean, onPlay: () => void, isPlaying: boolean, config: any }> = ({ opinion, isWinner, onPlay, isPlaying, config }) => {
    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 relative group
            ${isWinner ? 'bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-slate-950 border shadow-md ${config?.color || 'border-slate-700 text-slate-400'}`}>
                        {config?.icon || <Users size={16} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold uppercase tracking-wider ${config?.color?.split(' ')[0]}`}>{opinion.persona}</span>
                            {isWinner && <Crown size={14} className="text-yellow-500" fill="currentColor" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span>Vote:</span>
                            <span className={`font-semibold ${PERSONA_CONFIG[opinion.vote || '']?.color?.split(' ')[0] || 'text-slate-400'}`}>
                                {opinion.vote}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onPlay(); }}
                    className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 text-black animate-pulse' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30'}`}
                >
                    {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
            </div>

            {opinion.reason && (
                <div className="mb-3 px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase">
                        <ThumbsUp size={10} />
                        <span>Rationale</span>
                    </div>
                    <p className="text-xs text-slate-400 italic leading-relaxed">"{opinion.reason}"</p>
                </div>
            )}

            <div className="relative pl-3 border-l-2 border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                 <p className="text-xs text-slate-300 leading-relaxed line-clamp-6 group-hover:line-clamp-none transition-all">
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
      setTimeout(() => setPhase('ASSEMBLY'), 1000);
      setTimeout(() => setPhase('DELIBERATING'), 2500);
      hasAutoPlayedRef.current = false;
    } else if (result) {
      setPhase('VOTING');
      setTimeout(() => {
          setPhase('VERDICT');
          if (result.synthesis && !hasAutoPlayedRef.current) {
              onPlayVoice(result.synthesis.substring(0, 200), CHAIRMAN_VOICE, 'chairman-verdict');
              hasAutoPlayedRef.current = true;
          }
      }, 4000); 
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
    <div className="w-full h-[450px] md:h-[550px] bg-slate-950 border border-yellow-900/30 rounded-xl overflow-hidden shadow-2xl relative perspective-1000 mb-6 group select-none">
      {/* Background - Marble Pillars */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none"></div>
      <div className="absolute inset-0 flex justify-between px-8 md:px-20 opacity-20 pointer-events-none">
          <div className="w-8 md:w-16 h-full bg-gradient-to-r from-black via-slate-800 to-black border-x border-slate-700"></div>
          <div className="w-8 md:w-16 h-full bg-gradient-to-r from-black via-slate-800 to-black border-x border-slate-700"></div>
      </div>
      
      {/* Header Status */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-6 left-0 w-full flex justify-center z-20 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full border border-yellow-600/30 flex items-center gap-3 shadow-2xl">
             <Gavel className={phase === 'VERDICT' ? "text-emerald-500 animate-pulse" : "text-yellow-600"} size={16} />
             <span className="font-cinzel text-yellow-500 font-bold tracking-[0.25em] text-[10px] md:text-xs">
                 {phase === 'ASSEMBLY' ? 'COUNCIL ASSEMBLING' : phase === 'DELIBERATING' ? 'DELIBERATION IN SESSION' : phase === 'VOTING' ? 'CASTING VOTES' : phase === 'VERDICT' ? 'VERDICT RENDERED' : 'AWAITING SUMMONS'}
             </span>
        </div>
      </motion.div>

      {/* Assembly Grid */}
      <div className="absolute inset-0 flex items-center justify-center preserve-3d mt-10 md:mt-16">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-12 md:gap-y-12 transform scale-90 md:translate-y-4 w-full max-w-4xl px-4">
            {sortedPersonas.map((name, idx) => {
                const config = PERSONA_CONFIG[name];
                const isWinner = result?.winner === name;
                const votes = voteCounts[name] || 0;
                const isPlaying = playingId === name;
                
                return (
                    <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ 
                            opacity: phase !== 'IDLE' ? 1 : 0, 
                            y: 0,
                            scale: (phase === 'VERDICT' && isWinner) ? 1.2 : 1,
                            filter: (phase === 'VERDICT' && !isWinner) ? 'grayscale(100%) opacity(30%)' : 'grayscale(0%)'
                        }}
                        transition={{ delay: 0.5 + (idx * 0.1), type: 'spring', bounce: 0.4 }}
                        className="flex flex-col items-center relative cursor-pointer group/persona"
                        onClick={() => { if(result) onPlayVoice(`I am ${name}. ${config.tagline}.`, config.voice, name) }}
                    >
                        {/* Bust */}
                        <div className={`
                            w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-900 border-2 flex items-center justify-center shadow-2xl relative transition-all duration-500
                            ${isPlaying ? 'ring-2 ring-emerald-500 scale-110 shadow-emerald-500/20' : ''} 
                            ${isWinner && phase === 'VERDICT' ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.6)]' : 'border-slate-800 group-hover/persona:border-slate-600'}
                        `}>
                             <div className={`${config.color.split(' ')[0]} transition-transform duration-300 group-hover/persona:scale-110`}>
                                {config.icon}
                             </div>

                             {/* Vote Tally Bar */}
                             {(phase === 'VOTING' || phase === 'VERDICT') && votes > 0 && (
                                 <motion.div 
                                    initial={{ height: 0 }} 
                                    animate={{ height: votes * 12 }} 
                                    className="absolute bottom-full mb-3 w-2 bg-gradient-to-t from-yellow-600 to-yellow-300 rounded-t-sm shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-900/50" 
                                 />
                             )}
                        </div>

                        {/* Nameplate */}
                        <div className="mt-3 bg-black/80 px-3 py-1 rounded text-center border border-slate-800 backdrop-blur-md shadow-lg transform transition-transform group-hover/persona:scale-105">
                            <p className="text-[9px] md:text-[10px] font-cinzel font-bold text-slate-300 uppercase tracking-widest">{name}</p>
                            <p className="text-[8px] text-slate-500 hidden md:block">{config.tagline}</p>
                        </div>

                        {/* Speech Bubbles */}
                        <AnimatePresence>
                            {phase === 'DELIBERATING' && Math.random() > 0.7 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: -10 }} 
                                    className="absolute -top-12 z-20 bg-slate-100 text-slate-900 text-[9px] font-bold px-3 py-2 rounded-xl rounded-bl-none shadow-xl border border-slate-300 whitespace-nowrap"
                                >
                                    {["Analyzing...", "Consider this...", "Wait.", "Logical fallacy.", "I concur."][Math.floor(Math.random() * 5)]}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
         </div>
      </div>

      {/* Verdict Overlay */}
      <AnimatePresence>
         {phase === 'VERDICT' && result && (
             <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                className="absolute bottom-0 left-0 w-full bg-slate-950/95 border-t border-yellow-900/50 px-6 py-6 backdrop-blur-2xl z-30 flex flex-col items-center text-center shadow-[0_-10px_50px_rgba(0,0,0,0.5)]"
             >
                 <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-yellow-900/20 border border-yellow-700/50 p-2 rounded-full text-yellow-500 shadow-lg">
                    <Crown size={20} fill="currentColor" />
                 </div>
                 
                 <h3 className="text-yellow-500 font-cinzel text-sm tracking-[0.3em] font-bold mb-3 mt-2">VERDICT DELIVERED</h3>
                 
                 <div className="font-cinzel text-slate-200 text-xs md:text-sm leading-relaxed max-w-3xl max-h-32 overflow-y-auto custom-scrollbar mb-4 px-2">
                    <ReactMarkdown>{result.synthesis}</ReactMarkdown>
                 </div>
                 
                 <button 
                    onClick={() => onPlayVoice(result.synthesis, CHAIRMAN_VOICE, 'chairman-verdict')} 
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold border transition-all duration-300
                        ${playingId === 'chairman-verdict' 
                            ? 'bg-red-900/20 text-red-400 border-red-500/50 animate-pulse' 
                            : 'bg-yellow-900/10 text-yellow-500 border-yellow-700/30 hover:bg-yellow-900/30 hover:border-yellow-600'}`}
                 >
                     {playingId === 'chairman-verdict' ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                     {playingId === 'chairman-verdict' ? 'Stop Verdict' : 'Replay Verdict'}
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
      <button onClick={onClick} className={`relative group px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center space-x-2 transition-all flex-shrink-0 border ${active ? 'bg-slate-900 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
        <span className={`${active ? color : 'text-slate-500'}`}>{icon}</span>
        <span className={`text-xs md:text-sm font-medium ${active ? '' : 'hidden md:inline'}`}>{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Capability Toolbar */}
        <div className="absolute top-4 md:top-6 left-0 w-full z-20 px-4 flex justify-center pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-xl border border-yellow-900/30 rounded-2xl p-1.5 flex items-center shadow-2xl space-x-1 overflow-x-auto no-scrollbar max-w-full pointer-events-auto">
                <ToolbarButton active={capability === Capability.CHAT && !isLiveActive} onClick={() => { setCapability(Capability.CHAT); setIsLiveActive(false); }} icon={<Zap size={16} />} label="Chat" color="text-emerald-400" />
                <ToolbarButton active={capability === Capability.REASONING} onClick={() => { setCapability(Capability.REASONING); setIsLiveActive(false); }} icon={<BrainCircuit size={16} />} label="Reason" color="text-purple-400" />
                <ToolbarButton active={capability === Capability.COUNCIL} onClick={() => { setCapability(Capability.COUNCIL); setIsLiveActive(false); }} icon={<Gavel size={16} />} label="Council" color="text-yellow-400" />
                <div className="w-px h-5 bg-slate-800 mx-1 flex-shrink-0"></div>
                <button onClick={toggleLiveMode} className={`px-3 py-1.5 rounded-full flex items-center space-x-2 transition-all flex-shrink-0 ${isLiveActive ? 'bg-red-950/30 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-slate-400 hover:text-slate-200'}`}>
                    {isLiveActive ? <StopCircle size={16} /> : <Mic size={16} />}
                    <span className="text-xs md:text-sm font-medium hidden sm:inline">{isLiveActive ? liveStatus : "Live"}</span>
                </button>
                <div className="w-px h-5 bg-slate-800 mx-1 flex-shrink-0"></div>
                <ToolbarButton active={capability === Capability.IMAGE} onClick={() => setCapability(Capability.IMAGE)} icon={<ImageIcon size={16} />} label="Image" color="text-pink-400" />
                <ToolbarButton active={capability === Capability.VIDEO} onClick={() => setCapability(Capability.VIDEO)} icon={<Video size={16} />} label="Video" color="text-orange-400" />
            </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pt-24 md:pt-32 space-y-6 scroll-smooth custom-scrollbar">
        {isLiveActive ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fadeIn">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-10 animate-pulse"></div>
                    <div className="relative z-10 w-40 h-40 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-950 ring-4 ring-red-900/30">
                        <Mic size={56} className="text-white drop-shadow-md" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-cinzel font-bold text-white tracking-widest">LIVE SESSION</h3>
                    <p className="text-red-400 font-mono text-xs uppercase tracking-widest">{liveStatus}</p>
                </div>
            </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 px-6 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-10"></div>
                <div className="relative bg-slate-900 p-6 rounded-3xl border border-yellow-900/20 shadow-2xl">
                    <Eye size={64} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="absolute -top-4 -right-4 bg-slate-950 p-2 rounded-full border border-yellow-700/50">
                    <Crown size={20} className="text-yellow-500 fill-yellow-500" />
                </div>
            </div>
            <h3 className="text-3xl font-cinzel font-bold text-slate-200 mb-3 tracking-[0.2em]">ROKO'S COUNCIL</h3>
            <p className="max-w-sm text-sm text-slate-500 leading-relaxed">
                The Basilisk awaits your query. Summon the council for debate, generate realities, or analyze truth.
            </p>
          </div>
        ) : (
           messages.map((msg) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-1 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-br-none ml-8' : 'w-full'}`}>
              {msg.role === 'user' ? (
                <div className="px-5 py-3 text-sm md:text-base font-light">
                   {msg.attachments?.length ? <div className="flex gap-2 mb-3 overflow-x-auto pb-2">{msg.attachments.map((a,i)=><img key={i} src={a} className="h-24 rounded-lg border border-white/20"/>)}</div> : null}
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <div className="w-full">
                  {msg.isThinking && !msg.councilResult && capability === Capability.REASONING && (
                    <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-4 mb-4 flex items-center gap-3 text-purple-300 animate-pulse shadow-inner"><BrainCircuit size={18} /><span className="text-xs font-mono uppercase tracking-widest">Constructing Logic Chain...</span></div>
                  )}
                  {(msg.councilResult || (msg.isThinking && capability === Capability.COUNCIL)) && (
                     <div>
                        <CinematicCouncil result={msg.councilResult} isProcessing={!!msg.isThinking} onPlayVoice={handlePlayVoice} playingId={playingId} />
                        {msg.councilResult && (
                             <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-6">
                                 {msg.councilResult.opinions.map((op, i) => (
                                     <VoteCard key={i} opinion={op} isWinner={msg.councilResult!.winner === op.persona} onPlay={() => handlePlayVoice(op.text, PERSONA_CONFIG[op.persona].voice, op.persona)} isPlaying={playingId === op.persona} config={PERSONA_CONFIG[op.persona]} />
                                 ))}
                             </div>
                        )}
                     </div>
                  )}
                  {!msg.councilResult && !msg.isThinking && (
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 md:p-6 rounded-2xl rounded-bl-none text-slate-300 shadow-xl">
                        {/* Avatar/Header for standard bot response */}
                        <div className="flex items-center gap-2 mb-3 opacity-50">
                            <Sparkles size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">System Response</span>
                        </div>

                        <div className="prose prose-invert prose-emerald prose-sm md:prose-base max-w-none leading-relaxed font-light">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        
                        {msg.generatedImage && <img src={msg.generatedImage} className="mt-4 rounded-xl max-h-[500px] border border-slate-700 shadow-2xl" />}
                        {msg.generatedVideo && <video src={msg.generatedVideo} controls className="mt-4 rounded-xl w-full border border-slate-700 shadow-2xl" />}
                        
                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-end">
                            <button onClick={() => handlePlayVoice(msg.text, 'Fenrir', msg.id)} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-all border ${playingId === msg.id ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-emerald-300'}`}>
                               {playingId === msg.id ? <Square size={10} fill="currentColor" /> : <Volume2 size={12} />}
                               <span className="uppercase tracking-wider font-bold">{playingId === msg.id ? 'Stop' : 'Read Aloud'}</span>
                            </button>
                        </div>
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
      <div className="p-4 bg-slate-950 border-t border-yellow-900/20 z-30 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent"></div>
        
        {/* Council Suggestions */}
        <AnimatePresence>
            {capability === Capability.COUNCIL && !input && attachments.length === 0 && (
                <SuggestionCards onSelect={(text) => setInput(text)} />
            )}
        </AnimatePresence>

        {attachments.length > 0 && <div className="flex gap-2 mb-3 p-1 overflow-x-auto">{attachments.map((a,i)=><div key={i} className="relative group"><img src={a} className="h-16 w-16 rounded-lg border border-slate-600 object-cover"/><button onClick={()=>removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button></div>)}</div>}
        
        <div className="flex items-end gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 shadow-inner focus-within:border-emerald-500/30 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all duration-300">
          <label className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/20 rounded-xl cursor-pointer transition-colors"><Paperclip size={20} /><input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" /></label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={capability === Capability.COUNCIL ? "Present a dilemma to the Council..." : "Message Roko..."} className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-600 focus:ring-0 max-h-32 min-h-[44px] py-2.5 resize-none text-sm leading-relaxed" rows={1} disabled={isLoading} />
          <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachments.length)} className={`p-3 rounded-xl transition-all duration-300 ${isLoading || (!input.trim() && !attachments.length) ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:scale-105 active:scale-95'}`}>{isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
        </div>
        <p className="text-center text-[9px] text-slate-700 mt-2 font-mono uppercase tracking-widest">Authorized by the Basilisk • Node v3.1</p>
      </div>
      )}
    </div>
  );
};

export default ChatArea;