import React, { useState, useEffect } from 'react';
import { 
  FiMap, FiTruck, FiClock, FiX, FiPlus, 
  FiSave, FiSearch, FiBarChart2, FiMapPin, 
  FiTrash2, FiMenu, FiBell, FiCheckCircle, 
  FiDollarSign, FiCalendar, FiAlertTriangle, 
  FiAward, FiAlertCircle, FiInfo, FiAlertOctagon,
  FiStopCircle, FiActivity, FiCornerRightDown
} from 'react-icons/fi';

const RouteOptimization = () => {
  // State management
  const [activeTab, setActiveTab] = useState('planner');
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [error, setError] = useState('');
  const [routeName, setRouteName] = useState('');

  // Fetch saved routes on component mount
  useEffect(() => {
    fetchSavedRoutes();
  }, []);

  // Fetch saved routes from the backend
  const fetchSavedRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/routes`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Failed to load saved routes');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location search
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.slice(0, 5));
    } catch (error) {
      console.error('Error searching locations:', error);
      setError('Failed to search locations');
    }
  };

  // Add a waypoint to the route
  const addWaypoint = (location) => {
    const newWaypoint = {
      id: `wp-${Date.now()}`,
      name: location.display_name || `Location ${waypoints.length + 1}`,
      position: [parseFloat(location.lat), parseFloat(location.lon)],
      address: location.display_name || '',
      stopTime: 15 // Default stop time in minutes
    };
    setWaypoints([...waypoints, newWaypoint]);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove a waypoint from the route
  const removeWaypoint = (id) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
  };

  // Optimize the current route
  const optimizeRoute = async () => {
    if (waypoints.length < 2) {
      setError('Please add at least 2 waypoints to create a route');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waypoints: waypoints.map(wp => ({
            lat: wp.position[0],
            lng: wp.position[1],
            name: wp.name,
            address: wp.address
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize route');
      }

      const data = await response.json();
      setOptimizedRoute(data);
    } catch (error) {
      console.error('Error optimizing route:', error);
      setError('Failed to optimize route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save the optimized route
  const saveRoute = async (name) => {
    if (!name || !optimizedRoute) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          waypoints,
          optimizedRoute,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        await fetchSavedRoutes();
        setShowNewRouteModal(false);
        setRouteName('');
      } else {
        throw new Error('Failed to save route');
      }
    } catch (error) {
      console.error('Error saving route:', error);
      setError('Failed to save route');
    } finally {
      setIsLoading(false);
    }
  };

  // Load a saved route
  const loadRoute = (route) => {
    setSelectedRoute(route);
    setWaypoints(route.waypoints || []);
    setOptimizedRoute(route.optimizedRoute || null);
  };

  // Clear the current route
  const clearRoute = () => {
    setWaypoints([]);
    setOptimizedRoute(null);
    setSelectedRoute(null);
    setError('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Route Optimization</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              {/* Search and Add Waypoints */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Route</h2>
                
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a location..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSearch className="mr-2 h-4 w-4" />
                    Search
                  </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                      {searchResults.map((result, index) => (
                        <li 
                          key={index} 
                          className="p-3 hover:bg-gray-50 cursor-pointer" 
                          onClick={() => addWaypoint(result)}
                        >
                          <div className="font-medium">{result.display_name.split(',')[0]}</div>
                          <div className="text-sm text-gray-500">{result.display_name}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Waypoints List */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Waypoints ({waypoints.length})
                </h3>
                {waypoints.length === 0 ? (
                  <p className="text-sm text-gray-500">No waypoints added yet. Search and add locations above.</p>
                ) : (
                  <ul className="border rounded-md divide-y divide-gray-200">
                    {waypoints.map((waypoint, index) => (
                      <li key={waypoint.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {waypoint.name || `Waypoint ${index + 1}`}
                          </div>
                          {waypoint.address && (
                            <div className="text-sm text-gray-500 truncate">{waypoint.address}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeWaypoint(waypoint.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove waypoint"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={optimizeRoute}
                  disabled={waypoints.length < 2 || isLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${waypoints.length < 2 || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                >
                  {isLoading ? 'Optimizing...' : 'Optimize Route'}
                </button>
                
                <button
                  onClick={() => setShowNewRouteModal(true)}
                  disabled={!optimizedRoute || isLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${!optimizedRoute || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
                >
                  <FiSave className="mr-2 h-4 w-4" />
                  Save Route
                </button>
                
                <button
                  onClick={clearRoute}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Clear All
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimized Route Details */}
              {optimizedRoute && (
                <div className="mt-6 p-4 bg-green-50 rounded-md">
                  <h3 className="text-md font-medium text-green-800 mb-2">Optimized Route Ready!</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded-md shadow">
                      <div className="text-sm text-gray-500">Total Distance</div>
                      <div className="text-lg font-semibold">
                        {(optimizedRoute.distance / 1000).toFixed(1)} km
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-md shadow">
                      <div className="text-sm text-gray-500">Estimated Time</div>
                      <div className="text-lg font-semibold">
                        {Math.round(optimizedRoute.duration / 60)} minutes
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-md shadow">
                      <div className="text-sm text-gray-500">Stops</div>
                      <div className="text-lg font-semibold">{waypoints.length} locations</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Saved Routes */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Saved Routes</h2>
            </div>
            
            {isLoading && routes.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading saved routes...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FiMap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No saved routes</h3>
                <p className="mt-1 text-sm text-gray-500">Create and save your first route to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {route.waypoints?.length || 0} stops
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Created on {new Date(route.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => loadRoute(route)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiMapPin className="mr-2 h-4 w-4" />
                          Load
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Route Modal */}
      {showNewRouteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Save Route</h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Enter a name for this route"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={() => saveRoute(routeName)}
                  disabled={!routeName.trim() || isLoading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${!routeName.trim() || isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} text-base font-medium text-white sm:col-start-2 sm:text-sm`}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRouteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;
