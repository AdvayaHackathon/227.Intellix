import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  corsOptions: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
}; 