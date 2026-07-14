export type WeatherAlertSeverity = 'info' | 'warning' | 'critical';

export interface WeatherLocation {
  name: string;
  region: string | null;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperatureC: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKph: number;
  condition: string;
  icon: string;
  observedAt: string;
}

export interface ForecastDay {
  date: string;
  dayLabel: string;
  minTempC: number;
  maxTempC: number;
  rainfallMm: number;
  windSpeedKph: number;
  precipitationChance: number;
  condition: string;
  icon: string;
}

export interface WeatherAlert {
  title: string;
  message: string;
  severity: WeatherAlertSeverity;
}

export interface WeatherSummary {
  location: WeatherLocation;
  current: CurrentWeather;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  seasonalOutlook: string;
  recommendation: string;
  source: string;
}
