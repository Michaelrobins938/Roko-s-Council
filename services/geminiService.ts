import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Capability, CouncilOpinion, CouncilResult } from "../types";

const getAIClient = async (requiresPaidKey = false): Promise<GoogleGenAI> => {
  const win = window as any;
  if (requiresPaidKey && win.aistudio) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- LIVE API HELPER ---

export class LiveClient {
  private ai: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onStatusChange: (status: string) => void;

  constructor(onStatusChange: (status: string) => void) {
    this.onStatusChange = onStatusChange;
  }

  async connect() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
      callbacks: {
        onopen: () => {
          this.onStatusChange("Connected");
          this.startAudioInput(stream);
        },
        onmessage: async (message: any) => {
          // Handle Audio Output
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            this.playAudioChunk(base64Audio);
          }
          
          // Handle Interruption
          if (message.serverContent?.interrupted) {
             this.stopAudioPlayback();
          }
        },
        onclose: () => this.onStatusChange("Disconnected"),
        onerror: (e) => {
          console.error(e);
          this.onStatusChange("Error");
        }
      }
    });
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;
    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private createBlob(data: Float32Array) {
     const l = data.length;
     const int16 = new Int16Array(l);
     for (let i = 0; i < l; i++) {
       int16[i] = data[i] * 32768;
     }
     // Simple base64 encode for the blob data part
     let binary = '';
     const bytes = new Uint8Array(int16.buffer);
     const len = bytes.byteLength;
     for (let i = 0; i < len; i++) {
       binary += String.fromCharCode(bytes[i]);
     }
     const b64 = btoa(binary);

     return {
       data: b64,
       mimeType: 'audio/pcm;rate=16000'
     };
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputAudioContext || !this.outputNode) return;
    
    // Base64 decode
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // PCM Decode
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = this.outputAudioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputNode);
    
    // Schedule
    this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private stopAudioPlayback() {
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async disconnect() {
    this.stopAudioPlayback();
    if (this.processor) {
        this.processor.disconnect();
        this.processor.onaudioprocess = null;
    }
    if (this.inputSource) this.inputSource.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
    
    // Close session
    this.sessionPromise?.then(session => session.close());
  }
}

// --- TTS ---

export const generateSpeech = async (text: string, voiceName: string = 'Fenrir'): Promise<string> => {
  const ai = await getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};

// --- CHAT & REASONING ---

export const sendMessage = async (
  message: string,
  capability: Capability,
  images?: string[]
): Promise<GenerateContentResponse> => {
  const ai = await getAIClient();
  
  let modelName = 'gemini-2.5-flash';
  let tools: any[] = [];
  let config: any = {};

  switch (capability) {
    case Capability.REASONING:
      modelName = 'gemini-3-pro-preview';
      config.thinkingConfig = { thinkingBudget: 32768 };
      break;
    case Capability.SEARCH:
      modelName = 'gemini-2.5-flash';
      tools = [{ googleSearch: {} }];
      break;
    case Capability.MAPS:
      modelName = 'gemini-2.5-flash';
      tools = [{ googleMaps: {} }];
      break;
    default:
      modelName = 'gemini-2.5-flash';
  }

  const parts: any[] = [];
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.split(',')[1]
        }
      });
    });
  }
  parts.push({ text: message });

  return await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      tools: tools.length > 0 ? tools : undefined,
      ...config
    }
  });
};

// --- ENHANCED COUNCIL ---

const PERSONALITIES = [
  { name: "Oracle", desc: "Wise, prophetic, long-term thinker. Prioritize truth." },
  { name: "Strategos", desc: "Military strategist, pragmatic. Prioritize tactics and feasibility." },
  { name: "Philosopher", desc: "Rational, analytical, skeptical. Question assumptions." },
  { name: "Demagogue", desc: "Persuasive, emotional appeal. Focus on impact and feeling." },
  { name: "Jurist", desc: "Law-focused, rule-based. Ensure fairness and compliance." },
  { name: "Citizen", desc: "People's voice, empathetic. Focus on social good." },
  { name: "Historian", desc: "Context-aware. Reference past precedents." },
  { name: "Critic", desc: "Tough, contrarian. Challenge ideas rigorously." }
];

