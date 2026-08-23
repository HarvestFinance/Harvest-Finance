import { apiRequest, apiRequestOrThrow } from '../client'
import { ApiRequestError } from '../types'

describe('apiRequest', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('returns a typed success union', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'vault-1' }),
    }) as unknown as typeof fetch

    const result = await apiRequest<{ id: string }>('/api/v1/vaults/public', { auth: false })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('vault-1')
      expect(result.status).toBe(200)
    }
  })

  it('returns a typed error union on HTTP failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid amount' }),
    }) as unknown as typeof fetch

    const result = await apiRequest('/api/v1/farm-vaults/1/deposit', {
      method: 'POST',
      body: { amount: 0 },
      auth: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid amount')
      expect(result.error.status).toBe(400)
    }
  })

  it('rethrows abort errors so React Query can cancel in-flight requests', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    global.fetch = jest.fn().mockRejectedValue(abortError) as unknown as typeof fetch

    await expect(apiRequest('/api/v1/vaults/public', { auth: false })).rejects.toBe(abortError)
  })

  it('throws ApiRequestError from the unwrap helper', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ error: 'boom' }),
    }) as unknown as typeof fetch

    await expect(apiRequestOrThrow('/api/v1/vaults/public', { auth: false })).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })
})
