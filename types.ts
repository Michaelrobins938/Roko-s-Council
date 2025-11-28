export enum Capability {
  CHAT = 'CHAT', // Standard 2.5 Flash
  REASONING = 'REASONING', // 3.0 Pro
  SEARCH = 'SEARCH', // Grounding
  MAPS = 'MAPS', // Maps Grounding
  IMAGE = 'IMAGE', // Image Gen/Edit
  VIDEO = 'VIDEO', // Video Gen
  COUNCIL = 'COUNCIL', // Multi-persona consensus
  LIVE = 'LIVE' // Real-time Audio
}

export enum Tool {
  CHAT = 'CHAT',
  REAL_ESTATE = 'REAL_ESTATE',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  ANALYZER = 'ANALYZER'
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
  preview: string;
}

export interface CouncilOpinion {
  persona: string;
  text: string;
  vote?: string; // Who they voted for
  reason?: string; // Why they voted
}

export interface CouncilResult {
  winner: string;
  synthesis: string;
  opinions: CouncilOpinion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: string[]; // base64 data strings
  groundingMetadata?: any;
  generatedImage?: string; // base64
  generatedVideo?: string; // uri
  isThinking?: boolean;
  councilResult?: CouncilResult;
}

export interface ImageGenSettings {
  aspectRatio: string;
  imageSize: '1K' | '2K' | '4K';
  prompt: string;
}

export interface VideoGenSettings {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  image?: string; // base64 for image-to-video
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";