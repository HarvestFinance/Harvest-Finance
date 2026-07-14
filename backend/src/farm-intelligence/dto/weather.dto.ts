export type WeatherAlertSeverity = 'info' | 'warning' | 'critical';

export interface WeatherLocationDto {
  name: string;
  region: string | null;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeatherDto {
  temperatureC: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKph: number;
  condition: string;
  icon: string;
  observedAt: string;
}

export interface ForecastDayDto {
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

export interface WeatherAlertDto {
  title: string;
  message: string;
  severity: WeatherAlertSeverity;
}

export interface WeatherSummaryDto {
  location: WeatherLocationDto;
  current: CurrentWeatherDto;
  forecast: ForecastDayDto[];
  alerts: WeatherAlertDto[];
  seasonalOutlook: string;
  recommendation: string;
  source: string;
}
