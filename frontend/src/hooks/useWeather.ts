'use client';

import { useCallback, useEffect, useState } from 'react';
import { getWeatherSummary } from '@/lib/api/weather-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { WeatherSummary } from '@/types/weather';

type WeatherRequest =
  | { latitude: number; longitude: number; location?: never }
  | { location: string; latitude?: never; longitude?: never };

const FALLBACK_LOCATION = 'Kaduna, Nigeria';

export function useWeather() {
  const token = useAuthStore((state) => state.token);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [data, setData] = useState<WeatherSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loadWeather = useCallback(
    async (request?: WeatherRequest) => {
      setIsLoading(true);
      setError(null);

      try {
        const summary = await getWeatherSummary({
          token,
          latitude: request && 'latitude' in request ? request.latitude : undefined,
          longitude: request && 'longitude' in request ? request.longitude : undefined,
          location: request && 'location' in request ? request.location : undefined,
        });
        setData(summary);
      } catch {
        setError('Weather data is unavailable right now. Try again shortly.');
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      void loadWeather({ location: FALLBACK_LOCATION });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        void loadWeather({ location: FALLBACK_LOCATION });
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 1000 * 60 * 10,
      },
    );
  }, [loadWeather]);

  const refresh = useCallback(() => {
    if (data) {
      return loadWeather({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
    }

    return loadWeather({ location: FALLBACK_LOCATION });
  }, [data, loadWeather]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}
