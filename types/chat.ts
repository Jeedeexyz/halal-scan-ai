export type Role = 'user' | 'assistant';

export type Verdict = 'halal' | 'haram' | 'mashbooh' | 'not-food' | 'general';

export interface Evidence {
  type: 'quran' | 'hadith' | 'fiqh' | 'note';
  citation: string;
  sourceName: string;
  url?: string;
}

export interface AssistantPayload {
  verdict: Verdict;
  language: string;
  shortAnswer: string;
  detailedAnswer: string;
  detectedIngredients: string[];
  imageContext?: {
    isFoodItem: boolean;
    confidence: number;
    reason: string;
  };
  evidences: Evidence[];
  followUpQuestions: string[];
  caution?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  imageUri?: string;
  createdAt: string;
  payload?: AssistantPayload;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  createdAt: string;
}