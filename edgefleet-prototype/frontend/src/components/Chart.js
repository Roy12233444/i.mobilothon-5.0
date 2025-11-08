import React, { useState, useEffect, useRef } from 'react';
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
import { Bar, Line, Pie } from 'react-chartjs-2';
import { FiDownload, FiRefreshCw, FiChevronDown } from 'react-icons/fi';

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

const chartTypes = [
  { id: 'bar', label: 'Bar Chart' },
  { id: 'line', label: 'Line Chart' },
  { id: 'pie', label: 'Pie Chart' },
];

const timeRanges = [
  { id: 'day', label: 'Last 24 Hours' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'Last 30 Days' },
];

const Chart = ({
  title = 'Analytics Overview',
  data: externalData,
  type: externalType = 'bar',
  timeRange: externalTimeRange = 'week',
  onRefresh,
  className = '',
}) => {
  const [chartType, setChartType] = useState(externalType);
  const [timeRange, setTimeRange] = useState(externalTimeRange);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);
  const timeMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (timeMenuRef.current && !timeMenuRef.current.contains(event.target)) {
        setIsTimeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate sample data if no external data provided
  const generateData = () => {
    const labels = [];
    const now = new Date();
    let count = 7; // Default to week

    if (timeRange === 'day') {
      count = 24; // Hours in a day
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i);
        labels.push(date.toLocaleTimeString([], { hour: '2-digit' }));
      }
    } else if (timeRange === 'month') {
      count = 30; // Days in a month
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
    } else {
      // Week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString([], { weekday: 'short' }));
      }
    }

    const data = labels.map(() => Math.floor(Math.random() * 100));
    return { labels, data };
  };

  const { labels, data } = externalData || generateData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Value',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line',
      },
    ],
  };

  const options = {
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `chart-${new Date().toISOString().split('T')[0]}.png`;
    const canvas = document.getElementById('chart-canvas');
    if (canvas) {
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsLoading(true);
      try {
        await onRefresh();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderChart = () => {
    const chartProps = {
      data: chartData,
      options,
      id: 'chart-canvas',
    };

    switch (chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} options={{ ...options, aspectRatio: 1.5 }} />;
      case 'bar':
      default:
        return <Bar {...chartProps} />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {timeRanges.find((tr) => tr.id === timeRange)?.label}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Time Range Selector */}
          <div className="relative" ref={timeMenuRef}>
            <button
              onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              {timeRanges.find((tr) => tr.id === timeRange)?.label}
              <FiChevronDown className="ml-2" />
            </button>
            {isTimeMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setTimeRange(range.id);
                      setIsTimeMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      timeRange === range.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chart Type Selector */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto"
            >
              {chartTypes.find((ct) => ct.id === chartType)?.label}
              <FiChevronDown className="ml-2" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                {chartTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setChartType(type.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      chartType === type.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Download chart"
            >
              <FiDownload className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Refresh data"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="h-80 w-full">{renderChart()}</div>
      </div>
    </div>
  );
};

export default Chart;