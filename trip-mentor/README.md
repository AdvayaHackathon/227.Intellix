# TripMentor - AI-Powered Travel Planner

TripMentor is a dynamic AI-powered travel planner web application that helps users find tourist spots near a selected location, suggests places based on budget, weather, and language spoken, and provides a chatbot travel mentor to guide users in real-time.

## Features

- 🗺️ Find nearby tourist spots using Google Places API
- 💰 Budget-based place recommendations
- 🌤️ Real-time weather information
- 💬 AI-powered travel mentor chatbot
- 🌙 Dark mode support
- 📱 Responsive design
- ✨ Smooth animations

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS
- Framer Motion
- Axios
- React Router DOM

### Backend
- Node.js + Express.js
- Google Maps API
- OpenWeather API
- Gemini AI API

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trip-mentor.git
cd trip-mentor
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```
PORT=5000
CLIENT_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development servers:
```bash
# Start frontend (from root directory)
npm start

# Start backend (from server directory)
npm run dev
```

5. Open your browser and visit `http://localhost:3000`

## API Keys Required

- Google Maps API Key (for Places and Maps services)
- OpenWeather API Key
- Gemini AI API Key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
