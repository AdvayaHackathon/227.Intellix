import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios, { AxiosResponse } from 'axios';

interface ItineraryItem {
  id: string;
  userId: string;
  tripId?: string;
  day: number;
  date: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  notes: string;
  category: 'transport' | 'accommodation' | 'activity' | 'meal' | 'other';
  cost?: number;
}

// Define response types for better TypeScript support
interface SingleItineraryResponse {
  itinerary: ItineraryItem;
}

interface MultipleItinerariesResponse {
  itineraries: ItineraryItem[];
}

const ItineraryPlanner: React.FC = () => {
  const { user } = useAuth();
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ItineraryItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  
  // API URL - uses the server URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Load user's itinerary items on component mount
  useEffect(() => {
    if (user?.id) {
      fetchItineraryItems();
    }
  }, [user?.id]);

  // Fetch itinerary items from the backend
  const fetchItineraryItems = async () => {
    if (!user || !user.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get<MultipleItinerariesResponse>(`${API_URL}/itinerary/user/${user.id}`);
      
      if (response.data && response.data.itineraries) {
        setItineraryItems(response.data.itineraries);
      } else {
        setItineraryItems([]);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setError('Failed to fetch your itinerary. Using sample data instead.');
      generateSampleItinerary();
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a template itinerary based on destination and duration
  const generateTemplateItinerary = async () => {
    if (!destination || duration < 1) {
      setError('Please enter a destination and duration');
      return;
    }
    
    // Check if user exists and has id
    if (!user || !user.id) {
      setError('You must be logged in to create an itinerary');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post<MultipleItinerariesResponse>(`${API_URL}/itinerary/generate-template`, {
        userId: user.id,
        destination,
        duration,
        startDate: startDate || new Date().toISOString().split('T')[0]
      });
      
      if (response.data && response.data.itineraries) {
        setItineraryItems(response.data.itineraries);
        setHasPlan(true);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setError('Could not generate itinerary from server. Using sample data instead.');
      generateSampleItinerary();
      setHasPlan(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample itinerary data if API fails
  const generateSampleItinerary = () => {
    const sampleItems: ItineraryItem[] = [];
    
    for (let day = 1; day <= duration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day - 1);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Morning activity
      sampleItems.push({
        id: `sample-${day}-1`,
        userId: user?.id || '',
        day,
        date: dateString,
        startTime: '09:00',
        endTime: '11:30',
        activity: day === 1 
          ? `Arrival and check-in at accommodation` 
          : `Explore ${destination} ${day === 2 ? 'downtown' : 'attractions'}`,
        location: day === 1 ? 'Hotel' : `${destination} City Center`,
        notes: day === 1 ? 'Get settled and freshen up' : 'Take photos and enjoy local sights',
        category: day === 1 ? 'accommodation' : 'activity'
      });
      
      // Lunch
      sampleItems.push({
        id: `sample-${day}-2`,
        userId: user?.id || '',
        day,
        date: dateString,
        startTime: '12:00',
        endTime: '13:30',
        activity: `Lunch at local restaurant`,
        location: `${destination} restaurant district`,
        notes: 'Try local cuisine',
        category: 'meal',
        cost: 25
      });
      
      // Afternoon activity
      sampleItems.push({
        id: `sample-${day}-3`,
        userId: user?.id || '',
        day,
        date: dateString,
        startTime: '14:00',
        endTime: '17:00',
        activity: day === duration 
          ? 'Packing and preparation for departure' 
          : `Visit ${['museum', 'park', 'beach', 'market'][day % 4]} in ${destination}`,
        location: day === duration 
          ? 'Hotel' 
          : `${destination} ${['Museum', 'Central Park', 'Beach', 'Market'][day % 4]}`,
        notes: day === duration 
          ? 'Ensure all belongings are packed' 
          : 'Enjoy the local attractions',
        category: day === duration ? 'other' : 'activity',
        cost: day === duration ? 0 : 20
      });
      
      // Dinner
      sampleItems.push({
        id: `sample-${day}-4`,
        userId: user?.id || '',
        day,
        date: dateString,
        startTime: '19:00',
        endTime: '21:00',
        activity: `Dinner at ${day % 3 === 0 ? 'upscale' : 'casual'} restaurant`,
        location: `${destination} dining area`,
        notes: 'Enjoy local cuisine',
        category: 'meal',
        cost: day % 3 === 0 ? 50 : 30
      });
    }
    
    setItineraryItems(sampleItems);
  };

  // Save a new or updated itinerary item
  const saveItineraryItem = async () => {
    if (!currentItem || !user?.id) return;
    
    const itemToSave: ItineraryItem = {
      ...currentItem as ItineraryItem,
      userId: user.id
    };
    
    if (!itemToSave.activity) {
      setError('Activity name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (isEditing && itemToSave.id) {
        // Update existing item
        const response = await axios.put<SingleItineraryResponse>(`${API_URL}/itinerary/${itemToSave.id}`, itemToSave);
        
        // Update the item in the local state
        setItineraryItems(prev =>
          prev.map(item => item.id === itemToSave.id ? response.data.itinerary : item)
        );
      } else {
        // Create new item
        const response = await axios.post<SingleItineraryResponse>(`${API_URL}/itinerary`, itemToSave);
        
        // Add the new item to the local state
        setItineraryItems(prev => [...prev, response.data.itinerary]);  
      }

      // Close the modal and reset the current item
      closeModal();
    } catch (error) {
      console.error('Error saving itinerary item:', error);
      setError('Failed to save itinerary item. Please try again.');
      
      // If API call fails, close the modal anyway in dev environment
      if (process.env.NODE_ENV === 'development') {
        closeModal();
        
        // In development, add a fake item to demonstrate UI
        if (!isEditing) {
          const fakeItem: ItineraryItem = {
            ...itemToSave as ItineraryItem,
            id: `temp-${Date.now()}`
          };
          setItineraryItems(prev => [...prev, fakeItem]);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an itinerary item
  const deleteItineraryItem = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/itinerary/${id}`);
      
      // Remove the item from the local state
      setItineraryItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting itinerary item:', err);
      setError('Failed to delete itinerary item');
      
      // For demo purposes, remove the item from the local state anyway
      setItineraryItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Open the modal for creating a new item
  const openNewItemModal = (day: number) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + day - 1);
    const dateString = newDate.toISOString().split('T')[0];
    
    setCurrentItem({
      day,
      date: dateString,
      startTime: '',
      endTime: '',
      activity: '',
      location: '',
      notes: '',
      category: 'activity',
      cost: 0
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open the modal for editing an existing item
  const openEditItemModal = (item: ItineraryItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Close the modal and reset the current item
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  // Handle input changes for the current item
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setCurrentItem(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [name]: name === 'cost' ? parseFloat(value) : value
      };
    });
  };

  // Get itinerary items for a specific day
  const getItemsForDay = (day: number) => {
    return itineraryItems
      .filter(item => item.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Format a time string
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Get a CSS class based on the category
  const getCategoryClass = (category: string) => {
    switch(category) {
      case 'transport':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'accommodation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'activity':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'meal':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Calculate the total cost for a day
  const getDailyCost = (day: number) => {
    return getItemsForDay(day)
      .reduce((total, item) => total + (item.cost || 0), 0);
  };

  // Calculate the total cost for the entire trip
  const getTotalCost = () => {
    return itineraryItems.reduce((total, item) => total + (item.cost || 0), 0);
  };

  // Get the available days for the itinerary
  const getDays = () => {
    if (itineraryItems.length === 0) {
      return Array.from({ length: duration }, (_, i) => i + 1);
    }
    
    const days = new Set(itineraryItems.map(item => item.day));
    return Array.from(days).sort((a, b) => a - b);
  };

  // Get the formatted date for a specific day
  const getDateForDay = (day: number) => {
    const item = itineraryItems.find(item => item.day === day);
    
    if (item && item.date) {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + day - 1);
    return newDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Itinerary Planner</h2>
      
      {itineraryItems.length === 0 ? (
        <div className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-6">
            <p className="text-gray-700 dark:text-gray-300">
              Plan your daily activities and create a detailed itinerary for your trip.
              Start by entering a destination and duration to generate a template.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you going?"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min="1"
                max="30"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
              />
            </div>
          </div>
          
          <button
            onClick={generateTemplateItinerary}
            disabled={!destination || duration <= 0 || isLoading}
            className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Itinerary Template'}
          </button>
        </div>
      ) : (
        <div>
          {/* Itinerary tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px">
              {getDays().map((day) => (
                <li key={day} className="mr-2">
                  <button
                    onClick={() => setSelectedDay(day)}
                    className={`inline-block p-4 rounded-t-lg ${
                      selectedDay === day
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  >
                    Day {day}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Day information */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Day {selectedDay}: {getDateForDay(selectedDay)}
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daily Cost: <span className="font-semibold">${getDailyCost(selectedDay).toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Trip Cost: <span className="font-semibold">${getTotalCost().toFixed(2)}</span>
              </p>
            </div>
          </div>
          
          {/* Itinerary items */}
          <div className="space-y-4 mb-6">
            {getItemsForDay(selectedDay).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 my-8">
                No activities planned for this day yet. Add some using the button below.
              </p>
            ) : (
              getItemsForDay(selectedDay).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow"
                >
                  <div className="flex flex-wrap justify-between items-start">
                    <div className="mb-2 md:mb-0">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.activity}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getCategoryClass(item.category)}`}>
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openEditItemModal(item)}
                        className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteItineraryItem(item.id)}
                        className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      🕒
                      {item.startTime && item.endTime
                        ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
                        : 'Time not specified'}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      📍
                      {item.location || 'Location not specified'}
                    </div>
                    
                    {item.cost !== undefined && item.cost > 0 && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        💰
                        ${item.cost.toFixed(2)}
                      </div>
                    )}
                    
                    {item.notes && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 col-span-full">
                        📝
                        {item.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Add new item button */}
          <button
            onClick={() => openNewItemModal(selectedDay)}
            className="flex items-center justify-center w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ➕
            Add Activity to Day {selectedDay}
          </button>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Modal for creating/editing itinerary items */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isEditing ? 'Edit Activity' : 'Add New Activity'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Name*
                </label>
                <input
                  type="text"
                  name="activity"
                  value={currentItem.activity || ''}
                  onChange={handleInputChange}
                  placeholder="What are you doing?"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={currentItem.startTime || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={currentItem.endTime || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={currentItem.location || ''}
                  onChange={handleInputChange}
                  placeholder="Where is this activity?"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={currentItem.category || 'activity'}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                >
                  <option value="transport">Transport</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="activity">Activity</option>
                  <option value="meal">Meal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost ($)
                </label>
                <input
                  type="number"
                  name="cost"
                  value={currentItem.cost || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={currentItem.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Any additional details..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveItineraryItem}
                disabled={!currentItem.activity}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isEditing ? 'Update' : 'Add'} Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryPlanner; 