import { apiRequestOrThrow } from './client'
import type {
  SeasonalTipsResponse,
  TipsQueryParams,
  SeasonalTip,
} from './seasonal-tips'

export async function fetchSeasonalTips(
  params: TipsQueryParams = {},
  signal?: AbortSignal,
): Promise<SeasonalTipsResponse> {
  return apiRequestOrThrow<SeasonalTipsResponse>('/api/v1/seasonal-tips', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
    signal,
  })
}

export async function fetchSeasonalTipById(
  id: string,
  signal?: AbortSignal,
): Promise<SeasonalTip> {
  return apiRequestOrThrow<SeasonalTip>(`/api/v1/seasonal-tips/${id}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchTipsByMilestone(
  milestone: string,
  cropType?: string,
  season?: string,
  signal?: AbortSignal,
): Promise<SeasonalTip[]> {
  return apiRequestOrThrow<SeasonalTip[]>(
    `/api/v1/seasonal-tips/milestone/${milestone}`,
    { method: 'GET', params: { cropType, season }, signal },
  )
}

export async function fetchAvailableCropTypes(signal?: AbortSignal): Promise<string[]> {
  return apiRequestOrThrow<string[]>('/api/v1/seasonal-tips/crop-types', {
    method: 'GET',
    signal,
  })
}

export async function fetchAvailableSeasons(signal?: AbortSignal): Promise<string[]> {
  return apiRequestOrThrow<string[]>('/api/v1/seasonal-tips/seasons', {
    method: 'GET',
    signal,
  })
}
