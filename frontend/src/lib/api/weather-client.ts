import axios from 'axios';
import type { WeatherSummary } from '@/types/weather';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type WeatherLookupParams = {
  token?: string | null;
  latitude?: number;
  longitude?: number;
  location?: string;
};

export async function getWeatherSummary(
  params: WeatherLookupParams,
): Promise<WeatherSummary> {
  const { token, latitude, longitude, location } = params;

  const response = await axios.get<WeatherSummary>(
    `${API_BASE_URL}/farm-intelligence/weather`,
    {
      params: {
        latitude,
        longitude,
        location,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}
