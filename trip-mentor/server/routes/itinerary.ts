import express from 'express';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage for itineraries (would be replaced with a database in production)
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

// Sample data
const itineraries: ItineraryItem[] = [];

const router = express.Router();

// Get all itinerary items for a user
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Filter itineraries by user ID
  const userItineraries = itineraries.filter(item => item.userId === userId);
  
  res.json({ itineraries: userItineraries });
});

// Get itinerary for a specific trip
router.get('/trip/:tripId', (req, res) => {
  const { tripId } = req.params;
  
  // Filter itineraries by trip ID
  const tripItineraries = itineraries.filter(item => item.tripId === tripId);
  
  // Sort by day and start time
  tripItineraries.sort((a, b) => {
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    return a.startTime.localeCompare(b.startTime);
  });
  
  res.json({ itineraries: tripItineraries });
});

// Create a new itinerary item
router.post('/', (req, res) => {
  const {
    userId,
    tripId,
    day,
    date,
    startTime,
    endTime,
    activity,
    location,
    notes,
    category,
    cost
  } = req.body;
  
  // Validate required fields
  if (!userId || !day || !activity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Create a new itinerary item
  const newItem: ItineraryItem = {
    id: uuidv4(),
    userId,
    tripId,
    day,
    date: date || '',
    startTime: startTime || '',
    endTime: endTime || '',
    activity,
    location: location || '',
    notes: notes || '',
    category: category || 'activity',
    cost: cost || 0
  };
  
  itineraries.push(newItem);
  
  res.status(201).json({ itinerary: newItem });
});

// Update an existing itinerary item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  
  // Find the index of the itinerary item
  const itemIndex = itineraries.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Itinerary item not found' });
  }
  
  // Update the item
  itineraries[itemIndex] = {
    ...itineraries[itemIndex],
    ...updatedData,
    id // Ensure ID doesn't change
  };
  
  res.json({ itinerary: itineraries[itemIndex] });
});

// Delete an itinerary item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Find the index of the itinerary item
  const itemIndex = itineraries.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Itinerary item not found' });
  }
  
  // Remove the item
  const deletedItem = itineraries.splice(itemIndex, 1)[0];
  
  res.json({ deleted: true, itinerary: deletedItem });
});

// Generate a sample itinerary template based on destination and duration
router.post('/generate-template', (req, res) => {
  const { userId, tripId, destination, duration, startDate } = req.body;
  
  if (!userId || !destination || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Parse start date or use current date
  const tripStartDate = startDate ? new Date(startDate) : new Date();
  
  // Generate a sample itinerary template
  const templateItems: ItineraryItem[] = [];
  
  // Create activities for each day
  for (let day = 1; day <= duration; day++) {
    const currentDate = new Date(tripStartDate);
    currentDate.setDate(tripStartDate.getDate() + day - 1);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Morning activity
    templateItems.push({
      id: uuidv4(),
      userId,
      tripId,
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
    templateItems.push({
      id: uuidv4(),
      userId,
      tripId,
      day,
      date: dateString,
      startTime: '12:00',
      endTime: '13:30',
      activity: `Lunch at local restaurant`,
      location: `${destination} restaurant district`,
      notes: 'Try local cuisine',
      category: 'meal'
    });
    
    // Afternoon activity
    templateItems.push({
      id: uuidv4(),
      userId,
      tripId,
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
      category: day === duration ? 'other' : 'activity'
    });
    
    // Dinner
    templateItems.push({
      id: uuidv4(),
      userId,
      tripId,
      day,
      date: dateString,
      startTime: '19:00',
      endTime: '21:00',
      activity: `Dinner at ${day % 3 === 0 ? 'upscale' : 'casual'} restaurant`,
      location: `${destination} dining area`,
      notes: 'Enjoy local cuisine',
      category: 'meal'
    });
  }
  
  // Add items to the itineraries array
  itineraries.push(...templateItems);
  
  res.status(201).json({ itineraries: templateItems });
});

export const itineraryRouter = router; 