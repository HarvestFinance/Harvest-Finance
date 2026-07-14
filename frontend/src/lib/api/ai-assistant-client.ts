import axios from '@/lib/api-client';

// Use relative API path by default so requests resolve to the same origin (avoids CORS in dev)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export interface FarmContext {
  selectedCrop?: string;
  currentSeason?: string;
  vaultBalance?: number;
  totalDeposits?: number;
  totalRewards?: number;
  currentMilestone?: string;
  vaultTarget?: number;
  progressPercent?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  context?: FarmContext;
  history?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  timestamp: string;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    '/api/v1/ai-assistant/chat',
    request,
  );
  return data;
}
