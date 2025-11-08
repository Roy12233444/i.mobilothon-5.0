import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FiMapPin, FiPhone, FiAlertTriangle, FiClock, 
  FiDroplet, FiTruck, FiUser, FiNavigation, 
  FiLayers, FiFilter, FiRefreshCw, FiMaximize2, 
  FiMinimize2, FiZoomIn, FiZoomOut, FiCompass
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icons in Leaflet with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom truck icon
const createTruckIcon = (status) => {
  const color = {
    moving: '#10B981',    // Green
    idle: '#F59E0B',      // Yellow
    stopped: '#EF4444',   // Red
    offline: '#6B7280'    // Gray
  }[status] || '#3B82F6'; // Default blue

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}" class="marker-pin"></div><svg viewBox="0 0 24 24" fill="${color}" class="svg-icon"><path d="M18 18.5C18.83 18.5 19.5 17.83 19.5 17C19.5 16.17 18.83 15.5 18 15.5C17.17 15.5 16.5 16.17 16.5 17C16.5 17.83 17.17 18.5 18 18.5ZM19.5 9.5H17V12H21.46L19.5 9.5ZM6 18.5C6.83 18.5 7.5 17.83 7.5 17C7.5 16.17 6.83 15.5 6 15.5C5.17 15.5 4.5 16.17 4.5 17C4.5 17.83 5.17 18.5 6 18.5ZM20 8L23 12V17H21C21 18.66 19.66 20 18 20C16.34 20 15 18.66 15 17H9C9 18.66 7.66 20 6 20C4.34 20 3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8H20ZM3 6V15H3.76C4.31 14.39 5.11 14 6 14C6.89 14 7.69 14.39 8.24 15H15V6H3ZM18 14C18.89 14 19.69 14.39 20.24 15H21V12.5L19.5 10H17V15H17.76C18.31 14.39 19.11 14 20 14Z"/></svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -45]
  });
};

// Map controls component
const MapControls = ({ zoom, onZoomIn, onZoomOut, onFitBounds, onToggleFullscreen, isFullscreen }) => {
  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col space-y-2">
      <button 
        onClick={onZoomIn}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Zoom in"
      >
        <FiZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>
      <button 
        onClick={onZoomOut}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Zoom out"
      >
        <FiZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>
      <button 
        onClick={onFitBounds}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Fit to bounds"
      >
        <FiLayers className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>
      <button 
        onClick={onToggleFullscreen}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <FiMinimize2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        ) : (
          <FiMaximize2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        )}
      </button>
    </div>
  );
};

// Map center setter component
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Mock data for vehicles
const generateMockVehicles = (count = 15) => {
  const statuses = ['moving', 'idle', 'stopped', 'offline'];
  const vehicles = [];
  
  // Generate random coordinates around a center point (e.g., New York)
  const centerLat = 40.7128;
  const centerLng = -74.0060;
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const id = `VH${1000 + i}`;
    const driver = `Driver ${String.fromCharCode(65 + i)}`;
    const phone = `+1 (555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
    const speed = status === 'moving' ? Math.floor(20 + Math.random() * 80) : 0;
    const lastUpdate = new Date(Date.now() - Math.floor(Math.random() * 3600000)); // Up to 1 hour ago
    const fuelLevel = Math.floor(10 + Math.random() * 90);
    
    // Generate random position within ~50km radius
    const radius = 0.5; // degrees (~55km at the equator)
    const lat = centerLat + (Math.random() * 2 - 1) * radius;
    const lng = centerLng + (Math.random() * 2 - 1) * radius;
    
    vehicles.push({
      id,
      driver,
      phone,
      status,
      speed,
      fuelLevel,
      lastUpdate,
      position: [lat, lng],
      plateNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleType: ['Truck', 'Van', 'Car', 'Bike'][Math.floor(Math.random() * 4)],
      heading: Math.floor(Math.random() * 360),
      address: `${Math.floor(100 + Math.random() * 900)} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm'][Math.floor(Math.random() * 6)]} St, ${['New York', 'Jersey City', 'Newark', 'Brooklyn', 'Queens'][Math.floor(Math.random() * 5)]}, NY`,
      odometer: Math.floor(1000 + Math.random() * 100000),
      engineHours: Math.floor(100 + Math.random() * 5000)
    });
  }
  
  return vehicles;
};

