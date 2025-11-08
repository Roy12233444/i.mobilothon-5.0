import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMenu, FiX, FiHome, FiTruck, FiMap, FiAlertCircle, 
  FiBarChart2, FiSettings, FiUser, FiBell, FiSearch, 
  FiFilter, FiChevronRight, FiClock, FiNavigation, 
  FiDroplet, FiActivity, FiCalendar, FiPlus, FiCheckCircle,
  FiUserPlus, FiMessageSquare, FiDownload, FiUpload, FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for vehicles
const mockVehicles = Array.from({ length: 15 }, (_, i) => ({
  id: `VH${1000 + i}`,
  driver: `Driver ${String.fromCharCode(65 + i)}`,
  status: ['active', 'inactive', 'maintenance'][Math.floor(Math.random() * 3)],
  type: ['Truck', 'Van', 'Car', 'Bike'][Math.floor(Math.random() * 4)],
  plateNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(1000 + Math.random() * 9000)}`,
  speed: Math.floor(Math.random() * 120),
  fuelLevel: Math.floor(10 + Math.random() * 90),
  odometer: Math.floor(1000 + Math.random() * 100000),
  lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
  location: {
    address: `${Math.floor(100 + Math.random() * 900)} ${['Main', 'Oak', 'Pine', 'Maple', 'Elm'][Math.floor(Math.random() * 5)]} St`,
    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
    state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)]
  },
  alerts: Math.floor(Math.random() * 5),
  speedLimit: 70 + Math.floor(Math.random() * 20)
}));

// Mock data for alerts
const mockAlerts = [
  { id: 1, type: 'speeding', message: 'Speeding detected', vehicleId: 'VH1001', time: '2 min ago', priority: 'high' },
  { id: 2, type: 'maintenance', message: 'Maintenance required', vehicleId: 'VH1005', time: '15 min ago', priority: 'medium' },
  { id: 3, type: 'geofence', message: 'Vehicle left geofence', vehicleId: 'VH1010', time: '1 hour ago', priority: 'high' },
  { id: 4, type: 'fuel', message: 'Low fuel warning', vehicleId: 'VH1003', time: '3 hours ago', priority: 'medium' },
  { id: 5, type: 'harsh_braking', message: 'Harsh braking detected', vehicleId: 'VH1007', time: '5 hours ago', priority: 'low' },
];

// Mock data for quick actions
const quickActions = [
  { id: 1, icon: <FiPlus size={20} />, label: 'New Trip', color: 'bg-blue-500' },
  { id: 2, icon: <FiUserPlus size={20} />, label: 'Add Driver', color: 'bg-green-500' },
  { id: 3, icon: <FiMessageSquare size={20} />, label: 'Send Message', color: 'bg-purple-500' },
  { id: 4, icon: <FiDownload size={20} />, label: 'Export Data', color: 'bg-amber-500' },
];

const MobileView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [showAlerts, setShowAlerts] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    sortBy: 'status',
  });

  const sidebarRef = useRef();
  const searchRef = useRef();

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && showSidebar) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar]);

  // Filter vehicles based on search and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || vehicle.status === filters.status;
    const matchesType = filters.type === 'all' || vehicle.type === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (filters.sortBy === 'status') {
      return a.status.localeCompare(b.status) || a.driver.localeCompare(b.driver);
    } else if (filters.sortBy === 'type') {
      return a.type.localeCompare(b.type) || a.driver.localeCompare(b.driver);
    } else {
      return a.driver.localeCompare(b.driver);
    }
  });

  // Format last updated time
  const formatLastUpdated = (date) => {
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

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setActiveVehicle(vehicle);
    setShowVehicleDetails(true);
  };

  // Handle alert dismiss
  const handleDismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  // Toggle vehicle status
  const toggleVehicleStatus = (id) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === id 
        ? { ...vehicle, status: vehicle.status === 'active' ? 'inactive' : 'active' } 
        : vehicle
    ));
  };

  // Refresh data
  const refreshData = () => {
    // In a real app, this would fetch fresh data from the API
    setVehicles([...mockVehicles]);
    setAlerts([...mockAlerts]);
  };

  // Render the main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'vehicles':
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Fleet</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <FiFilter size={18} />
                </button>
                <button 
                  onClick={refreshData}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <FiRefreshCw size={18} className={showFilters ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                      className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Types</option>
                      <option value="Truck">Trucks</option>
                      <option value="Van">Vans</option>
                      <option value="Car">Cars</option>
                      <option value="Bike">Bikes</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                      className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="status">Status</option>
                      <option value="type">Vehicle Type</option>
                      <option value="name">Driver Name</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {sortedVehicles.length > 0 ? (
                sortedVehicles.map(vehicle => (
                  <div 
                    key={vehicle.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            vehicle.status === 'active' ? 'bg-green-500' : 
                            vehicle.status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-500'
                          }`}></div>
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {vehicle.driver}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {vehicle.type} • {vehicle.plateNumber}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <FiMapPin className="mr-1" size={12} />
                          <span className="truncate">
                            {vehicle.location.address}, {vehicle.location.city}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : vehicle.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                        </span>
                        <div className="mt-2 flex items-center">
                          <FiActivity className="mr-1 text-blue-500" size={14} />
                          <span className="text-xs font-medium">{vehicle.speed} km/h</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <FiDroplet className="mr-1" size={12} />
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mr-2">
                          <div 
                            className={`h-1.5 rounded-full ${
                              vehicle.fuelLevel > 30 ? 'bg-green-600' : 
                              vehicle.fuelLevel > 15 ? 'bg-yellow-500' : 'bg-red-600'
                            }`} 
                            style={{ width: `${vehicle.fuelLevel}%` }}
                          ></div>
                        </div>
                        <span>{vehicle.fuelLevel}%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastUpdated(vehicle.lastUpdated)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No vehicles found matching your criteria
                </div>
              )}
            </div>
          </div>
        );
      
      case 'alerts':
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Alerts</h2>
              <button 
                onClick={refreshData}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <FiRefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-xl ${
                      alert.priority === 'high' 
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800' 
                        : alert.priority === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0
                      ">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            alert.priority === 'high' ? 'bg-red-500' : 
                            alert.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {alert.message}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {alert.vehicleId} • {alert.time}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissAlert(alert.id);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <FiCheckCircle className="text-green-500" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Alerts</h3>
                  <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Analytics</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Vehicles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {vehicles.filter(v => v.status === 'active').length}
                </p>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Alerts Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-red-500 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Speed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length)} km/h
                </p>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Fuel Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(vehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / vehicles.length)}%
                </p>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div className="h-1 bg-yellow-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Vehicle Status</h3>
                <span className="text-xs text-blue-600 dark:text-blue-400">View All</span>
              </div>
              <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
                [Vehicle Status Chart Placeholder]
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Recent Activities</h3>
                <span className="text-xs text-blue-600 dark:text-blue-400">View All</span>
              </div>
              <div className="space-y-3">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-start">
                    <div className={`p-1.5 rounded-full ${
                      alert.priority === 'high' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-500' 
                        : alert.priority === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                    }`}>
                      <FiAlertCircle size={16} />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.vehicleId} • {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FiUser size={40} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">John Doe</h2>
              <p className="text-gray-500 dark:text-gray-400">Fleet Manager</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Account Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@example.com</p>
                  </div>
                  <button className="text-sm text-blue-600 dark:text-blue-400">Edit</button>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">+1 (555) 123-4567</p>
                  </div>
                  <button className="text-sm text-blue-600 dark:text-blue-400">Edit</button>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">•••••••••</p>
                  </div>
                  <button className="text-sm text-blue-600 dark:text-blue-400">Change</button>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Preferences</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Notifications</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Location Services</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <button className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg">
              Sign Out
            </button>
          </div>
        );

      default: // dashboard
        return (
          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">John Doe</h1>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <FiBell size={20} />
                  {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alerts.length > 9 ? '9+' : alerts.length}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showAlerts && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-10 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                          <button 
                            onClick={() => setShowAlerts(false)}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {alerts.length > 0 ? (
                          alerts.map(alert => (
                            <div 
                              key={alert.id}
                              className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              onClick={() => {
                                setActiveTab('alerts');
                                setShowAlerts(false);
                              }}
                            >
                              <div className="flex items-start">
                                <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                                  alert.priority === 'high' ? 'bg-red-500' : 
                                  alert.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}></div>
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {alert.vehicleId} • {alert.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                              <FiBell className="text-gray-400" size={20} />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                          </div>
                        )}
                      </div>
                      {alerts.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
                          <button 
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                            onClick={() => {
                              setActiveTab('alerts');
                              setShowAlerts(false);
                            }}
                          >
                            View All Alerts
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                ref={searchRef}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search vehicles, drivers, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FiX className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                </button>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl ${action.color} text-white`}
                  onClick={() => {
                    // Handle quick action
                    if (action.label === 'New Trip') setActiveTab('vehicles');
                    if (action.label === 'Add Driver') setActiveTab('profile');
                  }}
                >
                  {action.icon}
                  <span className="mt-2 text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
            
            {/* Active Vehicles */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Vehicles</h2>
                <button 
                  className="text-sm text-blue-600 dark:text-blue-400"
                  onClick={() => setActiveTab('vehicles')}
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {vehicles
                  .filter(vehicle => vehicle.status === 'active')
                  .slice(0, 3)
                  .map(vehicle => (
                    <div 
                      key={vehicle.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center"
                      onClick={() => {
                        setActiveVehicle(vehicle);
                        setShowVehicleDetails(true);
                      }}
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <FiTruck className="text-blue-500" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {vehicle.driver}
                          </h3>
                          <div className="ml-2 w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {vehicle.type} • {vehicle.plateNumber}
                        </p>
                      </div>
                      <FiChevronRight className="text-gray-400" />
                    </div>
                  ))}
                
                {vehicles.filter(vehicle => vehicle.status === 'active').length === 0 && (
                  <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No active vehicles</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Alerts */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Alerts</h2>
                <button 
                  className="text-sm text-blue-600 dark:text-blue-400"
                  onClick={() => setActiveTab('alerts')}
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.slice(0, 3).map(alert => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-xl ${
                        alert.priority === 'high' 
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50' 
                          : alert.priority === 'medium'
                            ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30'
                            : 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30'
                      }`}
                      onClick={() => {
                        const vehicle = vehicles.find(v => v.id === alert.vehicleId);
                        if (vehicle) {
                          setActiveVehicle(vehicle);
                          setShowVehicleDetails(true);
                        }
                      }}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                          alert.priority === 'high' ? 'bg-red-500' : 
                          alert.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {alert.vehicleId} • {alert.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No recent alerts</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  // Render vehicle details modal
  const renderVehicleDetails = () => {
    if (!activeVehicle) return null;
    
    return (
      <AnimatePresence>
        {showVehicleDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowVehicleDetails(false)}
            ></motion.div>
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Details</h2>
                  <button 
                    onClick={() => setShowVehicleDetails(false)}
                    className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center mr-3">
                      <FiTruck className="text-blue-500" size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {activeVehicle.driver}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activeVehicle.type} • {activeVehicle.plateNumber}
                      </p>
                      <div className="mt-1 flex items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${
                          activeVehicle.status === 'active' ? 'bg-green-500' : 
                          activeVehicle.status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {activeVehicle.status.charAt(0).toUpperCase() + activeVehicle.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Speed</p>
                    <div className="flex items-center">
                      <FiActivity className="text-blue-500 mr-1.5" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activeVehicle.speed} <span className="text-xs text-gray-500 dark:text-gray-400">km/h</span>
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                      <div 
                        className={`h-1 rounded-full ${
                          activeVehicle.speed > activeVehicle.speedLimit 
                            ? 'bg-red-500' 
                            : activeVehicle.speed > activeVehicle.speedLimit * 0.8 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`} 
                        style={{ width: `${Math.min(100, (activeVehicle.speed / 120) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Speed Limit: {activeVehicle.speedLimit} km/h
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fuel Level</p>
                    <div className="flex items-center">
                      <FiDroplet className="text-blue-500 mr-1.5" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activeVehicle.fuelLevel}%
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-100 dark:bg-gray-600 rounded-full">
                      <div 
                        className={`h-1 rounded-full ${
                          activeVehicle.fuelLevel > 30 ? 'bg-green-500' : 
                          activeVehicle.fuelLevel > 15 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${activeVehicle.fuelLevel}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last updated: {formatLastUpdated(activeVehicle.lastUpdated)}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Odometer</p>
                    <div className="flex items-center">
                      <FiNavigation className="text-blue-500 mr-1.5" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activeVehicle.odometer.toLocaleString()} <span className="text-xs text-gray-500 dark:text-gray-400">km</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Alerts</p>
                    <div className="flex items-center">
                      <FiAlertCircle className="text-blue-500 mr-1.5" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activeVehicle.alerts} {activeVehicle.alerts === 1 ? 'Alert' : 'Alerts'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-100 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Location</h3>
                  <div className="flex items-start">
                    <FiMapPin className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" size={16} />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activeVehicle.location.address}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeVehicle.location.city}, {activeVehicle.location.state}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-32 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                    [Map View]
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    <FiNavigation className="mr-2" size={16} />
                    Navigate
                  </button>
                  <button 
                    className={`flex items-center justify-center py-2.5 px-4 font-medium rounded-lg transition-colors ${
                      activeVehicle.status === 'active'
                        ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400'
                        : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400'
                    }`}
                    onClick={() => toggleVehicleStatus(activeVehicle.id)}
                  >
                    {activeVehicle.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'vehicles' ? 'Fleet' : 
               activeTab === 'alerts' ? 'Alerts' :
               activeTab === 'analytics' ? 'Analytics' : 'Profile'}
            </h1>
          </div>
          <div className="flex items-center">
            <button 
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setActiveTab('alerts')}
            >
              <div className="relative">
                <FiBell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alerts.length > 9 ? '9+' : alerts.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === 'dashboard' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FiHome size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('vehicles')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === 'vehicles' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FiTruck size={20} />
            <span className="text-xs mt-1">Fleet</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === 'alerts' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <FiAlertCircle size={20} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center text-[10px]">
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Alerts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === 'analytics' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FiBarChart2 size={20} />
            <span className="text-xs mt-1">Analytics</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === 'profile' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FiUser size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
      
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setShowSidebar(false)}
            ></motion.div>
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl z-40 overflow-y-auto"
              ref={sidebarRef}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">EdgeFleet</h2>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fleet Management System</p>
              </div>
              
              <div className="p-2">
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setActiveTab('dashboard');
                      setShowSidebar(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                      activeTab === 'dashboard' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiHome className="mr-3" size={18} />
                    <span>Dashboard</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('vehicles');
                      setShowSidebar(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                      activeTab === 'vehicles' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiTruck className="mr-3" size={18} />
                    <span>Fleet Management</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('alerts');
                      setShowSidebar(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                      activeTab === 'alerts' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative mr-3">
                      <FiAlertCircle size={18} />
                      {alerts.length > 0 && (
                        <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                          {alerts.length > 9 ? '9+' : alerts.length}
                        </span>
                      )}
                    </div>
                    <span>Alerts & Notifications</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('analytics');
                      setShowSidebar(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                      activeTab === 'analytics' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiBarChart2 className="mr-3" size={18} />
                    <span>Analytics</span>
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  
                  <button 
                    onClick={() => {
                      setActiveTab('profile');
                      setShowSidebar(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-left rounded-lg ${
                      activeTab === 'profile' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiUser className="mr-3" size={18} />
                    <span>My Profile</span>
                  </button>
                  
                  <button className="flex items-center w-full px-4 py-3 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FiSettings className="mr-3" size={18} />
                    <span>Settings</span>
                  </button>
                </div>
                
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Need help?</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Check our documentation or contact our support team.</p>
                  <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Contact Support
                  </button>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">JD</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fleet Manager</p>
                    </div>
                    <button className="ml-auto text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <FiLogOut size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Vehicle Details Modal */}
      {renderVehicleDetails()}
    </div>
  );
};

export default MobileView;