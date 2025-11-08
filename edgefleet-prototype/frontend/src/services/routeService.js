import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const routeService = {
  async optimizeRoute(waypoints, vehicleId, options = {}) {
    try {
      // First, ensure we have at least 2 waypoints
      if (!waypoints || waypoints.length < 2) {
        throw new Error('At least 2 waypoints are required');
      }

      // Format the request according to the backend's expected format
      const requestData = {
        vehicles: [{
          id: vehicleId || 'vehicle-1',
          type: 'truck',
          capacity_kg: 10000,
          current_load_kg: 0
        }],
        stops: waypoints.slice(1).map(wp => ({
          lat: wp.lat || wp.position[0],
          lng: wp.lng || wp.position[1],
          demand_kg: 0 // Default demand, can be customized
        })),
        depot: {
          lat: waypoints[0].lat || waypoints[0].position[0],
          lng: waypoints[0].lng || waypoints[0].position[1]
        },
        time_of_day: 'day',
        max_stops_per_vehicle: 10,
        ...options
      };

      console.log('Sending optimization request:', requestData);
      const response = await axios.post(`${API_URL}/optimize-routes`, requestData);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      console.log('Optimization response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Failed to optimize route');
    }
  },

  async saveRoute(routeData) {
    try {
      const response = await axios.post(`${API_URL}/save-route`, routeData);
      return response.data;
    } catch (error) {
      console.error('Error saving route:', error);
      throw error;
    }
  },

  async getRoutes() {
    try {
      const response = await axios.get(`${API_URL}/saved-routes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }
};

export default routeService;
