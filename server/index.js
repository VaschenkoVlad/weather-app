require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

// Helper function to convert weather codes to descriptions
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Drizzle light',
    53: 'Drizzle moderate',
    55: 'Drizzle dense',
    56: 'Freezing Drizzle light',
    57: 'Freezing Drizzle dense',
    61: 'Rain slight',
    63: 'Rain moderate',
    65: 'Rain heavy',
    66: 'Freezing Rain light',
    67: 'Freezing Rain heavy',
    71: 'Snow fall slight',
    73: 'Snow fall moderate',
    75: 'Snow fall heavy',
    77: 'Snow grains',
    80: 'Rain showers slight',
    81: 'Rain showers moderate',
    82: 'Rain showers violent',
    85: 'Snow showers slight',
    86: 'Snow showers heavy',
    95: 'Thunderstorm slight',
    96: 'Thunderstorm moderate',
    99: 'Thunderstorm with hail'
  };
  return weatherCodes[code] || 'Unknown';
}

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.STORMGLASS_API_KEY;

if (!API_KEY) {
  console.error('WARNING: STORMGLASS_API_KEY is not set. Server will run but API calls will fail.');
  // Continue running for testing purposes
}

// Simple weather proxy
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  const lat = req.query.lat;
  const lon = req.query.lon;

  try {
    let resolvedLat = lat;
    let resolvedLon = lon;
    let resolvedCity = city;

    // If city provided but not lat/lon, use geocoding to get coordinates
    if (city && (!lat || !lon)) {
      const geoRes = await fetch(
        `https://api.stormglass.io/v2/search/?query=${encodeURIComponent(city)}`
      );
      if (!geoRes.ok) {
        const text = await geoRes.text().catch(() => '');
        console.error('Geocoding error:', geoRes.status, text);
        return res.status(502).json({ error: 'Geocoding service error' });
      }
      const geo = await geoRes.json().catch(() => null);
      if (!geo.data || geo.data.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      resolvedLat = geo.data[0].lat;
      resolvedLon = geo.data[0].lon;
      resolvedCity = geo.data[0].name;
    }

    if ((!resolvedLat || !resolvedLon) && (!lat || !lon)) {
      return res.status(400).json({ error: 'Missing city or coordinates' });
    }

    // Call StormGlass API to get current + daily forecast
    const weatherUrl = `https://api.stormglass.io/v2/weather/point?lat=${resolvedLat}&lng=${resolvedLon}&params=airTemperature,humidity,pressure,windSpeed,cloudCover,precipitation&source=sg`;
    const weatherRes = await fetch(weatherUrl, {
      headers: {
        'Authorization': API_KEY
      }
    });
    
    if (!weatherRes.ok) {
      const text = await weatherRes.text().catch(() => '');
      console.error('StormGlass API error:', weatherRes.status, text);
      return res.status(weatherRes.status).json({ error: 'Weather service error' });
    }
    
    const weather = await weatherRes.json();
    
    if (!weather.hours || weather.hours.length === 0) {
      return res.status(404).json({ error: 'No weather data available' });
    }

    const current = weather.hours[0];
    const daily = weather.hours.slice(0, 7).map((h, index) => ({
      dt: Math.floor(Date.now() / 1000) + (index * 24 * 3600),
      temp: h.airTemperature?.sg || 0,
      weather: { description: getWeatherDescription(h.weatherCode?.sg) }
    }));

    res.json({
      city: resolvedCity,
      temperature: current.airTemperature?.sg || 0,
      description: current.precipitation?.sg > 0 ? 'Rain' : 'Clear',
      icon: null, // StormGlass doesn't provide icons
      wind: current.windSpeed?.sg || 0,
      humidity: current.humidity?.sg || 0,
      pressure: current.pressure?.sg || 0,
      uvi: 0, // UV Index not available in StormGlass free tier
      daily,
    });
  } catch (err) {
    console.error('Weather fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Listen on all interfaces so the server is reachable from other devices
// (e.g. your phone running Expo Go). When testing from a phone, set
// the client to use your machine's LAN IP (e.g. http://192.168.x.x:3000).
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
