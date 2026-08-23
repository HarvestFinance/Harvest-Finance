import { http, HttpResponse } from 'msw'
import { MOCK_STATS, MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { MOCK_PUBLIC_VAULTS } from '@/features/vault/mocks'
import { nowIso } from '@/lib/datetime'

export const handlers = [
  http.get('/api/v1/vaults/public', () => HttpResponse.json(MOCK_PUBLIC_VAULTS)),

  http.get('/api/v1/farm-vaults', () =>
    HttpResponse.json(
      MOCK_PUBLIC_VAULTS.map((vault) => ({
        ...vault,
        status: 'ACTIVE',
        targetAmount: vault.seasonalTarget,
        startDate: nowIso(),
      })),
    ),
  ),

  http.get('/api/v1/portfolio', () =>
    HttpResponse.json({
      stats: MOCK_STATS,
      transactions: MOCK_TRANSACTIONS,
    }),
  ),

  http.get('/api/v1/vaults/apy-history', () => {
    const history = Array.from({ length: 7 }).map((_, index) => ({
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      apy: 8 + index * 0.15,
    }))
    return HttpResponse.json(history.reverse())
  }),

  http.post('/api/v1/farm-vaults/:vaultId/deposit', async ({ params, request }) => {
    const body = (await request.json()) as { amount?: number }
    return HttpResponse.json({
      vaultId: params.vaultId,
      amount: Number(body.amount ?? 0),
      txHash: `tx-msw-${Date.now()}`,
      timestamp: nowIso(),
      status: 'confirmed',
    })
  }),

  http.post('/api/v1/farm-vaults/:vaultId/withdraw', async ({ params, request }) => {
    const body = (await request.json()) as { amount?: number }
    return HttpResponse.json({
      vaultId: params.vaultId,
      amount: Number(body.amount ?? 0),
      txHash: `tx-msw-${Date.now()}`,
      timestamp: nowIso(),
      status: 'confirmed',
    })
  }),
]
