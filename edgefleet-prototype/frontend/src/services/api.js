import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000, // Reduced timeout to 5 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status} from ${error.config.url}`);
    } else if (error.request) {
      console.error('[API] No response received');
    } else {
      console.error('[API] Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  return { data: null };
};

// Vehicle endpoints
export const fetchVehicles = () => 
  api.get('/api/vehicles').catch(handleApiError);

export const fetchVehicleById = (id) => 
  api.get(`/api/vehicles/${id}`).catch(handleApiError);

export const createVehicle = (data) => 
  api.post('/api/vehicles', data).catch(handleApiError);

export const updateVehicle = (id, data) => 
  api.put(`/api/vehicles/${id}`, data).catch(handleApiError);

export const deleteVehicle = (id) => 
  api.delete(`/api/vehicles/${id}`).catch(handleApiError);

// Driver endpoints
export const fetchDrivers = () => 
  api.get('/api/drivers').catch(handleApiError);

export const fetchDriverById = (id) => 
  api.get(`/api/drivers/${id}`).catch(handleApiError);

export const createDriver = (data) => 
  api.post('/api/drivers', data).catch(handleApiError);

export const updateDriver = (id, data) => 
  api.put(`/api/drivers/${id}`, data).catch(handleApiError);

export const deleteDriver = (id) => 
  api.delete(`/api/drivers/${id}`).catch(handleApiError);

// Alert endpoints
export const fetchAlerts = (params = {}) => 
  api.get('/api/alerts', { params }).catch(handleApiError);

export const fetchAlertById = (id) => 
  api.get(`/api/alerts/${id}`).catch(handleApiError);

export const createAlert = (data) => 
  api.post('/api/alerts', data).catch(handleApiError);

export const updateAlert = (id, data) => 
  api.put(`/api/alerts/${id}`, data).catch(handleApiError);

export const deleteAlert = (id) => 
  api.delete(`/api/alerts/${id}`).catch(handleApiError);

// Telemetry endpoints
export const fetchTelemetry = (params = {}) => 
  api.get('/api/telemetry', { params }).catch(handleApiError);

export const fetchTelemetryById = (id) => 
  api.get(`/api/telemetry/${id}`).catch(handleApiError);

export const createTelemetry = (data) => 
  api.post('/api/telemetry', data).catch(handleApiError);

// Analytics endpoints
export const fetchAnalytics = () => 
  api.get('/api/analytics').catch(handleApiError);

// Authentication endpoints
export const login = (credentials) => 
  api.post('/api/auth/login', credentials).catch(handleApiError);

export const register = (userData) => 
  api.post('/api/auth/register', userData).catch(handleApiError);

export default api;
