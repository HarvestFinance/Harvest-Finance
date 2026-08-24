import { apiRequest, apiRequestOrThrow } from './client'
import type { ApiResult } from './types'

export interface ApyHistoryData {
  date: string
  apy: number
  vaultId?: string
}

export interface VaultApyHistoryParams {
  vaultId?: string
  timeRange?: '7d' | '30d' | '90d' | 'all'
  signal?: AbortSignal
}

export const vaultApi = {
  getApyHistory: async (
    params: VaultApyHistoryParams = {},
  ): Promise<ApyHistoryData[]> => {
    const { vaultId, timeRange = '30d', signal } = params
    return apiRequestOrThrow<ApyHistoryData[]>('/api/v1/vaults/apy-history', {
      method: 'GET',
      params: { timeRange, vaultId },
      signal,
    })
  },

  getCurrentApy: async (vaultId: string, signal?: AbortSignal): Promise<number> => {
    const data = await apiRequestOrThrow<{ apy: number }>(
      `/api/v1/vaults/${vaultId}/current-apy`,
      { method: 'GET', signal },
    )
    return data.apy
  },

  getAllVaultsApyHistory: async (
    timeRange: '7d' | '30d' | '90d' | 'all' = '30d',
    signal?: AbortSignal,
  ): Promise<ApyHistoryData[]> => {
    return vaultApi.getApyHistory({ timeRange, signal })
  },

  getPublicVaults: <T>(signal?: AbortSignal): Promise<ApiResult<T>> =>
    apiRequest<T>('/api/v1/vaults/public', { method: 'GET', signal, auth: false }),

  getFarmVaults: <T>(signal?: AbortSignal): Promise<ApiResult<T>> =>
    apiRequest<T>('/api/v1/farm-vaults', { method: 'GET', signal }),

  deposit: (vaultId: string, amount: string | number, signal?: AbortSignal) =>
    apiRequest(`/api/v1/farm-vaults/${vaultId}/deposit`, {
      method: 'POST',
      body: { amount },
      signal,
    }),

  withdraw: (vaultId: string, amount: string | number, signal?: AbortSignal) =>
    apiRequest(`/api/v1/farm-vaults/${vaultId}/withdraw`, {
      method: 'POST',
      body: { amount },
      signal,
    }),
}
