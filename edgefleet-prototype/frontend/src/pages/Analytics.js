import React, { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiRefreshCw, FiTrendingUp, FiDroplet, FiClock, FiMapPin } from 'react-icons/fi';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalTrips: 0,
    totalDistance: 0,
    avgSpeed: 0,
    fuelEfficiency: 0,
  });

  // Mock data for charts
  const [chartData, setChartData] = useState({
    trips: [],
    fuel: [],
    speed: [],
    distance: [],
  });

  // Simulate data fetching
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data based on time range
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const now = new Date();
      
      const labels = Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (days - i - 1));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      // Generate random data points
      const generateRandomData = (min, max, variation = 0.3) => {
        return Array.from({ length: days }, () => 
          Math.floor(Math.random() * (max - min) + min * (1 - variation + Math.random() * variation))
        );
      };
      
      setChartData({
        labels,
        trips: generateRandomData(10, 100),
        fuel: generateRandomData(5, 20, 0.2).map(v => (v * 0.1).toFixed(1)),
        speed: generateRandomData(40, 90, 0.15),
        distance: generateRandomData(50, 500, 0.25),
      });
      
      setMetrics({
        totalTrips: Math.floor(Math.random() * 1000) + 500,
        totalDistance: (Math.random() * 50000 + 10000).toFixed(0),
        avgSpeed: Math.floor(Math.random() * 30) + 50,
        fuelEfficiency: (Math.random() * 5 + 8).toFixed(1),
      });
      
      setLoading(false);
    };
    
    fetchAnalytics();
  }, [timeRange]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
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
  };

  const tripsChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Trips',
        data: chartData.trips,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const fuelChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Fuel Consumption (L/100km)',
        data: chartData.fuel,
        backgroundColor: 'rgba(234, 88, 12, 0.6)',
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const speedChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Average Speed (km/h)',
        data: chartData.speed,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const distanceChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Distance (km)',
        data: chartData.distance,
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const vehicleDistributionData = {
    labels: ['Trucks', 'Vans', 'Cars', 'Bikes'],
    datasets: [
      {
        data: [35, 25, 25, 15],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 88, 12, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(234, 88, 12, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Gain insights into your fleet's performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
          </select>
          <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center">
            <FiDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FiTrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trips</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? '--' : metrics.totalTrips.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <span>+12.5%</span>
                <FiTrendingUp className="ml-1" />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <FiDroplet className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fuel Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? '--' : metrics.fuelEfficiency} km/L
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <span>-2.3%</span>
                <FiTrendingUp className="ml-1 transform rotate-180" />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <FiClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Speed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? '--' : metrics.avgSpeed} km/h
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <span>+5.2%</span>
                <FiTrendingUp className="ml-1" />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <FiMapPin className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Distance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {loading ? '--' : metrics.totalDistance} km
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <span>+8.7%</span>
                <FiTrendingUp className="ml-1" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Trips Overview</h3>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <Line data={tripsChartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fuel Efficiency</h3>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <Line data={fuelChartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Average Speed</h3>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <Line data={speedChartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vehicle Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <div className="w-full h-full max-w-md mx-auto">
                <Pie 
                  data={vehicleDistributionData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'right',
                      },
                    },
                    aspectRatio: 1,
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Distance Covered</h3>
        </div>
        <div className="p-6">
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <Bar data={distanceChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;