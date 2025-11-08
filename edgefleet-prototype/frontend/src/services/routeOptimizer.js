import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const optimizeRoutes = async (vehicles, stops, depot) => {
  try {
    const response = await axios.post(`${API_URL}/api/optimize-routes`, {
      vehicles: vehicles.map(v => ({
        id: v.id,
        type: v.type || 'truck',
        capacity_kg: v.capacity_kg || 10000,
        current_load_kg: v.current_load_kg || 0
      })),
      stops: stops.map(s => ({
        lat: s.lat,
        lng: s.lng
      })),
      depot: {
        lat: depot.lat,
        lng: depot.lng
      },
      time_of_day: 'day',
      max_stops_per_vehicle: 5,
      location: 'Bangalore, India'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error optimizing routes:', error);
    throw error;
  }
};

export const getRouteOptimization = async (vehicleId) => {
  try {
    const response = await axios.get(`${API_URL}/api/route-optimization/${vehicleId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting route optimization:', error);
    throw error;
  }
};
