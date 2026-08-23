import { apiRequestOrThrow } from './client'

export interface QueryHistoryItem {
  id: string
  query: string
  response: string
  vaultContext: Record<string, unknown> | null
  seasonalData: Record<string, unknown> | null
  createdAt: string
}

export async function fetchQueryHistory(
  search?: string,
  signal?: AbortSignal,
): Promise<QueryHistoryItem[]> {
  return apiRequestOrThrow<QueryHistoryItem[]>('/api/ai-query-history', {
    method: 'GET',
    params: { search },
    signal,
  })
}

export async function saveQueryHistory(payload: {
  query: string
  response: string
  vaultContext?: Record<string, unknown>
  seasonalData?: Record<string, unknown>
  signal?: AbortSignal
}): Promise<QueryHistoryItem> {
  const { signal, ...body } = payload
  return apiRequestOrThrow<QueryHistoryItem>('/api/ai-query-history', {
    method: 'POST',
    body,
    signal,
  })
}

export async function deleteQueryHistory(id: string, signal?: AbortSignal): Promise<void> {
  await apiRequestOrThrow<void>(`/api/ai-query-history/${id}`, {
    method: 'DELETE',
    signal,
  })
}
