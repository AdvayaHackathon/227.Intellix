import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LocationExplorer from '../components/LocationExplorer';
import BudgetPlanner from '../components/BudgetPlanner';
import ItineraryPlanner from '../components/ItineraryPlanner';
import axios from 'axios';

interface Place {
  id: string;
  name: string;
  type: string;
  rating: number;
  description: string;
  imageUrl: string;
  price_level?: number;
  vicinity?: string; // Address or vicinity information
}

const TripPlanner: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'explore' | 'budget' | 'itinerary'>('overview');
  const [quickSearchLocation, setQuickSearchLocation] = useState('');
  const [quickSearchPlaces, setQuickSearchPlaces] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [costLevel, setCostLevel] = useState<string>('');
  
  // API URL - uses the server URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Handle the location search using our backend API
  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quickSearchLocation.trim()) return;
    
    setIsSearching(true);
    setErrorMessage('');
    
    try {
      // Call our backend API instead of directly using Google APIs
      const response = await axios.get(`${API_URL}/places/tourist-attractions`, {
        params: {
          destination: quickSearchLocation,
          limit: 8
        }
      });

      // Update state with the response data
      setQuickSearchPlaces(response.data.attractions);
      setCostLevel(response.data.averageCost);
      
    } catch (error) {
      console.error('Error fetching tourist attractions:', error);
      setErrorMessage('Could not fetch tourist attractions. Please try again later.');
      
      // Fallback to sample data if API call fails
      generateFallbackData();
    } finally {
      setIsSearching(false);
    }
  };

  // Generate fallback data if the API call fails
  const generateFallbackData = () => {
    // Generate generic places for the location
    setQuickSearchPlaces([
      {
        id: '1',
        name: `${quickSearchLocation} Historic Center`,
        type: 'Tourist Attraction',
        rating: 4.3,
        description: `The central historic district of ${quickSearchLocation}, featuring local shopping and dining. Estimated cost: Free to explore, attractions vary.`,
        imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 2,
        vicinity: `Central ${quickSearchLocation}`
      },
      {
        id: '2',
        name: `${quickSearchLocation} National Museum`,
        type: 'Museum',
        rating: 4.2,
        description: `Cultural museum showcasing the history and traditions of ${quickSearchLocation}. Estimated entry fee: $10-15 per adult.`,
        imageUrl: 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 2,
        vicinity: `Museum District, ${quickSearchLocation}`
      },
      {
        id: '3',
        name: `${quickSearchLocation} Nature Park`,
        type: 'Park',
        rating: 4.4,
        description: `Beautiful natural area with walking trails and scenic views near ${quickSearchLocation}. Estimated cost: Free or minimal entrance fee.`,
        imageUrl: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 0,
        vicinity: `Northern ${quickSearchLocation}`
      },
      {
        id: '4',
        name: `${quickSearchLocation} Landmark`,
        type: 'Monument',
        rating: 4.5,
        description: `Famous landmark and popular tourist destination in ${quickSearchLocation}. Estimated cost: $5-10 per person for entry.`,
        imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 1,
        vicinity: `Downtown ${quickSearchLocation}`
      }
    ]);

    // Set the fallback cost level
    setCostLevel('Moderate');
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
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Plan Your Trip, {user?.name}
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Overview
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('explore')}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'explore'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Explore Places
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('budget')}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'budget'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Budget Planning
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'itinerary'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Itinerary
              </button>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Welcome to the Trip Planner! This feature will help you organize your travel itinerary.
            </p>
            
            {/* Quick destination search */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tourist Attractions Search</h3>
              <form onSubmit={handleQuickSearch} className="mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={quickSearchLocation}
                    onChange={(e) => setQuickSearchLocation(e.target.value)}
                    placeholder="Enter a destination (e.g., Paris, Tokyo, New York)"
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Find Tourist Attractions'}
                  </button>
                </div>
              </form>
              
              {/* Error message */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
                  <p>{errorMessage}</p>
                </div>
              )}
              
              {/* Quick destination search results */}
              {isSearching && (
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {!isSearching && quickSearchPlaces.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Tourist Attractions in {quickSearchLocation}
                  </h4>
                  <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Estimated Cost Level:</span> {costLevel}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickSearchPlaces.map((place) => (
                      <motion.div
                        key={place.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md"
                      >
                        <div className="flex h-full">
                          <div 
                            className="w-1/3 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${place.imageUrl})` }}
                          ></div>
                          <div className="w-2/3 p-4">
                            <h5 className="text-md font-semibold mb-1 text-gray-900 dark:text-white">{place.name}</h5>
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
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{place.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => setActiveTab('explore')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Explore More Places
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Destination</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Choose your destination and find the best places to visit.
                </p>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Explore Destinations
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Budget Planning</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Plan your budget and track your expenses during the trip.
                </p>
                <button 
                  onClick={() => setActiveTab('budget')} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Budget
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Itinerary</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Create and manage your daily travel plans.
                </p>
                <button 
                  onClick={() => setActiveTab('itinerary')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Plan Itinerary
                </button>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Weather</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Check the weather forecast for your destination.
                </p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  View Forecast
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'explore' && (
          <LocationExplorer />
        )}

        {activeTab === 'budget' && (
          <BudgetPlanner />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryPlanner />
        )}
      </motion.div>
    </div>
  );
};

export default TripPlanner; 