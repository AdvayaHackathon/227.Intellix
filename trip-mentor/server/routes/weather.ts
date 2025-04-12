import express from 'express';
import axios from 'axios';
import { config } from '../config';

const router = express.Router();

// Check if API key is available
if (!config.openWeatherApiKey) {
  console.error('OpenWeather API key is not defined in environment variables');
}

router.get('/current', async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    if (!config.openWeatherApiKey) {
      return res.status(500).json({ error: 'OpenWeather API key is not configured' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${config.openWeatherApiKey as string}&units=metric`
    );

    const weatherData = {
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export const weatherRouter = router; 