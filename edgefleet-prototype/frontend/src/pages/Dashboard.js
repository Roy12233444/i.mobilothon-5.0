// File: src/pages/Dashboard.js
// Clean, hook-order-safe Dashboard component for EdgeFleet
// - All hooks declared unconditionally near the top of the component
// - Single unified mount effect that fetches initial data and sets up WebSocket
// - Safe cleanup and defensive checks for websocket API variations (on/subscribe)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from '../components/MapView';
import { FiTruck } from 'react-icons/fi';
import { 
  fetchVehicles,
  fetchDrivers,
  fetchAlerts,
  fetchAnalytics,
  fetchTelemetry
} from '../services/api';
import { webSocketService } from '../services/websocketService';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);



const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// -----------------------------
// Component
// -----------------------------
const Dashboard = () => {
  // --- State ---
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [filter, setFilter] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState(null);
  const [routesVisible, setRoutesVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Refs
  const isMounted = useRef(true);
  const mapRef = useRef(null);

  // -----------------------------
  // Helpers to normalize API responses
  // -----------------------------
  const safeList = (res) => res?.data?.vehicles ?? res?.data ?? res ?? [];
  const safeDrivers = (res) => res?.data?.drivers ?? res?.data ?? res ?? [];
  const safeAlerts = (res) => res?.data?.alerts ?? res?.data ?? res ?? [];
  const safeTelemetry = (res) => res?.data?.telemetry ?? res?.data ?? res ?? [];

  // -----------------------------
  // Callbacks (hooks must be declared unconditionally)
  // -----------------------------
  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry(prev => [data, ...prev].slice(0, 100));
  }, []);

  const handleDriverUpdate = useCallback((data) => {
    setDrivers(prev => {
      const index = prev.findIndex(d => d.id === data.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      }
      return [...prev, data];
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const [vehiclesRes, driversRes, alertsRes, analyticsRes, telemetryRes] = await Promise.all([
        fetchVehicles(),
        fetchDrivers(),
        fetchAlerts({ limit: 10, status: 'open' }),
        fetchAnalytics(),
        fetchTelemetry({ limit: 50, sort: '-timestamp' })
      ]);

      if (isMounted.current) {
        // Only update state if component is still mounted
        setVehicles(safeList(vehiclesRes));
        setDrivers(safeDrivers(driversRes));
        setAlerts(safeAlerts(alertsRes));
        setAnalytics(analyticsRes?.data || {});
        setTelemetry(safeTelemetry(telemetryRes));

        // Show success toast if any data was loaded
        if (vehiclesRes?.data?.length || driversRes?.data?.length) {
          toast.success('Dashboard data loaded successfully');
        } else {
          toast.warn('No data available. The server might be empty.');
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      if (isMounted.current) {
        setError(err);
        // Show error toast without depending on state
        toast.error('Failed to load dashboard data. Some features may be limited.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // WebSocket + initial load effect (single effect to avoid multiple conditional hooks)
  useEffect(() => {
    isMounted.current = true;

    // Function to initialize everything
    const init = async () => {
      // Initial fetch
      await fetchData();

      // Setup WebSocket connection if available
      try {
        if (webSocketService && typeof webSocketService.connect === 'function') {
          await webSocketService.connect();
        }

        // connection-status events can be named differently; register defensively
        if (webSocketService && typeof webSocketService.on === 'function') {
          webSocketService.on('connection-status', setConnectionStatus);
          webSocketService.on('vehicles:update', (payload) => {
            // payload might be telemetry or vehicle updates; route to vehicle or telemetry
            if (payload && payload.type === 'telemetry') handleTelemetryUpdate(payload.data);
            else handleTelemetryUpdate(payload);
          });
          webSocketService.on('drivers:update', handleDriverUpdate);
          webSocketService.on('alerts:new', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 50));
            if (['high', 'critical'].includes(alert.severity)) toast.error(`🚨 ${alert.title || alert.message}`);
            else toast.info(`New alert: ${alert.message}`);
          });
        }

        // Some services use subscribe/unsubscribe API
        if (webSocketService && typeof webSocketService.subscribe === 'function') {
          try {
            webSocketService.subscribe('vehicles:update');
            webSocketService.subscribe('drivers:update');
            webSocketService.subscribe('alerts:new');
            webSocketService.subscribe('telemetry:update');
          } catch (e) {
            // ignore subscription errors
          }
        }

      } catch (err) {
        console.warn('WebSocket init failed:', err);
        setConnectionStatus('disconnected');
      }
    };

    init();

    // Cleanup
    return () => {
      isMounted.current = false;
      try {
        if (webSocketService) {
          if (typeof webSocketService.off === 'function') {
            webSocketService.off('connection-status', setConnectionStatus);
            webSocketService.off('vehicles:update', handleTelemetryUpdate);
            webSocketService.off('drivers:update', handleDriverUpdate);
            webSocketService.off('alerts:new');
          }
          if (typeof webSocketService.unsubscribe === 'function') {
            try {
              webSocketService.unsubscribe('vehicles:update');
              webSocketService.unsubscribe('drivers:update');
              webSocketService.unsubscribe('alerts:new');
              webSocketService.unsubscribe('telemetry:update');
            } catch (e) {}
          }
          if (typeof webSocketService.disconnect === 'function') webSocketService.disconnect();
        }
      } catch (cleanupErr) {
        console.error('Error during cleanup:', cleanupErr);
      }
    };
  }, [fetchData, handleTelemetryUpdate, handleDriverUpdate]);

  // Animate polylines when optimizedRoutes updates (hook declared unconditionally)
  useEffect(() => {
    if (!routesVisible || !optimizedRoutes) return;
    const animate = () => {
      try {
        const overlayPane = mapRef.current?.getPane?.('overlayPane');
        if (!overlayPane) return;
        const paths = overlayPane.querySelectorAll('svg path.leaflet-interactive');
        paths.forEach((path, i) => {
          const length = path.getTotalLength ? path.getTotalLength() : 0;
          path.style.transition = 'none';
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.getBoundingClientRect();
          setTimeout(() => { path.style.transition = 'stroke-dashoffset 900ms ease-in-out'; path.style.strokeDashoffset = '0'; }, i * 120);
        });
      } catch (e) { console.warn('polyline animation failed', e); }
    };

    const t = setTimeout(animate, 300);
    return () => clearTimeout(t);
  }, [optimizedRoutes, routesVisible]);

  // --- Helpers / Actions ---
  const handleOptimizeRoutes = useCallback(async () => {
    if (!vehicles || vehicles.length === 0) {
      toast.error('No vehicles available to optimize.');
      return;
    }

    setOptimizing(true);
    
    try {
      const res = await fetch(`${API_URL}/api/optimize-routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles })
      });

      if (!res.ok) throw new Error('Optimization API error');
      const json = await res.json();
      setOptimizedRoutes(json);
      setRoutesVisible(false);
      setTimeout(() => setRoutesVisible(true), 100);
      toast.success('Routes optimized');
    } catch (err) {
      console.error('optimize error', err);
      toast.error(err.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  }, [vehicles]);

  // --- Derived data / charts ---
  const filteredVehicles = (Array.isArray(vehicles) ? vehicles : []).filter(vehicle => {
    if (!filter) return true;
    return (vehicle?.name || '').toLowerCase().includes(filter.toLowerCase());
  });

  const vehicleStatusData = {
    labels: ['Active', 'Idle', 'Maintenance'],
    datasets: [{
      data: [
        (Array.isArray(vehicles) ? vehicles : []).filter(v => v?.status === 'active').length,
        (Array.isArray(vehicles) ? vehicles : []).filter(v => v?.status === 'idle').length,
        (Array.isArray(vehicles) ? vehicles : []).filter(v => v?.status === 'maintenance').length,
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 1,
    }]
  };

  const driverPerformanceData = {
    labels: (Array.isArray(drivers) ? drivers : []).map(d => (d?.name || '—').split(' ')[0]),
    datasets: [{
      label: 'Driver Score',
      data: (Array.isArray(drivers) ? drivers : []).map(d => d?.score ?? 0),
      backgroundColor: '#3b82f6'
    }]
  };

  const routeColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // --- Render ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Loading Dashboard</h2>
          <p className="mt-2 text-gray-600">Fetching the latest data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800">Something went wrong</h2>
          <p className="mt-2 text-gray-600">{error.message || 'Failed to load dashboard'}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">🚛 EdgeFleet</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
            }`}>
              {connectionStatus === 'connected' ? 'Live' : 'Fallback'}
            </span>
            <div className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleString()}</div>
          </div>

          <div className="flex items-center space-x-3">
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search vehicles..." className="px-3 py-2 border rounded-md text-sm w-48" />
            <button onClick={fetchData} className="px-3 py-2 bg-white border rounded-md text-sm hover:shadow">Refresh</button>
            <button onClick={handleOptimizeRoutes} disabled={optimizing} className={`px-3 py-2 rounded-md text-white text-sm ${optimizing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{optimizing ? 'Optimizing...' : 'Optimize Routes'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Vehicles" 
            value={analytics.total_vehicles ?? (Array.isArray(vehicles) ? vehicles.length : 0)} 
            icon="🚛" 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Active Now" 
            value={analytics.active_vehicles ?? (Array.isArray(vehicles) ? vehicles.filter(v => v?.status === 'active').length : 0)} 
            icon="🟢" 
            color="bg-green-500" 
          />
          <StatCard 
            title="Avg Driver Score" 
            value={`${analytics.avg_driver_score ?? 0}%`} 
            icon="⭐" 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Alerts Today" 
            value={analytics.total_alerts ?? (Array.isArray(alerts) ? alerts.length : 0)} 
            icon="⚠️" 
            color="bg-red-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map + routes */}
          <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fleet Map</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">Showing {filteredVehicles.length} vehicles</div>
            </div>

            <div className="h-96 rounded-md overflow-hidden relative">
              <MapView
                vehicles={filteredVehicles}
                optimizedRoutes={optimizedRoutes}
                routesVisible={routesVisible}
                onVehicleClick={setSelectedVehicle}
              />

              {/* Route legend */}
              {optimizedRoutes?.routes?.length > 0 && (
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Routes</div>
                  <div className="space-y-1">
                    {optimizedRoutes.routes.map((r, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-4 h-4 mr-2 rounded" style={{ background: routeColors[i % routeColors.length] }}></span>
                        <span className="truncate">{r.vehicle_id || `Route ${i+1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Route summary */}
            {optimizedRoutes?.summary && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-600 p-3 rounded">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Optimized {optimizedRoutes.summary.num_vehicles_used} routes • {optimizedRoutes.summary.total_distance_km?.toFixed?.(1) ?? '—'} km
                </p>
              </div>
            )}
          </section>

          {/* Alerts */}
          <aside className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.isArray(alerts) ? (
                alerts.length > 0 ? (
                  alerts.slice(0, 10).map((alert, idx) => (
                    <AlertCard key={idx} alert={alert} />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No alerts</p>
                )
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Loading alerts...</p>
              )}
            </div>
          </aside>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Vehicle Status</h2>
            <div className="h-64 flex items-center justify-center">
              <Pie 
                data={vehicleStatusData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: '#9CA3AF' // gray-400 for dark mode
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Driver Performance</h2>
            <div className="h-64">
              <Bar 
                data={driverPerformanceData} 
                options={{ 
                  maintainAspectRatio: false, 
                  scales: { 
                    y: { 
                      beginAtZero: true, 
                      max: 100,
                      ticks: {
                        color: '#9CA3AF' // gray-400 for dark mode
                      },
                      grid: {
                        color: 'rgba(156, 163, 175, 0.2)' // gray-400 with opacity
                      }
                    },
                    x: {
                      ticks: {
                        color: '#9CA3AF' // gray-400 for dark mode
                      },
                      grid: {
                        color: 'rgba(156, 163, 175, 0.2)' // gray-400 with opacity
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: '#9CA3AF' // gray-400 for dark mode
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Vehicles table */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map(vehicle => (
                  <tr 
                    key={vehicle.id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      <div className="flex items-center">
                        <FiTruck className="mr-2 text-blue-500" />
                        <span>{vehicle.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {vehicle.type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vehicle.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : vehicle.status === 'inactive' 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vehicle.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {vehicle.fuel_type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.registration_number || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.last_service_date 
                        ? new Date(vehicle.last_service_date).toLocaleDateString() 
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.lat && vehicle.lng 
                        ? `${Number(vehicle.lat).toFixed(4)}, ${Number(vehicle.lng).toFixed(4)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVehicles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No vehicles found. Add a vehicle to get started.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Vehicle detail drawer */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.aside 
            initial={{ x: 400, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 400, opacity: 0 }} 
            transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl p-6 z-50 overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedVehicle.name}</h3>
                <p className="text-sm text-gray-500">ID: {selectedVehicle.id}</p>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)} 
                className="text-gray-400 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            
            <div className="mt-4 space-y-3">
              <p><strong>Status:</strong> {selectedVehicle.status || 'N/A'}</p>
              <p><strong>Driver:</strong> {Array.isArray(drivers) ? (drivers.find(d => d.id === selectedVehicle.driver_id)?.name || 'N/A') : 'N/A'}</p>
              <p><strong>Speed:</strong> {selectedVehicle.speed ?? '—'} km/h</p>
              <p><strong>Fuel:</strong> {Math.round(selectedVehicle.fuel_level ?? 0)}%</p>
              <p><strong>Location:</strong> {selectedVehicle.lat ?? '—'}, {selectedVehicle.lng ?? '—'}</p>
              
              <div className="mt-3">
                <h4 className="font-medium mb-2">Latest Telemetry</h4>
                <div className="space-y-2">
                  {telemetry.length > 0 ? (
                    telemetry
                      .filter(t => t.vehicle_id === selectedVehicle.id)
                      .slice(0, 5)
                      .map((t, i) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                          <p><strong>Time:</strong> {new Date(t.timestamp).toLocaleString()}</p>
                          <p><strong>Speed:</strong> {t.speed} km/h</p>
                          <p><strong>Fuel:</strong> {t.fuel_level}%</p>
                          {t.location && (
                            <p><strong>Location:</strong> {t.location.lat.toFixed(4)}, {t.location.lng.toFixed(4)}</p>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">No telemetry data available</p>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

// --- Small UI components ---
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${color} text-white text-3xl p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

function AlertCard({ alert }) {
  const severityColors = { high: 'border-red-500 bg-red-50', medium: 'border-yellow-500 bg-yellow-50', low: 'border-blue-500 bg-blue-50' };
  const typeIcons = { harsh_braking: '🚨', speeding: '⚠️', low_fuel: '⛽', maintenance: '🔧', deviation: '📍' };
  return (
    <div className={`border-l-4 p-3 rounded ${severityColors[alert.severity] || 'border-gray-500 bg-gray-50'}`}>
      <div className="flex items-start">
        <span className="text-xl mr-2">{typeIcons[alert.type] || '📌'}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.message}</p>
          <p className="text-xs text-gray-500 mt-1">{alert.vehicle_id} • {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : '—'}</p>
        </div>
      </div>
    </div>
  );
}
