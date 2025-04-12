import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  estimatedCost: string;
  category: string;
}

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

type CurrencyCode = 'USD' | 'INR';

interface ExchangeRate {
  USD: number;
  INR: number;
}

const BudgetPlanner: React.FC = () => {
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [duration, setDuration] = useState<number>(7);
  const [location, setLocation] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [categories, setCategories] = useState<BudgetCategory[]>([
    { id: '1', name: 'Accommodation', amount: 0, percentage: 35 },
    { id: '2', name: 'Food & Drinks', amount: 0, percentage: 25 },
    { id: '3', name: 'Transportation', amount: 0, percentage: 15 },
    { id: '4', name: 'Activities', amount: 0, percentage: 15 },
    { id: '5', name: 'Shopping', amount: 0, percentage: 5 },
    { id: '6', name: 'Miscellaneous', amount: 0, percentage: 5 }
  ]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [planGenerated, setPlanGenerated] = useState<boolean>(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [placeError, setPlaceError] = useState<string>('');
  
  // Exchange rates (simplified for the example)
  const exchangeRates: ExchangeRate = {
    USD: 1,
    INR: 83.14 // 1 USD = 83.14 INR (approximate)
  };
  
  // API URL - uses the server URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Update category amounts based on total budget and percentages
  const updateCategoryAmounts = (budget: number) => {
    // Dynamically calculate the category amounts based on the user's budget
    const updatedCategories = categories.map(category => {
      // Calculate the actual amount based on percentage of total budget
      const amount = Math.round((category.percentage / 100) * budget);
      return {
        ...category,
        amount
      };
    });
    setCategories(updatedCategories);
  };

  // Handle budget input change
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setTotalBudget(value);
    // Update all category amounts whenever budget changes
    updateCategoryAmounts(value);
  };

  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value as CurrencyCode);
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setDuration(value);
  };

  // Handle category percentage change
  const handlePercentageChange = (id: string, newPercentage: number) => {
    // First, update the percentage for the changed category
    let updatedCategories = categories.map(category => 
      category.id === id 
        ? { ...category, percentage: newPercentage } 
        : category
    );
    
    // Calculate the current total percentage
    const totalPercentage = updatedCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    
    // If the total isn't 100%, adjust other categories proportionally
    if (totalPercentage !== 100) {
      // Calculate how much we need to adjust the other categories
      const adjustment = 100 - totalPercentage;
      const categoriesToAdjust = updatedCategories.filter(cat => cat.id !== id);
      
      if (categoriesToAdjust.length > 0) {
        // Get the current total percentage of categories we can adjust
        const otherCategoriesTotal = categoriesToAdjust.reduce((sum, cat) => sum + cat.percentage, 0);
        
        // Adjust each category proportionally
        updatedCategories = updatedCategories.map(category => {
          if (category.id === id) return category;
          
          // Skip adjustment if the other categories total is 0 to avoid division by zero
          if (otherCategoriesTotal === 0) return category;
          
          // Calculate the new percentage with proportional adjustment
          const adjustmentRatio = category.percentage / otherCategoriesTotal;
          const newPercentage = Math.max(0, Math.round(category.percentage + (adjustment * adjustmentRatio)));
          
          return {
            ...category,
            percentage: newPercentage
          };
        });
      }
    }
    
    // Ensure we have exactly 100% by adjusting the last category if needed
    const finalTotal = updatedCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (finalTotal !== 100) {
      // Find a category other than the one being changed to make the final adjustment
      const adjustmentCategory = updatedCategories.find(cat => cat.id !== id) || updatedCategories[0];
      if (adjustmentCategory) {
        adjustmentCategory.percentage += (100 - finalTotal);
      }
    }
    
    setCategories(updatedCategories);
    // Update monetary amounts based on the new percentages
    updateCategoryAmounts(totalBudget);
  };

  // Handle direct amount change in a category
  const handleAmountChange = (id: string, newAmount: number) => {
    // Don't process if total budget is 0 or invalid
    if (totalBudget <= 0) return;
    
    // Calculate the new percentage based on the input amount
    const newPercentage = Math.round((newAmount / totalBudget) * 100);
    
    // Use the existing percentage change handler to maintain the 100% total
    handlePercentageChange(id, newPercentage);
  };

  // Get budget level indicators
  const getBudgetLevelIndicator = (amount: number, category: string) => {
    // Convert to USD for consistent comparison if using INR
    const amountUSD = currency === 'INR' ? amount / exchangeRates.INR : amount;
    const dailyAmount = amountUSD / duration;
    
    // Different thresholds for different categories
    let thresholds;
    switch (category) {
      case 'Accommodation':
        thresholds = { low: 50, high: 150 };
        break;
      case 'Food & Drinks':
        thresholds = { low: 30, high: 100 };
        break;
      case 'Transportation':
        thresholds = { low: 10, high: 50 };
        break;
      case 'Activities':
        thresholds = { low: 20, high: 80 };
        break;
      default:
        thresholds = { low: 15, high: 50 };
    }
    
    // Return the appropriate indicator
    if (dailyAmount < thresholds.low) {
      return { level: 'low', color: 'text-yellow-600', text: 'Budget' };
    } else if (dailyAmount > thresholds.high) {
      return { level: 'high', color: 'text-green-600', text: 'Luxury' };
    } else {
      return { level: 'medium', color: 'text-blue-600', text: 'Standard' };
    }
  };

  // Fetch tourist attractions based on location and budget
  const fetchSuggestedPlaces = async (destination: string, budget: number) => {
    if (!destination) return;
    
    setIsLoadingPlaces(true);
    setPlaceError('');
    
    try {
      // Get the activities budget to determine max price level
      const activitiesBudget = categories.find(c => c.name === 'Activities')?.amount || 0;
      const dailyActivitiesBudget = Math.round(activitiesBudget / duration);
      
      // Convert to USD for price level calculation if using INR
      const dailyActivitiesBudgetUSD = currency === 'INR' 
        ? Math.round(dailyActivitiesBudget / exchangeRates.INR) 
        : dailyActivitiesBudget;
      
      // Determine max price level based on budget (in USD)
      // For simplicity: 0-$30 = price_level 1, $31-$60 = price_level 2, $61+ = price_level 3
      const affordablePriceLevel = 
        dailyActivitiesBudgetUSD < 30 ? 1 :
        dailyActivitiesBudgetUSD < 60 ? 2 : 3;
        
      // Call our backend API to get tourist attractions
      const response = await axios.get(`${API_URL}/places/tourist-attractions`, {
        params: {
          destination: destination,
          limit: 10
        }
      });
      
      if (response.data && response.data.attractions) {
        // Filter places based on price level and budget
        const filteredPlaces = response.data.attractions.filter((place: Place) => {
          // Use a safe approach that satisfies TypeScript
          const priceLevel = place.price_level !== undefined ? place.price_level : 0;
          return priceLevel <= affordablePriceLevel;
        });
        
        setSuggestedPlaces(filteredPlaces);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaceError('Failed to fetch tourist attractions. Using sample data instead.');
      
      // Fallback to sample data
      generateFallbackPlaces(destination, budget);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Generate fallback place suggestions if API fails
  const generateFallbackPlaces = (destination: string, budget: number) => {
    const activitiesBudget = categories.find(c => c.name === 'Activities')?.amount || 0;
    const dailyActivitiesBudget = Math.round(activitiesBudget / duration);
    
    // Convert to USD for price level calculation if using INR
    const dailyActivitiesBudgetUSD = currency === 'INR' 
      ? Math.round(dailyActivitiesBudget / exchangeRates.INR) 
      : dailyActivitiesBudget;
    
    // Budget level determines which attractions to show
    const affordablePriceLevel = 
      dailyActivitiesBudgetUSD < 30 ? 1 :
      dailyActivitiesBudgetUSD < 60 ? 2 : 3;
    
    // Sample data with price levels
    const samplePlaces: Place[] = [
      {
        id: '1',
        name: `${destination} Historic Center`,
        type: 'Landmark',
        rating: 4.5,
        description: `Free walking tour of the historic district of ${destination}.`,
        imageUrl: 'https://images.unsplash.com/photo-1558086798-4805dc8df2ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 0,
        vicinity: `Central ${destination}`
      },
      {
        id: '2',
        name: `${destination} City Museum`,
        type: 'Museum',
        rating: 4.3,
        description: `Cultural museum showcasing the history of ${destination}. Admission: ${currency === 'INR' ? '₹1,250' : '$15'} per person.`,
        imageUrl: 'https://images.unsplash.com/photo-1566127992631-17596ed6b017?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 1,
        vicinity: `Museum District, ${destination}`
      },
      {
        id: '3',
        name: `${destination} Botanical Gardens`,
        type: 'Park',
        rating: 4.4,
        description: `Beautiful gardens with exotic plants and flowers. Entry fee: ${currency === 'INR' ? '₹2,080' : '$25'} per person.`,
        imageUrl: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 2,
        vicinity: `North ${destination}`
      },
      {
        id: '4',
        name: `${destination} Cultural Experience`,
        type: 'Activity',
        rating: 4.7,
        description: `Premium cultural experience with dinner and entertainment. Cost: ${currency === 'INR' ? '₹6,240' : '$75'} per person.`,
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        price_level: 3,
        vicinity: `Downtown ${destination}`
      }
    ];
    
    // Filter places based on affordable price level
    const affordablePlaces = samplePlaces.filter(place => 
      (place.price_level !== undefined && place.price_level <= affordablePriceLevel)
    );
    setSuggestedPlaces(affordablePlaces);
  };

  // Generate budget plan and recommendations
  const generatePlan = () => {
    if (!totalBudget || !location) return;
    
    setIsLoading(true);
    
    // Sample recommendation data based on budget and location
    setTimeout(() => {
      // Calculate daily budget for recommendations
      const dailyBudget = Math.round(totalBudget / duration);
      const accommodationBudget = categories.find(c => c.name === 'Accommodation')?.amount || 0;
      const foodBudget = categories.find(c => c.name === 'Food & Drinks')?.amount || 0;
      const activitiesBudget = categories.find(c => c.name === 'Activities')?.amount || 0;
      
      // Convert to USD for budget level calculation if using INR
      const totalBudgetUSD = currency === 'INR' 
        ? Math.round(totalBudget / exchangeRates.INR) 
        : totalBudget;
      
      // Budget level thresholds - adjust based on currency
      const lowThreshold = currency === 'INR' ? 80000 : 1000; // ~$1000 in INR
      const mediumThreshold = currency === 'INR' ? 250000 : 3000; // ~$3000 in INR
      
      const budgetLevel = totalBudgetUSD < 1000 ? 'low' : totalBudgetUSD < 3000 ? 'medium' : 'high';
      
      const recommendationsByBudget: Record<string, Recommendation[]> = {
        low: [
          {
            id: '1',
            title: 'Budget Accommodation',
            description: `Look for hostels or budget hotels in ${location}. ${currency === 'INR' ? 'Check for dharamshalas or homestays for authentic experiences.' : 'Consider shared rooms or apartments away from city center.'}`,
            estimatedCost: formatCurrency(Math.round(accommodationBudget / duration)) + ` per night`,
            category: 'Accommodation'
          },
          {
            id: '2',
            title: 'Local Street Food',
            description: `Try local street food and markets instead of restaurants. ${currency === 'INR' ? 'Local thalis and street food stalls offer authentic meals at much better prices.' : 'Cook some meals if your accommodation has a kitchen.'}`,
            estimatedCost: formatCurrency(Math.round(foodBudget / duration / 3)) + ` per meal`,
            category: 'Food & Drinks'
          },
          {
            id: '3',
            title: 'Free Activities',
            description: `Visit free museums, parks, and walking tours in ${location}. ${currency === 'INR' ? 'Many temples and historical sites have nominal entry fees or free days.' : 'Many attractions have discounted or free days.'}`,
            estimatedCost: currency === 'INR' ? 'Free - ₹1,250' : 'Free - $15',
            category: 'Activities'
          }
        ],
        medium: [
          {
            id: '1',
            title: 'Mid-range Hotels',
            description: `${currency === 'INR' ? '3-star hotels or nice guest houses in good locations around' : '3-star hotels or nice Airbnb in good locations around'} ${location}. Look for deals with breakfast included.`,
            estimatedCost: formatCurrency(Math.round(accommodationBudget / duration)) + ` per night`,
            category: 'Accommodation'
          },
          {
            id: '2',
            title: 'Local Restaurants',
            description: `Mix of casual dining and trying some nicer local restaurants. ${currency === 'INR' ? 'Look for thali meals at mid-range restaurants for the best value.' : 'Save premium dining for special occasions.'}`,
            estimatedCost: formatCurrency(Math.round(foodBudget / duration / 3)) + ` per meal`,
            category: 'Food & Drinks'
          },
          {
            id: '3',
            title: 'Paid Attractions & Tours',
            description: `Budget for main attractions in ${location} and consider a day tour to nearby areas. ${currency === 'INR' ? 'Look for government-approved guides for better rates.' : 'Look for city passes for discounts.'}`,
            estimatedCost: formatCurrency(Math.round(activitiesBudget / (duration/2))) + ` per activity`,
            category: 'Activities'
          }
        ],
        high: [
          {
            id: '1',
            title: 'Luxury Accommodation',
            description: `4-5 star hotels in prime locations in ${location}. ${currency === 'INR' ? 'Consider heritage properties or palace hotels for unique Indian experiences.' : 'Consider boutique hotels with unique experiences.'}`,
            estimatedCost: formatCurrency(Math.round(accommodationBudget / duration)) + ` per night`,
            category: 'Accommodation'
          },
          {
            id: '2',
            title: 'Fine Dining Experiences',
            description: `Enjoy the best restaurants ${location} has to offer, ${currency === 'INR' ? 'including authentic regional cuisine at signature restaurants.' : 'including Michelin-starred venues if available.'}`,
            estimatedCost: formatCurrency(Math.round(foodBudget / duration / 2)) + ` per meal`,
            category: 'Food & Drinks'
          },
          {
            id: '3',
            title: 'Premium Experiences',
            description: `Consider exclusive tours, private guides, and unique local experiences ${currency === 'INR' ? 'like private temple tours, cultural performances, or craft workshops.' : 'like cooking classes or special events.'}`,
            estimatedCost: formatCurrency(Math.round(activitiesBudget / (duration/3))) + ` per experience`,
            category: 'Activities'
          }
        ]
      };
      
      setRecommendations(recommendationsByBudget[budgetLevel]);
      setIsLoading(false);
      setPlanGenerated(true);
      
      // After generating budget recommendations, fetch suggested places
      fetchSuggestedPlaces(location, totalBudget);
    }, 1500);
  };

  // Format currency based on selected currency
  const formatCurrency = (amount: number) => {
    if (currency === 'INR') {
      // Format as Indian Rupees with proper thousands separators (lakhs and crores)
      const amountInRupees = Math.round(amount * exchangeRates.INR);
      
      // Format with Indian numbering system (commas after first 3 digits, then every 2 digits)
      return '₹' + amountInRupees.toLocaleString('en-IN');
    } else {
      // Format as USD
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };
  
  // Format price level into dollar signs
  const formatPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return 'Not available';
    
    switch(priceLevel) {
      case 0: return 'Free';
      case 1: return currency === 'INR' ? '₹' : '$';
      case 2: return currency === 'INR' ? '₹₹' : '$$';
      case 3: return currency === 'INR' ? '₹₹₹' : '$$$';
      case 4: return currency === 'INR' ? '₹₹₹₹' : '$$$$';
      default: return 'Not available';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Budget Planner</h2>
      <h3 className="text-md italic mb-6 text-black">Your AI Travel Assistant</h3>
      
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Budget
            </label>
            <div className="flex">
              <input
                type="number"
                value={totalBudget || ''}
                onChange={handleBudgetChange}
                placeholder="Enter your total budget"
                className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
              />
              <select
                value={currency}
                onChange={handleCurrencyChange}
                className="p-3 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trip Duration (days)
            </label>
            <input
              type="number"
              value={duration || ''}
              onChange={handleDurationChange}
              placeholder="Number of days"
              min="1"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you going?"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generatePlan}
              disabled={!totalBudget || !location || isLoading}
              className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Budget Plan'}
            </button>
          </div>
        </div>
        
        {totalBudget > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Budget Breakdown</h3>
            
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total Budget:</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget)}</span>
              </div>
              {duration > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Daily Budget:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Math.round(totalBudget / duration))} / day</span>
                </div>
              )}
            </div>
            
            <div className="overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg">
              {categories.map((category) => (
                <div key={category.id} className="p-4 border-b border-gray-200 dark:border-gray-600 last:border-0">
                  <div className="flex flex-wrap justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={category.amount || ''}
                        onChange={(e) => handleAmountChange(category.id, parseInt(e.target.value) || 0)}
                        className="w-24 p-1 mr-2 text-right text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 text-black"
                      />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {currency === 'INR' ? '₹' : '$'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={category.percentage}
                      onChange={(e) => handlePercentageChange(category.id, parseInt(e.target.value))}
                      className="flex-grow h-2 rounded-lg appearance-none cursor-pointer bg-gray-300 dark:bg-gray-600"
                    />
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                        {category.percentage}%
                      </span>
                      <div className="flex ml-2">
                        <button 
                          onClick={() => handlePercentageChange(category.id, Math.max(5, category.percentage - 5))}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-l-md text-gray-700 dark:text-gray-300 text-xs"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => handlePercentageChange(category.id, Math.min(60, category.percentage + 5))}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-r-md text-gray-700 dark:text-gray-300 text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {duration > 0 && (
                    <div className="mt-1 flex justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(Math.round(category.amount / duration))} per day
                      </div>
                      {category.amount > 0 && (
                        <div className={`text-xs ${getBudgetLevelIndicator(category.amount, category.name).color}`}>
                          {getBudgetLevelIndicator(category.amount, category.name).text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {planGenerated && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-1">{rec.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</div>
                <div className="text-xs font-medium">
                  <span className="text-gray-500 dark:text-gray-400">Estimated: </span>
                  <span className="text-green-600 dark:text-green-400">{rec.estimatedCost}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {planGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Suggested Attractions Within Your Budget
          </h3>
          
          {isLoadingPlaces && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {placeError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
              {placeError}
            </div>
          )}
          
          {!isLoadingPlaces && suggestedPlaces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedPlaces.map((place) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md"
                >
                  <div 
                    className="h-32 bg-cover bg-center" 
                    style={{ backgroundImage: `url(${place.imageUrl})` }}
                  ></div>
                  <div className="p-4">
                    <h4 className="text-md font-semibold mb-1 text-gray-900 dark:text-white">{place.name}</h4>
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
                </motion.div>
              ))}
            </div>
          )}
          
          {!isLoadingPlaces && suggestedPlaces.length === 0 && !placeError && (
            <p className="text-center text-gray-500 dark:text-gray-400 my-4">
              No attractions found within your budget. Try increasing your activities budget allocation.
            </p>
          )}
        </motion.div>
      )}
      
      {planGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Budget Tips</h3>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Book accommodation and flights early for the best deals.</li>
              <li>Consider traveling during shoulder season for lower prices and fewer crowds.</li>
              <li>Research free activities and attractions at your destination.</li>
              <li>Use public transportation instead of taxis when possible.</li>
              <li>Look for accommodation with kitchen access to save on meal costs.</li>
              <li>Check if your destination offers city passes for discounted attraction entry.</li>
              <li>Set aside a small emergency fund (about 10% of your total budget).</li>
              {currency === 'INR' && (
                <>
                  <li>In India, negotiate prices at local markets for better deals on souvenirs.</li>
                  <li>Use the local UPI payment systems to avoid foreign transaction fees.</li>
                </>
              )}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BudgetPlanner; 