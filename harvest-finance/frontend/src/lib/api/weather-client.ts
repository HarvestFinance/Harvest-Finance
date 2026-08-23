import { apiRequestOrThrow } from './client'
import type { WeatherSummary } from '@/types/weather'

type WeatherLookupParams = {
  token?: string | null
  latitude?: number
  longitude?: number
  location?: string
  signal?: AbortSignal
}

export async function getWeatherSummary(
  params: WeatherLookupParams,
): Promise<WeatherSummary> {
  const { token, latitude, longitude, location, signal } = params

  return apiRequestOrThrow<WeatherSummary>('/farm-intelligence/weather', {
    method: 'GET',
    target: 'backend',
    params: { latitude, longitude, location },
    auth: token ?? true,
    signal,
  })
}
