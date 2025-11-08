import React, { useState, useEffect, useRef } from 'react';
import { FiAlertTriangle, FiMap, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TrafficAnalysis = () => {
  const [trafficData, setTrafficData] = useState({
    density: 0,
    vehicleCount: 0,
    isCongested: false,
    incidents: [],
    history: Array(12).fill(0).map((_, i) => ({
      time: `${i * 2}:00`,
      density: Math.random() * 100,
      speed: 50 + Math.random() * 50
    }))
  });
  
  const [selectedView, setSelectedView] = useState('realtime');
  const [isPlaying, setIsPlaying] = useState(false);
  const ws = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef();
  
  // Initialize WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws/traffic');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTrafficData(prev => ({
        ...prev,
        density: data.density * 100, // Convert to percentage
        vehicleCount: data.vehicle_count,
        isCongested: data.is_congested,
        incidents: data.incidents || [],
        history: [...prev.history.slice(1), {
          time: new Date().toLocaleTimeString(),
          density: data.density * 100,
          speed: data.average_speed || 50
        }]
      }));
    };
    
    return () => {
      ws.current.close();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  // Process video feed
  const processVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Send frame to server for processing
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        ws.current.send(JSON.stringify({
          type: 'frame',
          data: imageData
        }));
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(processVideo);
      }
    }
  };
  
  // Toggle video processing
  const toggleVideoProcessing = () => {
    if (isPlaying) {
      cancelAnimationFrame(animationRef.current);
    } else {
      processVideo();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Chart data
  const chartData = {
    labels: trafficData.history.map(item => item.time.split(':').slice(0, 2).join(':')),
    datasets: [
      {
        label: 'Traffic Density (%)',
        data: trafficData.history.map(item => item.density),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Average Speed (km/h)',
        data: trafficData.history.map(item => item.speed),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Density (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Speed (km/h)'
        },
        min: 0,
        max: 120,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Traffic Conditions Over Time',
      },
    },
  };
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Traffic Density Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Traffic Density</p>
              <p className="text-3xl font-bold">{trafficData.density.toFixed(1)}%</p>
              <p className={`text-sm ${trafficData.isCongested ? 'text-red-500' : 'text-green-500'}`}>
                {trafficData.isCongested ? 'Congested' : 'Flowing'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiTrendingUp size={24} />
            </div>
          </div>
        </div>
        
        {/* Vehicle Count Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Vehicles Detected</p>
              <p className="text-3xl font-bold">{trafficData.vehicleCount}</p>
              <p className="text-sm text-gray-500">in current view</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiUsers size={24} />
            </div>
          </div>
        </div>
        
        {/* Incidents Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Incidents</p>
              <p className="text-3xl font-bold">{trafficData.incidents.length}</p>
              <p className="text-sm text-gray-500">on current route</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FiAlertTriangle size={24} />
            </div>
          </div>
        </div>
        
        {/* Map View Toggle */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Map View</p>
              <p className="text-sm text-gray-500 mb-2">Toggle traffic visualization</p>
            </div>
            <button 
              onClick={() => setSelectedView(prev => prev === 'realtime' ? 'heatmap' : 'realtime')}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <FiMap className="mr-2" />
              {selectedView === 'realtime' ? 'Show Heatmap' : 'Show Realtime'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded-lg border border-gray-200"
              style={{ display: selectedView === 'realtime' ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ display: 'none' }}
            />
            {selectedView === 'heatmap' && (
              <div className="w-full h-64 bg-gradient-to-br from-green-400 via-yellow-400 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                Traffic Heatmap View
              </div>
            )}
            <div className="absolute bottom-4 right-4">
              <button
                onClick={toggleVideoProcessing}
                className={`p-3 rounded-full ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg transition-colors`}
                title={isPlaying ? 'Pause Analysis' : 'Start Analysis'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Traffic Alerts</h3>
            {trafficData.incidents.length > 0 ? (
              <div className="space-y-2">
                {trafficData.incidents.map((incident, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-700">{incident.type}</p>
                      <p className="text-sm text-red-600">{incident.description}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700">No traffic incidents detected</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Charts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Traffic Analytics</h3>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Vehicle Distribution</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['Cars', 'Trucks', 'Buses', 'Motorcycles'],
                  datasets: [{
                    label: 'Count',
                    data: [
                      Math.round(trafficData.vehicleCount * 0.6),
                      Math.round(trafficData.vehicleCount * 0.2),
                      Math.round(trafficData.vehicleCount * 0.1),
                      Math.round(trafficData.vehicleCount * 0.1)
                    ],
                    backgroundColor: [
                      'rgba(54, 162, 235, 0.5)',
                      'rgba(255, 99, 132, 0.5)',
                      'rgba(255, 206, 86, 0.5)',
                      'rgba(75, 192, 192, 0.5)'
                    ],
                    borderColor: [
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 99, 132, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Vehicle Types',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Traffic Flow</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Main Road</span>
                  <span>{Math.round(trafficData.density)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${trafficData.isCongested ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${trafficData.density}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Side Street A</span>
                  <span>{Math.round(trafficData.density * 0.6)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-yellow-500"
                    style={{ width: `${trafficData.density * 0.6}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Side Street B</span>
                  <span>{Math.round(trafficData.density * 0.4)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-blue-500"
                    style={{ width: `${trafficData.density * 0.4}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficAnalysis;
