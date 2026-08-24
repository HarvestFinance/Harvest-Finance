import { apiRequestOrThrow } from './client'

export interface FarmContext {
  selectedCrop?: string
  currentSeason?: string
  vaultBalance?: number
  totalDeposits?: number
  totalRewards?: number
  currentMilestone?: string
  vaultTarget?: number
  progressPercent?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  context?: FarmContext
  history?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  suggestions?: string[]
  timestamp: string
}

export async function sendChatMessage(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  return apiRequestOrThrow<ChatResponse>('/api/v1/ai-assistant/chat', {
    method: 'POST',
    body: request,
    signal,
  })
}
