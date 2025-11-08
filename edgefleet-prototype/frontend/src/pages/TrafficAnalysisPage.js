import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiAlertTriangle, 
  FiMap, 
  FiTrendingUp, 
  FiUsers, 
  FiVideo, 
  FiVideoOff, 
  FiSettings, 
  FiArrowLeft, 
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiMinimize2,
  FiMaximize2,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TrafficAnalysis from '../components/TrafficAnalysis';
import trafficService from '../services/trafficService';

// Register ChartJS components
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

const TrafficAnalysisPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const lastFpsUpdate = useRef(Date.now());
  const animationFrameId = useRef(null);
  const stream = useRef(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const [settings, setSettings] = useState({
    enableTracking: true,
    alertThreshold: 70,
    showHeatmap: false,
    showBoundingBoxes: true,
    frameRate: 10, // Frames per second to process
    showTrajectories: true
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle WebSocket connection
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to traffic service');
      setIsConnected(true);
      setError(null);
      toast.success('Connected to traffic analysis service');
    };

    const handleDisconnect = () => {
      console.log('Disconnected from traffic service');
      setIsConnected(false);
      setCameraActive(false);
      toast.warning('Disconnected from traffic service');
    };

    const handleError = (error) => {
      console.error('Traffic service error:', error);
      setError(error.message || 'Failed to connect to traffic service');
      toast.error(`Traffic service error: ${error.message}`);
    };

    const handleMessage = (data) => {
      // Handle incoming traffic data
      if (data.type === 'analysis') {
        setTrafficData(prev => ({
          ...prev,
          ...data.data,
          history: [...prev.history.slice(1), {
            time: new Date().toLocaleTimeString(),
            density: data.data.density,
            speed: data.data.averageSpeed || 0
          }]
        }));
      }
    };

    // Initialize traffic service
    trafficService.on('connect', handleConnect);
    trafficService.on('disconnect', handleDisconnect);
    trafficService.on('error', handleError);
    trafficService.on('message', handleMessage);
    trafficService.connect();

    // Initialize camera
    const initCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraActive(true);
            setIsLoading(false);
          }
        } else {
          throw new Error('Camera access not supported');
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please check permissions.');
        toast.error('Failed to access camera');
        setIsLoading(false);
      }
    };

    initCamera();

    // Cleanup
    return () => {
      trafficService.off('connect', handleConnect);
      trafficService.off('disconnect', handleDisconnect);
      trafficService.off('error', handleError);
      trafficService.off('message', handleMessage);
      trafficService.disconnect();
      
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Process video frames and send to server
  const processFrame = useCallback(() => {
    if (!isConnected || !videoRef.current || !canvasRef.current) {
      animationFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const now = Date.now();
    const elapsed = now - lastFpsUpdate.current;

    // Only process frames at the specified rate (default: 10fps)
    const targetFPS = 10;
    if (elapsed < 1000 / targetFPS) {
      animationFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    // Set canvas dimensions to match video
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data and send to server
      if (isConnected && trafficService.isConnected) {
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        trafficService.sendMessage({
          type: 'process_frame',
          data: imageData.split(',')[1] // Remove data URL prefix
        });
      }
    }

    // Update FPS counter
    setFrameCount(prev => {
      if (elapsed >= 1000) {
        setFps(Math.round((prev * 1000) / elapsed));
        lastFpsUpdate.current = now;
        return 0;
      }
      return prev + 1;
    });
    
    // Schedule next frame
    animationFrameId.current = requestAnimationFrame(processFrame);
  }, [isConnected]);

  // Start/stop frame processing when camera or connection status changes
  useEffect(() => {
    if (cameraActive && isConnected) {
      animationFrameId.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [cameraActive, isConnected, processFrame]);

  // Toggle camera on/off
  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      // Stop camera
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      // Start camera
      try {
        const constraints = {
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        };

        // Add deviceId to constraints if a camera is selected
        if (selectedCamera) {
          constraints.video.deviceId = { exact: selectedCamera };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please check permissions.');
        toast.error('Failed to access camera');
        setCameraActive(false);
      }
    }
  }, [cameraActive, selectedCamera]);

  // Get available camera devices
  const getCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting camera devices:', err);
    }
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Get camera devices on mount
  useEffect(() => {
    getCameraDevices();
  }, [getCameraDevices]);

  return (
    <div className={`min-h-screen bg-gray-100 p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div className={`max-w-7xl mx-auto ${isFullscreen ? 'h-screen flex flex-col' : ''}`}>
        {!isFullscreen && (
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Traffic Analysis</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className={`grid ${isFullscreen ? 'grid-cols-1 h-full' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
          {/* Video Feed */}
          <div className={`${isFullscreen ? 'h-full' : 'lg:col-span-2'} bg-white rounded-lg shadow-md overflow-hidden flex flex-col`}>
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {isFullscreen ? 'Fullscreen Mode' : 'Live Camera Feed'}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{fps} FPS</span>
                {cameraDevices.length > 1 && (
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="bg-gray-700 text-white text-sm rounded px-2 py-1"
                    disabled={cameraActive}
                  >
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded-full ${cameraActive ? 'bg-red-500' : 'bg-green-500'} text-white`}
                  title={cameraActive ? 'Stop Camera' : 'Start Camera'}
                >
                  {cameraActive ? <FiVideoOff /> : <FiVideo />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-gray-700 text-white"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                </button>
              </div>
            </div>
            <div className={`relative bg-black flex-1 flex items-center justify-center ${isFullscreen ? 'h-[calc(100vh-64px)]' : ''}`}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p>Initializing camera...</p>
                </div>
              ) : !cameraActive ? (
                <div className="text-center p-6">
                  <div className="bg-gray-800 rounded-full p-4 inline-block mb-4">
                    <FiVideoOff className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Camera is turned off</h3>
                  <p className="text-gray-400 mb-4">Click the camera button to start streaming</p>
                  <button
                    onClick={toggleCamera}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto"
                  >
                    <FiVideo className="mr-2" />
                    Start Camera
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`${isFullscreen ? 'h-full' : 'max-h-[70vh]'} w-full object-contain`}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )}
            </div>
          </div>

          {/* Traffic Data - Hidden in fullscreen mode */}
          {!isFullscreen && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Traffic Metrics</h2>
                  <button
                    onClick={() => {
                      // Refresh traffic data
                      trafficService.sendMessage({ type: 'refresh' });
                      toast.info('Refreshing traffic data...');
                    }}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Refresh data"
                  >
                    <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Vehicle Count</p>
                      <p className="text-2xl font-bold">{trafficData.vehicleCount}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FiUsers className="text-blue-600 text-xl" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Traffic Density</p>
                      <p className="text-2xl font-bold">{trafficData.density}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FiTrendingUp className="text-green-600 text-xl" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-2xl font-bold">
                        {trafficData.isCongested ? 'Congested' : 'Flowing'}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <FiAlertTriangle className="text-yellow-600 text-xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Traffic Incidents</h2>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    {trafficData.incidents.length} Active
                  </span>
                </div>
                {trafficData.incidents.length > 0 ? (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {trafficData.incidents.map((incident, index) => (
                      <li key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-700">{incident.type}</p>
                            <p className="text-sm text-gray-600">{incident.location}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(incident.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            {incident.severity}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-green-50 rounded-full p-3 inline-block mb-3">
                      <FiCheckCircle className="text-green-500 text-2xl" />
                    </div>
                    <p className="text-gray-500">No traffic incidents detected</p>
                    <p className="text-sm text-gray-400 mt-1">All routes are clear</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Video element (hidden) */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default TrafficAnalysisPage;
