import express from 'express';
import { Client, Language } from '@googlemaps/google-maps-services-js';
import { config } from '../config';

const router = express.Router();
const client = new Client({});

// Check if API key is available
if (!config.googleMapsApiKey) {
  console.error('Google Maps API key is not defined in environment variables');
}

router.get('/nearby', async (req, res) => {
  try {
    const { location, radius = 5000 } = req.query;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    if (!config.googleMapsApiKey) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const response = await client.placesNearby({
      params: {
        location: location as string,
        radius: Number(radius),
        type: 'tourist_attraction',
        key: config.googleMapsApiKey as string,
      },
    });

    const places = response.data.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating || 0,
      cost: place.price_level ? (place.price_level * 500) : 0, // Simple heuristic for cost
      description: place.vicinity,
      location: place.geometry?.location,
    }));

    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

/**
 * Search for tourist attractions by destination name
 * This endpoint geocodes the destination name to coordinates 
 * and then finds tourist attractions nearby
 */
router.get('/tourist-attractions', async (req, res) => {
  try {
    const { destination, radius = 5000, limit = 8 } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    if (!config.googleMapsApiKey) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    // First geocode the destination to get coordinates
    const geocodeResponse = await client.geocode({
      params: {
        address: destination as string,
        key: config.googleMapsApiKey as string
      }
    });

    if (geocodeResponse.data.status !== 'OK' || geocodeResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'Could not find the specified destination' });
    }

    const location = geocodeResponse.data.results[0].geometry.location;
    const formattedLocation = `${location.lat},${location.lng}`;

    // Now search for tourist attractions near the coordinates
    const placesResponse = await client.placesNearby({
      params: {
        location: formattedLocation,
        radius: Number(radius),
        type: 'tourist_attraction',
        language: 'en' as Language,
        key: config.googleMapsApiKey as string,
      },
    });

    if (placesResponse.data.status !== 'OK') {
      return res.status(404).json({ 
        error: 'No tourist attractions found', 
        status: placesResponse.data.status
      });
    }

    // Format the response with detailed information
    const attractions = placesResponse.data.results
      .slice(0, Number(limit))
      .map((place) => ({
        id: place.place_id,
        name: place.name,
        type: place.types?.[0]?.replace(/_/g, ' ') || 'tourist attraction',
        rating: place.rating || 4.0,
        price_level: place.price_level || Math.floor(Math.random() * 3) + 1, // Fallback with random 1-3 if not available
        vicinity: place.vicinity,
        description: `Popular tourist attraction in ${destination}. ${place.vicinity || ''}`,
        location: place.geometry?.location,
        imageUrl: place.photos && place.photos[0] 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${config.googleMapsApiKey as string}`
          : `https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80`,
      }));

    // Add the destination information to the response
    const responseData = {
      destination: {
        name: geocodeResponse.data.results[0].formatted_address,
        location: location,
      },
      attractions: attractions,
      averageCost: calculateAverageCost(attractions)
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching tourist attractions:', error);
    res.status(500).json({ error: 'Failed to fetch tourist attractions' });
  }
});

/**
 * Calculate the average cost level for attractions
 */
function calculateAverageCost(attractions: any[]): string {
  const validPriceLevels = attractions
    .filter(place => place.price_level !== undefined)
    .map(place => place.price_level);
  
  if (validPriceLevels.length === 0) {
    return 'Cost information not available';
  }
  
  const avgPriceLevel = validPriceLevels.reduce((sum, level) => sum + level, 0) / validPriceLevels.length;
  
  if (avgPriceLevel < 0.75) return 'Budget-friendly';
  if (avgPriceLevel < 1.75) return 'Affordable';
  if (avgPriceLevel < 2.75) return 'Moderate';
  if (avgPriceLevel < 3.75) return 'Expensive';
  return 'Very Expensive';
}

export const placesRouter = router; 