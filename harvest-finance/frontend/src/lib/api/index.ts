export { api, apiRequest, apiRequestOrThrow } from './client'
export { default as apiClient } from './client'
export type { ApiFailure, ApiRequestOptions, ApiResult, ApiSuccess, HttpMethod } from './types'
export { ApiRequestError } from './types'

export { vaultApi } from './vault-client'
export { operatorApi } from './operator-client'
export {
  sendChatMessage,
  type ChatMessage,
  type ChatRequest,
  type ChatResponse,
  type FarmContext,
} from './ai-assistant-client'
