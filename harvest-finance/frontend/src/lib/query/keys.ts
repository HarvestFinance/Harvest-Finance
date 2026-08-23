export const queryKeys = {
  vaults: {
    all: ['vaults'] as const,
    list: () => [...queryKeys.vaults.all, 'list'] as const,
    public: () => [...queryKeys.vaults.all, 'public'] as const,
    farm: () => [...queryKeys.vaults.all, 'farm'] as const,
    detail: (id: string) => [...queryKeys.vaults.all, 'detail', id] as const,
    apy: (vaultId?: string, timeRange?: string) =>
      [...queryKeys.vaults.all, 'apy', vaultId ?? 'all', timeRange ?? '30d'] as const,
  },
  portfolio: {
    all: ['portfolio'] as const,
    overview: () => [...queryKeys.portfolio.all, 'overview'] as const,
    transactions: () => [...queryKeys.portfolio.all, 'transactions'] as const,
  },
}

export const mutationKeys = {
  deposit: (vaultId: string) => ['vault-deposit', vaultId] as const,
  withdraw: (vaultId: string) => ['vault-withdraw', vaultId] as const,
}
