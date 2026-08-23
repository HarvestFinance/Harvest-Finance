import { apiRequestOrThrow } from '@/lib/api/client'
import { vaultApi } from '@/lib/api/vault-client'
import type { PortfolioStats, Transaction } from '@/lib/mock-data'
import type { Vault } from '@/types/vault'

export type DepositInput = {
  vaultId: string
  amount: string | number
}

export type WithdrawInput = {
  vaultId: string
  amount: string | number
}

export async function fetchPublicVaults(signal?: AbortSignal): Promise<Vault[]> {
  return apiRequestOrThrow<Vault[]>('/api/v1/vaults/public', {
    method: 'GET',
    auth: false,
    signal,
  })
}

export async function fetchFarmVaults<T = unknown>(signal?: AbortSignal): Promise<T> {
  return apiRequestOrThrow<T>('/api/v1/farm-vaults', { method: 'GET', signal })
}

export async function fetchPortfolioOverview(signal?: AbortSignal): Promise<{
  stats: PortfolioStats
  transactions: Transaction[]
}> {
  return apiRequestOrThrow('/api/v1/portfolio', { method: 'GET', signal })
}

export async function depositToVault(
  input: DepositInput,
  signal?: AbortSignal,
) {
  const result = await vaultApi.deposit(input.vaultId, input.amount, signal)
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.data
}

export async function withdrawFromVault(
  input: WithdrawInput,
  signal?: AbortSignal,
) {
  const result = await vaultApi.withdraw(input.vaultId, input.amount, signal)
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.data
}
