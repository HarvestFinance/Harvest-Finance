import axios from '@/lib/api-client';
import type {
  SeasonalTipsResponse,
  TipsQueryParams,
  SeasonalTip,
} from './seasonal-tips';

// Use relative base so API calls resolve to the same origin (avoids CORS/port mismatches)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export async function fetchSeasonalTips(
  params: TipsQueryParams = {},
): Promise<SeasonalTipsResponse> {
  const { data } = await apiClient.get<SeasonalTipsResponse>(
    '/api/v1/seasonal-tips',
    { params },
  );
  return data;
}

export async function fetchSeasonalTipById(id: string): Promise<SeasonalTip> {
  const { data } = await apiClient.get<SeasonalTip>(
    `/api/v1/seasonal-tips/${id}`,
  );
  return data;
}

export async function fetchTipsByMilestone(
  milestone: string,
  cropType?: string,
  season?: string,
): Promise<SeasonalTip[]> {
  const { data } = await apiClient.get<SeasonalTip[]>(
    `/api/v1/seasonal-tips/milestone/${milestone}`,
    { params: { cropType, season } },
  );
  return data;
}

export async function fetchAvailableCropTypes(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>(
    '/api/v1/seasonal-tips/crop-types',
  );
  return data;
}

export async function fetchAvailableSeasons(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>(
    '/api/v1/seasonal-tips/seasons',
  );
  return data;
}
