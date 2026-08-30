import { env } from '@/lib/env'
import { useToastStore } from '@/store/useToastStore'
import type { ApiRequestOptions, ApiResult, AxiosLikeConfig } from './types'
import { ApiRequestError } from './types'

const TOKEN_KEYS = ['harvest_auth_token', 'access_token'] as const

const generateRequestId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getRequestId = (): string => {
  if (typeof window === 'undefined') return generateRequestId();
  let id = sessionStorage.getItem('x-request-id');
  if (!id) {
    id = generateRequestId();
    sessionStorage.setItem('x-request-id', id);
  }
  return id;
};

const isAbortError = (error: unknown): boolean => {
  if (!error) return false
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof Error && error.name === 'AbortError') return true
  return false
}

const readAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key)
    if (value) return value
  }
  return null
}

const joinUrl = (base: string, path: string): string => {
  if (!base) return path
  const trimmedBase = base.replace(/\/$/, '')
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const trimmedPath = path.startsWith('/') ? path : `/${path}`
  if (trimmedBase.endsWith('/api/v1') && trimmedPath.startsWith('/api/v1')) {
    return `${trimmedBase}${trimmedPath.slice('/api/v1'.length)}`
  }
  return `${trimmedBase}${trimmedPath}`
}

const resolveUrl = (path: string, options: ApiRequestOptions = {}): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (options.target === 'backend') {
    return joinUrl(env.NEXT_PUBLIC_API_URL, path)
  }
  return path
}

const appendParams = (url: string, params?: ApiRequestOptions['params']): string => {
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }
  const query = search.toString()
  if (!query) return url
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string | string[]; error?: string }
    if (typeof payload.message === 'string' && payload.message) return payload.message
    if (Array.isArray(payload.message) && payload.message.length > 0) {
      return payload.message.join(', ')
    }
    if (typeof payload.error === 'string' && payload.error) return payload.error
  } catch {
    // ignore JSON parse failures
  }

  if (response.status === 401 || response.status === 403) {
    return 'Authentication error. Please log in again.'
  }
  if (response.status >= 500) {
    return 'Server error. Please try again later.'
  }
  return response.statusText || 'Request failed'
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    signal,
    auth = true,
    showErrorToast = false,
  } = options

  const url = appendParams(resolveUrl(path, options), params)
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const token = typeof auth === 'string' ? auth : auth ? readAuthToken() : null
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const requestId = getRequestId()
  if (!requestHeaders.has('X-Request-Id')) {
    requestHeaders.set('X-Request-Id', requestId)
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })

    const responseRequestId = response.headers.get('X-Request-Id')
    if (responseRequestId && typeof window !== 'undefined') {
      sessionStorage.setItem('x-request-id', responseRequestId)
    }

    if (!response.ok) {
      const message = await parseErrorMessage(response)
      const failure: ApiResult<T> = {
        ok: false,
        status: response.status,
        error: {
          message,
          status: response.status,
          code: String(response.status),
        },
      }
      if (showErrorToast) {
        useToastStore.getState().showToast(message, 'error')
      }
      return failure
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T, status: 204 }
    }

    const data = (await response.json()) as T
    return { ok: true, data, status: response.status }
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    const message =
      error instanceof Error ? error.message : 'Network error. Please check your connection.'
    if (showErrorToast) {
      useToastStore.getState().showToast(message, 'error')
    }
    return {
      ok: false,
      status: 0,
      error: { message, status: 0, code: 'NETWORK' },
    }
  }
}

export async function apiRequestOrThrow<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const result = await apiRequest<T>(path, options)
  if (!result.ok) {
    throw new ApiRequestError(result.error)
  }
  return result.data
}

const toRequestOptions = (
  method: ApiRequestOptions['method'],
  config?: AxiosLikeConfig,
  extra?: Partial<ApiRequestOptions>,
): ApiRequestOptions => ({
  method,
  headers: config?.headers,
  params: config?.params,
  signal: config?.signal,
  ...extra,
})

export const api = {
  request: apiRequest,
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

const apiClient = {
  get: async <T>(url: string, config?: AxiosLikeConfig) => {
    const data = await apiRequestOrThrow<T>(url, toRequestOptions('GET', config, { showErrorToast: true }))
    return { data }
  },
  post: async <T>(url: string, body?: unknown, config?: AxiosLikeConfig) => {
    const data = await apiRequestOrThrow<T>(
      url,
      toRequestOptions('POST', config, { body, showErrorToast: true }),
    )
    return { data }
  },
  put: async <T>(url: string, body?: unknown, config?: AxiosLikeConfig) => {
    const data = await apiRequestOrThrow<T>(
      url,
      toRequestOptions('PUT', config, { body, showErrorToast: true }),
    )
    return { data }
  },
  patch: async <T>(url: string, body?: unknown, config?: AxiosLikeConfig) => {
    const data = await apiRequestOrThrow<T>(
      url,
      toRequestOptions('PATCH', config, { body, showErrorToast: true }),
    )
    return { data }
  },
  delete: async <T>(url: string, config?: AxiosLikeConfig) => {
    const data = await apiRequestOrThrow<T>(url, toRequestOptions('DELETE', config, { showErrorToast: true }))
    return { data }
  },
}

export default apiClient
