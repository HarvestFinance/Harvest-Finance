import { NextRequest, NextResponse } from 'next/server';
import type { WeatherSummary, WeatherAlert, ForecastDay } from '@/types/weather';

const locations: Record<string, { name: string; region: string | null; country: string; latitude: number; longitude: number; timezone: string }> = {
  'Kaduna, Nigeria': { name: 'Kaduna', region: 'Kaduna State', country: 'Nigeria', latitude: 10.5248, longitude: 7.8278, timezone: 'Africa/Lagos' },
  'Lagos, Nigeria': { name: 'Lagos', region: 'Lagos State', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  'Abuja, Nigeria': { name: 'Abuja', region: 'Federal Capital Territory', country: 'Nigeria', latitude: 9.0765, longitude: 7.3950, timezone: 'Africa/Lagos' },
};

function generateWeatherSummary(locationName: string): WeatherSummary {
  const loc = locations[locationName] || locations['Kaduna, Nigeria'];
  const now = new Date();

  const alerts: WeatherAlert[] = [];

  if (Math.random() > 0.7) {
    alerts.push({
      title: 'Heavy Rainfall Expected',
      message: 'Significant rainfall expected in the next 24 hours. Consider securing outdoor equipment.',
      severity: 'warning',
    });
  }

  if (Math.random() > 0.85) {
    alerts.push({
      title: 'Heat Advisory',
      message: 'Temperatures will reach critical levels. Irrigation systems should be monitored.',
      severity: 'info',
    });
  }

  const forecast: ForecastDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayLabel = dayLabels[date.getDay()];

    forecast.push({
      date: date.toISOString().split('T')[0],
      dayLabel: i === 0 ? 'Today' : dayLabel,
      minTempC: Math.floor(18 + Math.random() * 6),
      maxTempC: Math.floor(28 + Math.random() * 8),
      rainfallMm: Number((Math.random() * 15).toFixed(1)),
      windSpeedKph: Math.floor(5 + Math.random() * 15),
      precipitationChance: Math.floor(Math.random() * 100),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain Showers'][Math.floor(Math.random() * 5)],
      icon: 'cloud-sun',
    });
  }

  const seasonalOutlook = "Current seasonal conditions are favorable for planting. Rainfall patterns suggest good soil moisture through the next two weeks. Consider planting drought-resistant varieties as a contingency.";
  const recommendation = "Maintain current irrigation schedule. Monitor field conditions daily and adjust based on actual rainfall measurements.";

  const weatherTypes = ['sunny', 'cloudy', 'cloud-rain', 'cloud-lightning', 'cloud-snow'];
  const currentIcon = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

  return {
    location: {
      name: loc.name,
      region: loc.region,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
      timezone: loc.timezone,
    },
    current: {
      temperatureC: Math.floor(22 + Math.random() * 10),
      humidity: Math.floor(45 + Math.random() * 30),
      rainfallMm: Number((Math.random() * 5).toFixed(1)),
      windSpeedKph: Math.floor(5 + Math.random() * 10),
      condition: ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      icon: currentIcon,
      observedAt: now.toISOString(),
    },
    forecast,
    alerts,
    seasonalOutlook,
    recommendation,
    source: 'Harvest Finance Weather Service (Simulated)',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'Kaduna, Nigeria';

  const summary = generateWeatherSummary(location);

  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
