export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiSuccess<T> = {
  ok: true
  data: T
  status: number
}

export type ApiErrorShape = {
  message: string
  status: number
  code?: string
}

export type ApiFailure = {
  ok: false
  error: ApiErrorShape
  status: number
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export class ApiRequestError extends Error {
  status: number
  code?: string

  constructor(error: ApiErrorShape) {
    super(error.message)
    this.name = 'ApiRequestError'
    this.status = error.status
    this.code = error.code
  }
}

export type ApiRequestOptions = {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
  auth?: boolean | string | null
  showErrorToast?: boolean
  target?: 'app' | 'backend'
}

export type AxiosLikeConfig = {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
}
