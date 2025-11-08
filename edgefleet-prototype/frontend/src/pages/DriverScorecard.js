import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiAward, FiAlertTriangle, FiClock, FiTrendingUp, 
  FiActivity, FiFilter, FiSearch, FiDownload, FiUser, FiTruck, FiCalendar
} from 'react-icons/fi';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  RadialLinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  RadialLinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data for drivers
const generateMockDrivers = () => {
  const drivers = [];
  const firstNames = ['John', 'Mike', 'Sarah', 'David', 'Emma', 'James', 'Emily', 'Robert', 'Olivia', 'William'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
  const vehicles = ['Truck #', 'Van #', 'Car #'];
  
  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const vehicleType = vehicles[Math.floor(Math.random() * vehicles.length)];
    const vehicleNumber = Math.floor(1000 + Math.random() * 9000);
    
    drivers.push({
      id: `DRV${1000 + i}`,
      name: `${firstName} ${lastName}`,
      avatar: `https://i.pravatar.cc/150?u=${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      vehicle: `${vehicleType}${vehicleNumber}`,
      score: Math.floor(60 + Math.random() * 40), // 60-100
      trips: Math.floor(10 + Math.random() * 100),
      distance: (1000 + Math.random() * 10000).toFixed(0),
      hours: (50 + Math.random() * 200).toFixed(1),
      incidents: Math.floor(Math.random() * 5),
      fuelEfficiency: (5 + Math.random() * 10).toFixed(1),
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      joinDate: new Date(2023 - Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    });
  }
  
  return drivers.sort((a, b) => b.score - a.score);
};

const DriverScorecard = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
  const [filters, setFilters] = useState({
    minScore: 0,
    maxIncidents: 10,
    vehicleType: 'all'
  });

  // Generate mock data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setDrivers(generateMockDrivers());
      setLoading(false);
    };
    
    loadData();
  }, [timeRange]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const filteredAndSortedDrivers = useMemo(() => {
    let result = [...drivers];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(driver => 
        driver.name.toLowerCase().includes(term) || 
        driver.id.toLowerCase().includes(term) ||
        driver.vehicle.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    result = result.filter(driver => 
      driver.score >= filters.minScore &&
      driver.incidents <= filters.maxIncidents &&
      (filters.vehicleType === 'all' || driver.vehicle.startsWith(filters.vehicleType.split(' ')[0]))
    );
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [drivers, searchTerm, sortConfig, filters]);

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get score label
  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  // Radar chart data for driver details
  const getDriverRadarData = (driver) => ({
    labels: ['Safety', 'Efficiency', 'Compliance', 'Punctuality', 'Fuel Economy'],
    datasets: [
      {
        label: 'Performance',
        data: [
          driver.score + (Math.random() * 10 - 5),
          driver.score + (Math.random() * 10 - 10),
          driver.score + (Math.random() * 5 - 2.5),
          driver.score + (Math.random() * 8 - 4),
          driver.score + (Math.random() * 15 - 5)
        ].map(n => Math.max(10, Math.min(100, n))), // Ensure values are between 10-100
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  });

  // Chart options
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // Bar chart data for driver comparison
  const comparisonChartData = {
    labels: ['Safety Score', 'Trips', 'Distance (km)', 'Fuel Eff. (km/L)', 'Incidents'],
    datasets: [
      {
        label: 'Driver',
        data: selectedDriver ? [
          selectedDriver.score,
          selectedDriver.trips,
          selectedDriver.distance / 100,
          selectedDriver.fuelEfficiency * 2,
          selectedDriver.incidents * 10
        ] : [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Fleet Avg',
        data: [
          drivers.reduce((sum, d) => sum + d.score, 0) / Math.max(1, drivers.length),
          drivers.reduce((sum, d) => sum + d.trips, 0) / Math.max(1, drivers.length),
          drivers.reduce((sum, d) => sum + parseFloat(d.distance), 0) / Math.max(1, drivers.length * 100),
          (drivers.reduce((sum, d) => sum + parseFloat(d.fuelEfficiency), 0) / Math.max(1, drivers.length)) * 2,
          (drivers.reduce((sum, d) => sum + d.incidents, 0) / Math.max(1, drivers.length)) * 10
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgba(107, 114, 128, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              // Customize tooltip values based on the label
              switch(context.label) {
                case 'Safety Score':
                  return `${label}${context.parsed.y.toFixed(0)}/100`;
                case 'Fuel Eff. (km/L)':
                  return `${label}${(context.parsed.y / 2).toFixed(1)}`;
                case 'Incidents':
                  return `${label}${(context.parsed.y / 10).toFixed(1)}`;
                case 'Distance (km)':
                  return `${label}${(context.parsed.y * 100).toLocaleString()}`;
                default:
                  return `${label}${context.parsed.y.toFixed(0)}`;
              }
            }
            return label;
          }
        }
      }
    },
  };

  // Close driver details modal
  const closeModal = () => {
    setSelectedDriver(null);
  };

  // Handle outside click for modal
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Scorecard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and analyze driver performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <select 
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm pr-8 pl-3 py-2 w-full"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 12 months</option>
            </select>
            <FiCalendar className="absolute right-2.5 top-2.5 text-gray-400 text-sm" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Score</label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-10">
                {filters.minScore}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Incidents</label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="10"
                value={filters.maxIncidents}
                onChange={(e) => setFilters({...filters, maxIncidents: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-4">
                {filters.maxIncidents}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Type</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filters.vehicleType}
              onChange={(e) => setFilters({...filters, vehicleType: e.target.value})}
            >
              <option value="all">All Vehicles</option>
              <option value="Truck">Trucks</option>
              <option value="Van">Vans</option>
              <option value="Car">Cars</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Driver
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('vehicle')}
                >
                  <div className="flex items-center">
                    Vehicle
                    {sortConfig.key === 'vehicle' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('score')}
                >
                  <div className="flex items-center">
                    <FiAward className="mr-1" /> Score
                    {sortConfig.key === 'score' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('trips')}
                >
                  <div className="flex items-center">
                    <FiActivity className="mr-1" /> Trips
                    {sortConfig.key === 'trips' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('distance')}
                >
                  <div className="flex items-center">
                    <FiMapPin className="mr-1" /> Distance
                    {sortConfig.key === 'distance' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort('incidents')}
                >
                  <div className="flex items-center">
                    <FiAlertTriangle className="mr-1" /> Incidents
                    {sortConfig.key === 'incidents' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading driver data...</p>
                  </td>
                </tr>
              ) : filteredAndSortedDrivers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No drivers found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredAndSortedDrivers.map((driver) => (
                  <tr 
                    key={driver.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={driver.avatar} alt={driver.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{driver.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{driver.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{driver.vehicle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`text-lg font-bold ${getScoreColor(driver.score)}`}>
                          {driver.score}
                        </div>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {getScoreLabel(driver.score)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${getScoreColor(driver.score).replace('text-', 'bg-')}`} 
                          style={{ width: `${driver.score}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{driver.trips}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {parseInt(driver.distance).toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        driver.incidents === 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : driver.incidents < 3 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {driver.incidents} {driver.incidents === 1 ? 'incident' : 'incidents'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        View
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                        <FiDownload className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Details Modal */}
      <AnimatePresence>
        {selectedDriver && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto modal-overlay"
            onClick={handleOutsideClick}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-80"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              >
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            {selectedDriver.name}'s Performance
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedDriver.vehicle} • {selectedDriver.id}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <div className={`text-2xl font-bold ${getScoreColor(selectedDriver.score)}`}>
                              {selectedDriver.score}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {getScoreLabel(selectedDriver.score)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="bg-white dark:bg-gray-700 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={closeModal}
                          >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Driver Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-700 dark:text-gray-200">{selectedDriver.name}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FiTruck className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-700 dark:text-gray-200">{selectedDriver.vehicle}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Member since {selectedDriver.joinDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Performance Metrics</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-white dark:bg-gray-600 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-300">Trips</div>
                              <div className="font-semibold">{selectedDriver.trips}</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-600 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-300">Distance</div>
                              <div className="font-semibold">{parseInt(selectedDriver.distance).toLocaleString()} km</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-600 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-300">Fuel Eff.</div>
                              <div className="font-semibold">{selectedDriver.fuelEfficiency} km/L</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-600 rounded">
                              <div className="text-xs text-gray-500 dark:text-gray-300">Incidents</div>
                              <div className="font-semibold">{selectedDriver.incidents}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">Performance Radar</h4>
                          <div className="h-40">
                            <Radar data={getDriverRadarData(selectedDriver)} options={radarOptions} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 bg-white dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-4">Performance vs Fleet Average</h4>
                        <div className="h-64">
                          <Bar data={comparisonChartData} options={barChartOptions} />
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiDownload className="-ml-1 mr-2 h-4 w-4" />
                          Export Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverScorecard;