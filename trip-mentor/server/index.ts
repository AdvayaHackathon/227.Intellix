import express from 'express';
import cors from 'cors';
import { config } from './config';
import { placesRouter } from './routes/places';
import { weatherRouter } from './routes/weather';
import { mentorRouter } from './routes/mentor';
import { itineraryRouter } from './routes/itinerary';

const app = express();

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());

// Routes
app.use('/api/places', placesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/itinerary', itineraryRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
}); 