// Generate a route with multiple points
const generateRoute = (start, end, points = 10) => {
  const route = [start];
  const latStep = (end[0] - start[0]) / (points + 1);
  const lngStep = (end[1] - start[1]) / (points + 1);
  
  for (let i = 1; i <= points; i++) {
    // Add some randomness to make the route more natural
    const lat = start[0] + latStep * i + (Math.random() * 0.01 - 0.005);
    const lng = start[1] + lngStep * i + (Math.random() * 0.01 - 0.005);
    route.push([lat, lng]);
  }
  
  route.push(end);
  return route;
};

const LiveTracking = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    vehicleType: 'all',
    minSpeed: 0,
    maxSpeed: 120,
    search: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter] = useState([40.7128, -74.0060]); // Default to New York
  const [zoom, setZoom] = useState(12);
  const [showRoute, setShowRoute] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const mapRef = useRef();
  const vehicleListRef = useRef();
  const refreshInterval = useRef();
  
  // Generate mock data
  const loadVehicles = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockVehicles = generateMockVehicles(15);
      setVehicles(mockVehicles);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Load initial data
  useEffect(() => {
    loadVehicles();
    
    // Set up auto-refresh
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        loadVehicles();
      }, 30000); // Refresh every 30 seconds
    }
    
    // Clean up interval on unmount
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [loadVehicles, autoRefresh]);
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    
    if (!autoRefresh) {
      // If enabling auto-refresh, load data immediately
      loadVehicles();
    } else if (refreshInterval.current) {
      // If disabling, clear the interval
      clearInterval(refreshInterval.current);
    }
  };
  
  // Filter vehicles based on filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Filter by status
      if (filters.status !== 'all' && vehicle.status !== filters.status) {
        return false;
      }
      
      // Filter by vehicle type
      if (filters.vehicleType !== 'all' && vehicle.vehicleType !== filters.vehicleType) {
        return false;
      }
      
      // Filter by speed range
      if (vehicle.speed < filters.minSpeed || vehicle.speed > filters.maxSpeed) {
        return false;
      }
      
      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          vehicle.id.toLowerCase().includes(searchTerm) ||
          vehicle.driver.toLowerCase().includes(searchTerm) ||
          vehicle.plateNumber.toLowerCase().includes(searchTerm) ||
          vehicle.address.toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  }, [vehicles, filters]);
  
  // Fit map to show all markers
  const fitMapToBounds = useCallback(() => {
    if (mapRef.current && filteredVehicles.length > 0) {
      const bounds = L.latLngBounds(
        filteredVehicles.map(v => v.position)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredVehicles]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
      setZoom(mapRef.current.getZoom());
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
      setZoom(mapRef.current.getZoom());
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    
    // Center map on selected vehicle
    if (mapRef.current) {
      mapRef.current.flyTo(vehicle.position, 15, {
        duration: 1,
        animate: true
      });
    }
    
    // Scroll to vehicle in the list (if not in mobile view)
    if (window.innerWidth >= 768) {
      const element = document.getElementById(`vehicle-${vehicle.id}`);
      if (element) {
        vehicleListRef.current.scrollTo({
          top: element.offsetTop - 16,
          behavior: 'smooth'
        });
      }
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      moving: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      idle: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      stopped: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      offline: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };
  
  // Format last update time
  const formatLastUpdate = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };
  
  // Generate a route for the selected vehicle
  const generateVehicleRoute = useCallback((vehicle) => {
    if (!vehicle) return [];
    
    // Generate a random destination within ~5km
    const destLat = vehicle.position[0] + (Math.random() * 0.05 - 0.025);
    const destLng = vehicle.position[1] + (Math.random() * 0.05 - 0.025);
    
    return generateRoute(vehicle.position, [destLat, destLng], 8);
  }, []);
  
  // Generate route for selected vehicle
  const vehicleRoute = useMemo(() => {
    return selectedVehicle && showRoute ? generateVehicleRoute(selectedVehicle) : [];
  }, [selectedVehicle, showRoute, generateVehicleRoute]);
  
  // Calculate ETA based on distance and average speed
  const calculateETA = (distanceKm, avgSpeedKmh = 50) => {
    if (!distanceKm || !avgSpeedKmh) return '--';
    
    const hours = distanceKm / avgSpeedKmh;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };
  
  // Toggle traffic layer
  const toggleTrafficLayer = () => {
    setShowTraffic(!showTraffic);
  };
  
  // Toggle heatmap
  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadVehicles();
  };
  
  // Get vehicle icon based on status and type
  const getVehicleIcon = (vehicle) => {
    return createTruckIcon(vehicle.status);
  };
  
  return (
    <div className={`flex flex-col md:flex-row h-[calc(100vh-64px)] ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Map Container */}
      <div className={`${isFullscreen ? 'w-full' : 'w-full md:w-2/3'} h-1/2 md:h-full relative`}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          whenCreated={mapInstance => {
            mapRef.current = mapInstance;
            // Fit to bounds after initial render
            setTimeout(fitMapToBounds, 100);
          }}
          zoomControl={false}
        >
          <ChangeView center={mapCenter} zoom={zoom} />
          
          {/* Base Map Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Traffic Layer (conditional) */}
          {showTraffic && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.7}
            />
          )}
          
          {/* Vehicle Markers */}
          {filteredVehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={vehicle.position}
              icon={getVehicleIcon(vehicle)}
              eventHandlers={{
                click: () => handleVehicleSelect(vehicle)
              }}
            >
              <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                <div className="font-medium">{vehicle.driver}</div>
                <div className="text-sm">{vehicle.vehicleType} • {vehicle.plateNumber}</div>
                <div className="text-sm">{vehicle.speed} km/h • {vehicle.status}</div>
              </Tooltip>
              
              <Popup>
                <div className="space-y-2">
                  <div className="font-medium">{vehicle.driver}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{vehicle.vehicleType} • {vehicle.plateNumber}</div>
                  <div className="flex items-center text-sm">
                    <FiMapPin className="mr-1 text-gray-500" />
                    <span>{vehicle.address}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiNavigation className="mr-1 text-gray-500" />
                    <span>{vehicle.speed} km/h • {vehicle.heading}° {getCompassDirection(vehicle.heading)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiDroplet className="mr-1 text-gray-500" />
                    <span>Fuel: {vehicle.fuelLevel}%</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FiClock className="mr-1 text-gray-500" />
                    <span>Updated: {formatLastUpdate(vehicle.lastUpdate)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Route for selected vehicle */}
          {vehicleRoute.length > 0 && (
            <Polyline 
              positions={vehicleRoute} 
              color="#3B82F6" 
              weight={4}
              opacity={0.8}
              dashArray="5, 5"
            />
          )}
          
          {/* Heatmap (simplified) */}
          {showHeatmap && filteredVehicles.map(vehicle => (
            <Circle
              key={`heat-${vehicle.id}`}
              center={vehicle.position}
              radius={500} // 500m radius
              pathOptions={{
                fillColor: vehicle.status === 'moving' ? '#F59E0B' : '#EF4444',
                fillOpacity: 0.3,
                stroke: false
              }}
            />
          ))}
        </MapContainer>
        
        {/* Map Controls */}
        <MapControls 
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitBounds={fitMapToBounds}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
        
        {/* Status Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 flex items-center space-x-4 z-[1000]">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Moving ({vehicles.filter(v => v.status === 'moving').length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Idle ({vehicles.filter(v => v.status === 'idle').length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Stopped ({vehicles.filter(v => v.status === 'stopped').length})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300">Offline ({vehicles.filter(v => v.status === 'offline').length})</span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className={`${isFullscreen ? 'hidden' : 'w-full md:w-1/3'} bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-1/2 md:h-full overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicle List</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handleRefresh}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={toggleAutoRefresh}
                className={`p-1.5 rounded-md ${autoRefresh ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={autoRefresh ? 'Auto-refresh enabled' : 'Enable auto-refresh'}
              >
                <FiClock className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="moving">Moving</option>
              <option value="idle">Idle</option>
              <option value="stopped">Stopped</option>
              <option value="offline">Offline</option>
            </select>
            
            <select
              value={filters.vehicleType}
              onChange={(e) => setFilters({...filters, vehicleType: e.target.value})}
              className="text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Truck">Trucks</option>
              <option value="Van">Vans</option>
              <option value="Car">Cars</option>
              <option value="Bike">Bikes</option>
            </select>
            
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-1.5 text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search vehicles..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{filteredVehicles.length} vehicles found</span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowRoute(!showRoute)}
                className={`flex items-center ${showRoute ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <FiNavigation className="w-3.5 h-3.5 mr-1" />
                <span>Route</span>
              </button>
              <button 
                onClick={toggleTrafficLayer}
                className={`flex items-center ${showTraffic ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <FiLayers className="w-3.5 h-3.5 mr-1" />
                <span>Traffic</span>
              </button>
              <button 
                onClick={toggleHeatmap}
                className={`flex items-center ${showHeatmap ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <FiCompass className="w-3.5 h-3.5 mr-1" />
                <span>Heatmap</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Vehicle List */}
        <div 
          ref={vehicleListRef}
          className="flex-1 overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No vehicles found matching your criteria
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVehicles.map(vehicle => (
                <li 
                  key={vehicle.id}
                  id={`vehicle-${vehicle.id}`}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedVehicle?.id === vehicle.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        vehicle.status === 'moving' ? 'bg-green-500' :
                        vehicle.status === 'idle' ? 'bg-yellow-500' :
                        vehicle.status === 'stopped' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {vehicle.driver}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {vehicle.speed} km/h
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {vehicle.vehicleType} • {vehicle.plateNumber}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatLastUpdate(vehicle.lastUpdate)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiMapPin className="flex-shrink-0 mr-1 h-3 w-3" />
                        <span className="truncate">{vehicle.address.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Selected Vehicle Details */}
        {selectedVehicle && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {selectedVehicle.driver} • {selectedVehicle.vehicleType}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="flex items-center">
                <FiPhone className="mr-1.5 text-gray-500" />
                <a href={`tel:${selectedVehicle.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  {selectedVehicle.phone}
                </a>
              </div>
              <div className="flex items-center">
                <FiMapPin className="mr-1.5 text-gray-500" />
                <span className="truncate">{selectedVehicle.address}</span>
              </div>
              <div className="flex items-center">
                <FiNavigation className="mr-1.5 text-gray-500" />
                <span>{selectedVehicle.speed} km/h • {selectedVehicle.heading}° {getCompassDirection(selectedVehicle.heading)}</span>
              </div>
              <div className="flex items-center">
                <FiDroplet className="mr-1.5 text-gray-500" />
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <div 
                    className={`h-1.5 rounded-full ${
                      selectedVehicle.fuelLevel > 30 ? 'bg-green-600' : 
                      selectedVehicle.fuelLevel > 15 ? 'bg-yellow-500' : 'bg-red-600'
                    }`} 
                    style={{ width: `${selectedVehicle.fuelLevel}%` }}
                  ></div>
                </div>
                <span className="ml-1.5 w-8 text-right">{selectedVehicle.fuelLevel}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-gray-500 dark:text-gray-400">Odometer</div>
                <div className="font-medium">{selectedVehicle.odometer.toLocaleString()} km</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-gray-500 dark:text-gray-400">Engine Hours</div>
                <div className="font-medium">{selectedVehicle.engineHours.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-gray-500 dark:text-gray-400">Last Update</div>
                <div className="font-medium">{formatLastUpdate(selectedVehicle.lastUpdate)}</div>
              </div>
            </div>
            
            {showRoute && vehicleRoute.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">ETA to Destination</span>
                  <span className="font-medium">{calculateETA(5.8, selectedVehicle.speed || 50)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5.8 km</span>
                  <span>3.8 km left</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get compass direction from degrees
const getCompassDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export default LiveTracking;