require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.error('ERROR: OPENWEATHER_API_KEY is not set. Set it in environment or .env file.');
  // Exit so server doesn't run without an API key
  process.exit(1);
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
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
      );
      if (!geoRes.ok) {
        const text = await geoRes.text().catch(() => '');
        console.error('Geocoding error:', geoRes.status, text);
        return res.status(502).json({ error: 'Geocoding service error' });
      }
      const geo = await geoRes.json().catch(() => null);
      if (!Array.isArray(geo) || geo.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      resolvedLat = geo[0].lat;
      resolvedLon = geo[0].lon;
      resolvedCity = geo[0].name;
    }

    if ((!resolvedLat || !resolvedLon) && (!lat || !lon)) {
      return res.status(400).json({ error: 'Missing city or coordinates' });
    }

    // Call One Call API to get current + daily forecast
    const onecallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${resolvedLat}&lon=${resolvedLon}&exclude=minutely&units=metric&appid=${API_KEY}`;
    const onecallRes = await fetch(onecallUrl);
    const onecall = await onecallRes.json();

    if (onecall.cod && onecall.cod !== 200) {
      return res.status(onecall.cod).json({ error: onecall.message });
    }

    const current = onecall.current || {};
    const daily = (onecall.daily || []).slice(0, 7).map((d) => ({
      dt: d.dt,
      temp: d.temp,
      weather: d.weather && d.weather[0] ? d.weather[0] : null,
    }));

    res.json({
      city: resolvedCity,
      temperature: current.temp,
      description: current.weather?.[0]?.description,
      icon: current.weather?.[0]?.icon ? `http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png` : null,
      wind: current.wind_speed,
      humidity: current.humidity,
      pressure: current.pressure,
      uvi: current.uvi,
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
