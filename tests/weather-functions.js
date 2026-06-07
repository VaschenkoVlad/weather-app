/**
 * Чисті функції з services/weather.ts, дубльовані для тестування в Node.js середовищі
 * Оригінальний файл використовує TypeScript та ES modules
 */

// Конфігураційні константи
const STORMGLASS_BASE = 'https://api.stormglass.io/v2';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function getCondition(cloudCover, precipitation, humidity) {
  if (precipitation > 0.5) return 'Rainy';
  if (cloudCover > 80) return 'Cloudy';
  if (cloudCover > 50) return 'Partly cloudy';
  if (humidity > 80) return 'Misty';
  return 'Sunny';
}

function getConditionIcon(condition) {
  switch (condition) {
    case 'Sunny': return '☀️';
    case 'Partly cloudy': return '⛅';
    case 'Cloudy': return '☁️';
    case 'Rainy': return '🌧️';
    case 'Misty': return '🌫️';
    default: return '🌤️';
  }
}

function buildWeatherData(raw, city, country) {
  const hours = raw.hours;
  if (hours.length === 0) {
    return {
      city, country,
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
  const curr = {
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

  const hourly = hours.slice(0, 24).map((h) => {
    const temp = Math.round(h.airTemperature?.sg ?? h.airTemperature?.noaa ?? 0);
    const date = new Date(h.time);
    const hourStr = date.getHours() + ':00';
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

  const dayMap = new Map();
  for (const h of hours) {
    const d = new Date(h.time);
    const key = d.toISOString().slice(0, 10);
    if (!dayMap.has(key)) {
      dayMap.set(key, { temps: [], conditions: [], date: d });
    }
    const entry = dayMap.get(key);
    entry.temps.push(h.airTemperature?.sg ?? h.airTemperature?.noaa ?? 0);
    entry.conditions.push(getCondition(
      h.cloudCover?.sg ?? h.cloudCover?.noaa ?? 0,
      h.precipitation?.sg ?? h.precipitation?.noaa ?? 0,
      h.humidity?.sg ?? h.humidity?.noaa ?? 0,
    ));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily = [];
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
      date: day + ' ' + month,
      tempMax: max,
      tempMin: min,
      condition: getConditionIcon(mostCommon),
    });
  }

  return { city, country, current: curr, hourly, daily };
}

module.exports = {
  getCondition,
  getConditionIcon,
  buildWeatherData,
  STORMGLASS_BASE,
  NOMINATIM_BASE,
};
