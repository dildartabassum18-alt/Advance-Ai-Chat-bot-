export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  files?: Array<{
    name: string;
    type: string;
    url: string; // For image previews
  }>;
}

export type SpeechRate = 'slow' | 'medium' | 'fast';

export interface ChatSettings {
  name: string;
  personality: string;
  theme: 'light' | 'dark';
  voice: 'Zephyr' | 'Kore'; // Male and Female voice options
  speechRate: SpeechRate;
  voiceSource: 'online' | 'offline';
}

export interface UploadedFile {
    name: string;
    type: string;
    base64: string;
}

export interface KnowledgeFile {
    name: string;
    content: string;
}
