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
  const city = req.query.city || 'Kyiv';
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    if (data.cod && data.cod !== 200) {
      return res.status(data.cod).json({ error: data.message });
    }

    res.json({
      city: data.name,
      temperature: data.main?.temp,
      description: data.weather?.[0]?.description,
      icon: data.weather?.[0]?.icon ? `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` : null,
    });
  } catch (err) {
    console.error('Weather fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