export const runCouncil = async (message: string): Promise<CouncilResult> => {
  const ai = await getAIClient();
  
  // Phase 1: Parallel Generation
  const opinionPromises = PERSONALITIES.map(async (persona) => {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: message }] },
        config: { systemInstruction: `You are ${persona.name}. ${persona.desc}. Keep response concise.` }
      });
      return {
        persona: persona.name,
        text: res.text || "No opinion."
      };
    } catch {
      return { persona: persona.name, text: "Abstained." };
    }
  });

  const opinions = await Promise.all(opinionPromises);

  // Phase 2: Voting
  const validOpinions = opinions.filter(o => o.text !== "Abstained.");
  const votingPromises = PERSONALITIES.map(async (persona) => {
    // Each bot sees all responses and votes
    const prompt = `
      You are ${persona.name}. Here are responses to the user query: "${message}".
      
      ${validOpinions.map((op, i) => `[${i+1}] ${op.persona}: ${op.text.substring(0, 150)}...`).join('\n')}
      
      Vote for the SINGLE BEST response (excluding your own if possible, but allowed if strictly superior).
      Return JSON: {"vote": "Name of Persona", "reason": "Short reason"}
    `;
    
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: { 
            responseMimeType: "application/json",
            systemInstruction: `You are ${persona.name}. ${persona.desc}. Vote on merit.` 
        }
      });
      const voteData = JSON.parse(res.text || "{}");
      return {
        voter: persona.name,
        votedFor: voteData.vote || "None",
        reason: voteData.reason || "No reason"
      };
    } catch {
       return { voter: persona.name, votedFor: "None", reason: "Failed to vote" };
    }
  });

  const votes = await Promise.all(votingPromises);

  // Tally
  const tally: Record<string, number> = {};
  votes.forEach(v => {
      if (v.votedFor !== "None") {
          tally[v.votedFor] = (tally[v.votedFor] || 0) + 1;
      }
  });

  let winner = Object.keys(tally).reduce((a, b) => (tally[a] || 0) > (tally[b] || 0) ? a : b, validOpinions[0].persona);
  
  // Attach vote data to opinions for display
  const enhancedOpinions: CouncilOpinion[] = opinions.map(op => {
      const vote = votes.find(v => v.voter === op.persona);
      return {
          ...op,
          vote: vote?.votedFor,
          reason: vote?.reason
      };
  });

  // Phase 3: Chairman Synthesis (Gemini 3.0 Pro)
  const chairmanPrompt = `
    You are the Chairman of the AI Council.
    User Query: "${message}"
    
    The Council has voted.
    Winner: ${winner} with ${tally[winner] || 0} votes.
    
    Full Voting Tally:
    ${JSON.stringify(tally)}

    Key Opinions:
    ${enhancedOpinions.map(op => `- ${op.persona}: ${op.text.substring(0, 200)}...`).join('\n')}
    
    Provide a final, authoritative summary of the decision. 
    1. Announce the winner clearly.
    2. Synthesize the best parts of the winning argument.
    3. Acknowledge any valid dissenting points from other members to provide a balanced view.
  `;

  let synthesis = `The Council has decided in favor of **${winner}**.`;
  try {
     const chairmanRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: chairmanPrompt }] }
     });
     if (chairmanRes.text) synthesis = chairmanRes.text;
  } catch (e) {
      console.error("Chairman synthesis failed", e);
  }

  return {
    winner,
    synthesis,
    opinions: enhancedOpinions
  };
};

// --- IMAGE & VIDEO ---

export const generateImage = async (prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") => {
  const ai = await getAIClient(true);
  return await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio, imageSize } }
  });
};

export const editImage = async (prompt: string, base64Image: string) => {
  const ai = await getAIClient();
  return await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
        { text: prompt }
      ]
    }
  });
};

export const generateVideo = async (prompt: string, aspectRatio: any, resolution: any, base64Image?: string) => {
  const ai = await getAIClient(true);
  const config: any = { numberOfVideos: 1, resolution, aspectRatio };
  let operation;
  
  if (base64Image) {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: { imageBytes: base64Image.split(',')[1], mimeType: 'image/png' },
      config
    });
  } else {
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config
    });
  }

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.response?.generatedVideos?.[0]?.video?.uri) {
    return `${operation.response.generatedVideos[0].video.uri}&key=${process.env.API_KEY}`;
  }
  return undefined;
};

export const analyzeContent = async (prompt: string, base64Data: string, mimeType: string) => {
  const ai = await getAIClient();
  const data = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  return await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType, data } },
        { text: prompt }
      ]
    }
  });
};