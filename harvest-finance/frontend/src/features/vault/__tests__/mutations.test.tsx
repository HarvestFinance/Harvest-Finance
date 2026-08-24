import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useDepositMutation } from '../hooks'
import { queryKeys } from '@/lib/query/keys'

const invalidateQueries = jest.fn()

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries,
    }),
  }
})

jest.mock('../api', () => ({
  depositToVault: jest.fn().mockResolvedValue({ status: 'confirmed' }),
  withdrawFromVault: jest.fn(),
  fetchPublicVaults: jest.fn(),
  fetchFarmVaults: jest.fn(),
  fetchPortfolioOverview: jest.fn(),
}))

describe('vault mutations', () => {
  it('invalidates vault and portfolio queries after deposit', async () => {
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDepositMutation(), { wrapper })
    result.current.mutate({ vaultId: 'vault-1', amount: 100 })

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalled())
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.vaults.all })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.portfolio.all })
  })
})
