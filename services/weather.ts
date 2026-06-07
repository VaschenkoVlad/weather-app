import { API_KEY, STORMGLASS_BASE, NOMINATIM_BASE } from '../constants/config';

export interface StormglassHour {
  time: string;
  airTemperature?: { sg?: number; noaa?: number; ecmwf?: number };
  cloudCover?: { sg?: number; noaa?: number };
  humidity?: { sg?: number; noaa?: number };
  precipitation?: { sg?: number; noaa?: number; ecmwf?: number };
  windSpeed?: { sg?: number; noaa?: number; ecmwf?: number };
  windDirection?: { sg?: number; noaa?: number; ecmwf?: number };
  pressure?: { sg?: number; noaa?: number };
  visibility?: { sg?: number; noaa?: number };
}

export interface StormglassResponse {
  hours: StormglassHour[];
  meta?: { cost: number };
}

export interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
}

export interface GeoAddress {
  city?: string;
  town?: string;
  village?: string;
  country?: string;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  pressure: number;
  visibility: number;
  condition: string;
  conditionIcon: string;
}

export interface DailyForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
}

export interface HourlyForecast {
  hour: string;
  temp: number;
  condition: string;
}

export interface WeatherData {
  city: string;
  country: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

function getCondition(cloudCover: number, precipitation: number, humidity: number): string {
  if (precipitation > 0.5) return 'Rainy';
  if (cloudCover > 80) return 'Cloudy';
  if (cloudCover > 50) return 'Partly cloudy';
  if (humidity > 80) return 'Misty';
  return 'Sunny';
}

function getConditionIcon(condition: string): string {
  switch (condition) {
    case 'Sunny': return '☀️';
    case 'Partly cloudy': return '⛅';
    case 'Cloudy': return '☁️';
    case 'Rainy': return '🌧️';
    case 'Misty': return '🌫️';
    default: return '🌤️';
  }
}

export async function fetchWeather(lat: number, lng: number): Promise<StormglassResponse> {
  const params = [
    'airTemperature', 'cloudCover', 'humidity',
    'precipitation', 'windSpeed', 'windDirection',
    'pressure', 'visibility',
  ].join(',');

  const url = `${STORMGLASS_BASE}/weather/point` +
    `?lat=${lat}&lng=${lng}&params=${params}`;

  const res = await fetch(url, {
    headers: { Authorization: API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Stormglass error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  const url = `${NOMINATIM_BASE}/reverse` +
    `?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'weather-app/1.0' },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.address ?? null;
}

export async function geocodeCity(query: string): Promise<GeoResult[]> {
  const url = `${NOMINATIM_BASE}/search` +
    `?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'weather-app/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`);
  }

  return res.json();
}

export function buildWeatherData(
  raw: StormglassResponse,
  city: string,
  country: string,
): WeatherData {
  const hours = raw.hours;

  if (hours.length === 0) {
    return {
      city,
      country,
      current: {
        temperature: 0, humidity: 0, cloudCover: 0,
        windSpeed: 0, windDirection: 0, precipitation: 0,
        pressure: 0, visibility: 0,
        condition: 'No data', conditionIcon: '❓',
      },
      hourly: [],
      daily: [],
    };
  }

  const now = hours[0];
  const curr: CurrentWeather = {
    temperature: Math.round(now.airTemperature?.sg ?? now.airTemperature?.noaa ?? 0),
    humidity: Math.round(now.humidity?.sg ?? now.humidity?.noaa ?? 0),
    cloudCover: Math.round(now.cloudCover?.sg ?? now.cloudCover?.noaa ?? 0),
    windSpeed: Math.round((now.windSpeed?.sg ?? now.windSpeed?.noaa ?? 0) * 3.6),
    windDirection: Math.round(now.windDirection?.sg ?? now.windDirection?.noaa ?? 0),
    precipitation: now.precipitation?.sg ?? now.precipitation?.noaa ?? 0,
    pressure: Math.round(now.pressure?.sg ?? now.pressure?.noaa ?? 0),
    visibility: Math.round(now.visibility?.sg ?? now.visibility?.noaa ?? 0),
    condition: getCondition(
      now.cloudCover?.sg ?? now.cloudCover?.noaa ?? 0,
      now.precipitation?.sg ?? now.precipitation?.noaa ?? 0,
      now.humidity?.sg ?? now.humidity?.noaa ?? 0,
    ),
    conditionIcon: '☀️',
  };
  curr.conditionIcon = getConditionIcon(curr.condition);

  const hourly: HourlyForecast[] = hours.slice(0, 24).map((h) => {
    const temp = Math.round(h.airTemperature?.sg ?? h.airTemperature?.noaa ?? 0);
    const date = new Date(h.time);
    const hourStr = `${date.getHours()}:00`;
    return {
      hour: hourStr,
      temp,
      condition: getConditionIcon(getCondition(
        h.cloudCover?.sg ?? h.cloudCover?.noaa ?? 0,
        h.precipitation?.sg ?? h.precipitation?.noaa ?? 0,
        h.humidity?.sg ?? h.humidity?.noaa ?? 0,
      )),
    };
  });

  const dayMap = new Map<string, { temps: number[]; conditions: string[]; date: Date }>();
  for (const h of hours) {
    const d = new Date(h.time);
    const key = d.toISOString().slice(0, 10);
    if (!dayMap.has(key)) {
      dayMap.set(key, { temps: [], conditions: [], date: d });
    }
    const entry = dayMap.get(key)!;
    entry.temps.push(h.airTemperature?.sg ?? h.airTemperature?.noaa ?? 0);
    entry.conditions.push(getCondition(
      h.cloudCover?.sg ?? h.cloudCover?.noaa ?? 0,
      h.precipitation?.sg ?? h.precipitation?.noaa ?? 0,
      h.humidity?.sg ?? h.humidity?.noaa ?? 0,
    ));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily: DailyForecast[] = [];
  for (const [, v] of dayMap) {
    const max = Math.round(Math.max(...v.temps));
    const min = Math.round(Math.min(...v.temps));
    const mostCommon = v.conditions.sort((a, b) =>
      v.conditions.filter((c) => c === a).length -
      v.conditions.filter((c) => c === b).length,
    ).pop() ?? 'Sunny';

    const month = v.date.getMonth() + 1;
    const day = v.date.getDate();
    daily.push({
      day: dayNames[v.date.getDay()],
      date: `${day} ${month}`,
      tempMax: max,
      tempMin: min,
      condition: getConditionIcon(mostCommon),
    });
  }

  return { city, country, current: curr, hourly, daily };
}
