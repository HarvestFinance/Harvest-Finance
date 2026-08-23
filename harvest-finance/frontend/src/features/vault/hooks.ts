'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import type { Vault } from '@/types/vault'
import { MOCK_PUBLIC_VAULTS } from './mocks'
import {
  depositToVault,
  fetchFarmVaults,
  fetchPortfolioOverview,
  fetchPublicVaults,
  withdrawFromVault,
  type DepositInput,
  type WithdrawInput,
} from './api'

export function usePublicVaultsQuery() {
  return useQuery({
    queryKey: queryKeys.vaults.public(),
    queryFn: ({ signal }) => fetchPublicVaults(signal),
    placeholderData: MOCK_PUBLIC_VAULTS,
  })
}

export function useFarmVaultsQuery<T = unknown>(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vaults.farm(),
    queryFn: ({ signal }) => fetchFarmVaults<T>(signal),
    enabled,
  })
}

export function usePortfolioQuery() {
  return useQuery({
    queryKey: queryKeys.portfolio.overview(),
    queryFn: ({ signal }) => fetchPortfolioOverview(signal),
  })
}

const invalidateVaultAndPortfolio = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.vaults.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all }),
  ])
}

export function useDepositMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DepositInput) => depositToVault(input),
    onSuccess: async () => {
      await invalidateVaultAndPortfolio(queryClient)
    },
  })
}

export function useWithdrawMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: WithdrawInput) => withdrawFromVault(input),
    onSuccess: async () => {
      await invalidateVaultAndPortfolio(queryClient)
    },
  })
}

export function useVaultsQuery() {
  return usePublicVaultsQuery()
}

export type { Vault }
