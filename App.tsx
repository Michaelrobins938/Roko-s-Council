import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import RealEstate from './components/RealEstate';
import Analyzer from './components/Analyzer';
import { Capability, Session, Tool, ChatMessage } from './types';
import { Menu } from 'lucide-react';

const STORAGE_KEY = 'gemini_hub_sessions_v1';

const App: React.FC = () => {
  // Navigation State
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat Data State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Transient state for new chat presets
  const [initialInput, setInitialInput] = useState('');
  const [initialCapability, setInitialCapability] = useState<Capability>(Capability.CHAT);

  // Load sessions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = (title: string = 'New Chat', capability: Capability = Capability.CHAT) => {
    const newSession: Session = {
      id: Date.now().toString(),
      title,
      messages: [],
      lastModified: Date.now(),
      preview: 'Start a new conversation...'
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentTool(Tool.CHAT);
    setInitialCapability(capability);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const updateActiveSessionMessages = (messages: ChatMessage[]) => {
    if (!activeSessionId) return;
    
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const lastMsg = messages[messages.length - 1];
        return {
          ...s,
          messages,
          lastModified: Date.now(),
          preview: lastMsg ? (lastMsg.text.slice(0, 50) + (lastMsg.text.length > 50 ? '...' : '')) : s.preview,
          title: s.messages.length === 0 && messages.length > 0 ? (messages[0].text.slice(0, 30) || 'New Chat') : s.title
        };
      }
      return s;
    }));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  };

  const handleSelectPreset = (preset: { input: string, capability: Capability }) => {
    if (currentTool !== Tool.CHAT) {
        setCurrentTool(Tool.CHAT);
    }
    // If current session is empty, use it. Otherwise create new.
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (currentSession && currentSession.messages.length === 0) {
        setInitialInput(preset.input);
        setInitialCapability(preset.capability);
    } else {
        createNewSession('New Chat', preset.capability);
        setInitialInput(preset.input);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (currentTool) {
      case Tool.REAL_ESTATE: return <RealEstate />;
      case Tool.IMAGE_STUDIO: return <ImageStudio />;
      case Tool.VIDEO_STUDIO: return <VideoStudio />;
      case Tool.ANALYZER: return <Analyzer />;
      case Tool.CHAT:
      default:
        const activeSession = sessions.find(s => s.id === activeSessionId);
        return (
          <ChatArea 
            key={activeSessionId} // Force re-mount on session change to clear internal state if any
            initialInput={initialInput} 
            initialCapability={initialCapability}
            messages={activeSession?.messages || []}
            onUpdateMessages={updateActiveSessionMessages}
            onClearInitial={() => setInitialInput('')}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentTool={currentTool}
        onSelectTool={(t) => { setCurrentTool(t); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
        onSelectPreset={handleSelectPreset} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => { 
            setActiveSessionId(id); 
            setCurrentTool(Tool.CHAT);
            if(window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onNewChat={() => createNewSession()}
        onDeleteSession={deleteSession}
      />
      
      <main className="flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                <Menu size={20} />
            </button>
            <span className="ml-2 font-semibold text-slate-200">
                {currentTool === Tool.CHAT ? sessions.find(s => s.id === activeSessionId)?.title || 'Chat' : 
                 currentTool === Tool.REAL_ESTATE ? 'Real Estate' :
                 currentTool === Tool.IMAGE_STUDIO ? 'Image Studio' :
                 currentTool === Tool.VIDEO_STUDIO ? 'Video Studio' : 'Analyzer'}
            </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;