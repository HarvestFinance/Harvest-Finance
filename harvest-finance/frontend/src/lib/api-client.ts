import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useToastStore } from '../store/useToastStore';

// ── Exponential back-off for 429 Too Many Requests ───────────────────────────

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

/**
 * Pause for `ms` milliseconds.
 */
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Return the delay for the nth retry attempt using full-jitter exponential
 * back-off, capped at 30 seconds.
 *   delay = random(0, min(cap, base * 2^n))
 */
function backoffDelay(attempt: number): number {
  const cap = 30_000;
  const ceiling = Math.min(cap, BASE_DELAY_MS * Math.pow(2, attempt));
  return Math.floor(Math.random() * ceiling);
}

// ── Axios instance ────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  // baseURL can be set via NEXT_PUBLIC_API_URL or left empty for relative paths.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30_000,
});

// ── Request interceptor: attach auth token ────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  // Attach JWT from localStorage if available (client-side only).
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: error handling + 429 retry ─────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    // ── 429 Too Many Requests – retry with exponential back-off ──────────────
    if (error.response?.status === 429) {
      config._retryCount = (config._retryCount ?? 0) + 1;

      if (config._retryCount <= MAX_RETRIES) {
        // Honour Retry-After header if the server sends one.
        const retryAfterHeader = error.response.headers?.['retry-after'];
        const delayMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : backoffDelay(config._retryCount);

        await sleep(delayMs);
        return apiClient(config);
      }
    }

    // ── Generic error handling ────────────────────────────────────────────────
    let errorMessage = 'An unexpected error occurred.';

    if (error.response) {
      if (typeof error.response.data?.message === 'string') {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response.data?.message)) {
        errorMessage = error.response.data.message.join(', ');
      } else if (error.response.status === 429) {
        errorMessage = 'Too many requests. Please slow down and try again.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (
        error.response.status === 401 ||
        error.response.status === 403
      ) {
        errorMessage = 'Authentication error. Please log in again.';
      } else {
        errorMessage = error.message;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // Trigger toast notification.
    useToastStore.getState().showToast(errorMessage, 'error');

    return Promise.reject(error);
  },
);

export default apiClient;
