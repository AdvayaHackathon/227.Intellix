import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Place {
  id: string;
  name: string;
  type: string;
  rating: number;
  description: string;
  imageUrl: string;
  price_level?: number;
  vicinity?: string;
}

interface ExploreResponse {
  destination: {
    name: string;
    location: {
      lat: number;
      lng: number;
    };
  };
  attractions: Place[];
  averageCost: string;
}

const LocationExplorer: React.FC = () => {
  const [location, setLocation] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [destinationInfo, setDestinationInfo] = useState<string>('');
  const [costLevel, setCostLevel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // API URL - uses the server URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Mock data for popular destinations as fallback
  const mockPlacesData: Record<string, Place[]> = {
    paris: [
      {
        id: '1',
        name: 'Eiffel Tower',
        type: 'Landmark',
        rating: 4.7,
        description: 'Iconic iron tower offering views from various levels, including the summit. Entry costs around €17-26 per adult.',
        imageUrl: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 3,
        vicinity: 'Champ de Mars, 5 Avenue Anatole France, Paris'
      },
      {
        id: '2',
        name: 'Louvre Museum',
        type: 'Museum',
        rating: 4.8,
        description: 'World-famous art museum housing Leonardo da Vinci\'s Mona Lisa. Entry costs around €15-17 per adult.',
        imageUrl: 'https://images.unsplash.com/photo-1565788068403-947fb786fdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 2,
        vicinity: 'Rue de Rivoli, Paris'
      }
    ],
    tokyo: [
      {
        id: '1',
        name: 'Tokyo Skytree',
        type: 'Landmark',
        rating: 4.5,
        description: 'Tall broadcasting and observation tower. Admission costs around ¥2,100-3,400 (US$15-25) per adult.',
        imageUrl: 'https://images.unsplash.com/photo-1558086798-4805dc8df2ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 3,
        vicinity: '1 Chome-1-2 Oshiage, Sumida City, Tokyo'
      },
      {
        id: '2',
        name: 'Senso-ji Temple',
        type: 'Religious Site',
        rating: 4.6,
        description: 'Ancient Buddhist temple with a five-story pagoda. Free entrance, with shopping street nearby.',
        imageUrl: 'https://images.unsplash.com/photo-1578321626705-c90de8a69c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 0,
        vicinity: '2 Chome-3-1 Asakusa, Taito City, Tokyo'
      }
    ],
    newyork: [
      {
        id: '1',
        name: 'Empire State Building',
        type: 'Landmark',
        rating: 4.7,
        description: 'Iconic 102-story skyscraper with observation decks. Entry costs around $42-79 per adult.',
        imageUrl: 'https://images.unsplash.com/photo-1546436836-07a91091f160?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 4,
        vicinity: '20 W 34th St, New York, NY'
      },
      {
        id: '2',
        name: 'Central Park',
        type: 'Park',
        rating: 4.8,
        description: 'Massive urban park with walking paths, lakes, and attractions. Free to visit, with some paid activities inside.',
        imageUrl: 'https://images.unsplash.com/photo-1570168324251-52424a29c10e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 0,
        vicinity: 'Central Park, New York, NY'
      }
    ]
  };

  const fetchPlacesData = async (locationName: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Call our backend API to fetch tourist attractions
      const response = await axios.get<ExploreResponse>(`${API_URL}/places/tourist-attractions`, {
        params: {
          destination: locationName,
          limit: 12
        }
      });
      
      if (response.data && response.data.attractions) {
        setPlaces(response.data.attractions);
        setDestinationInfo(response.data.destination.name);
        setCostLevel(response.data.averageCost);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to fetch places. Using sample data instead.');
      
      // Fallback to sample data
      generateFallbackData(locationName);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback data if the API fails
  const generateFallbackData = (locationName: string) => {
    const normalizedLocation = locationName.toLowerCase().replace(/\s+/g, '');
    
    if (mockPlacesData[normalizedLocation]) {
      setPlaces(mockPlacesData[normalizedLocation]);
    } else {
      // Generate places for any location not in mock data
      setPlaces([
        {
          id: '1',
          name: `${locationName} Historic Center`,
          type: 'Landmark',
          rating: 4.3,
          description: `The central historic district of ${locationName}, featuring local shopping and dining. Estimated cost: Free to explore, attractions vary.`,
          imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          price_level: 2,
          vicinity: `Central ${locationName}`
        },
        {
          id: '2',
          name: `${locationName} National Museum`,
          type: 'Museum',
          rating: 4.2,
          description: `Cultural museum showcasing the history and traditions of ${locationName}. Estimated entry fee: $10-15 per adult.`,
          imageUrl: 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          price_level: 1,
          vicinity: `Museum District, ${locationName}`
        },
        {
          id: '3',
          name: `${locationName} Nature Park`,
          type: 'Park',
          rating: 4.4,
          description: `Beautiful natural area with walking trails and scenic views near ${locationName}. Estimated cost: Free or minimal entrance fee.`,
          imageUrl: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          price_level: 0,
          vicinity: `Northern ${locationName}`
        }
      ]);
    }
    
    // Set fallback cost level and destination info
    setCostLevel('Moderate');
    setDestinationInfo(locationName);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) return;
    
    fetchPlacesData(location);
  };

  // Format price level into dollar signs
  const formatPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return 'Not available';
    
    switch(priceLevel) {
      case 0: return 'Free';
      case 1: return '$';
      case 2: return '$$';
      case 3: return '$$$';
      case 4: return '$$$$';
      default: return 'Not available';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Explore Places</h2>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter a location (e.g., Paris, Tokyo, New York)"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Explore'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isLoading && places.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Tourist Attractions in {destinationInfo || location}
          </h3>
          
          {costLevel && (
            <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
              <span className="font-medium">Estimated Cost Level:</span> {costLevel}
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${place.imageUrl})` }}
                ></div>
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{place.name}</h4>
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">{place.type}</span>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{place.rating}</span>
                    </div>
                  </div>
                  {place.vicinity && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      <span className="font-medium">Location:</span> {place.vicinity}
                    </div>
                  )}
                  {place.price_level !== undefined && (
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Price: <span className="text-green-600 dark:text-green-400">{formatPriceLevel(place.price_level)}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{place.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !places.length && location && (
        <p className="text-center text-gray-500 dark:text-gray-400 my-8">
          No places found. Try another location.
        </p>
      )}

      {!location && !places.length && (
        <div className="flex flex-col items-center justify-center my-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Enter a location to discover amazing places to visit
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button 
              onClick={() => setLocation('Paris')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            >
              Paris
            </button>
            <button 
              onClick={() => setLocation('Tokyo')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            >
              Tokyo
            </button>
            <button 
              onClick={() => setLocation('New York')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            >
              New York
            </button>
            <button 
              onClick={() => setLocation('London')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
            >
              London
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationExplorer; 