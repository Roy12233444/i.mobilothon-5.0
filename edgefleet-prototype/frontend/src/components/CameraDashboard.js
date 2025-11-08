import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import { 
  Videocam as CameraIcon, 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Traffic as TrafficIcon,
  Speed as SpeedIcon,
  Timelapse as TimelapseIcon
} from '@mui/icons-material';

const CameraDashboard = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newCamera, setNewCamera] = useState({
    camera_id: '',
    rtsp_url: '',
    lat: '',
    lon: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [ws, setWs] = useState(null);
  const [cameraStatus, setCameraStatus] = useState({});

  // Fetch all cameras
  const fetchCameras = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cameras/status');
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }
      const data = await response.json();
      setCameras(data);
      
      // Initialize camera status
      const status = {};
      data.forEach(cam => {
        status[cam.camera_id] = cam;
      });
      setCameraStatus(status);
      
    } catch (err) {
      console.error('Error fetching cameras:', err);
      setError(err.message);
      showSnackbar('Failed to load cameras', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/cameras/ws/updates/1`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setWs(socket);
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status_update') {
          setCameraStatus(prev => ({
            ...prev,
            ...data.data
          }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      showSnackbar('Connection error. Please refresh the page.', 'error');
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        setWs(null);
      }, 5000);
    };
    
    // Clean up WebSocket on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleAddCamera = async () => {
    try {
      const response = await fetch('/api/cameras/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: newCamera.camera_id,
          rtsp_url: newCamera.rtsp_url,
          location: {
            lat: parseFloat(newCamera.lat),
            lon: parseFloat(newCamera.lon)
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add camera');
      }
      
      setOpenAddDialog(false);
      setNewCamera({ camera_id: '', rtsp_url: '', lat: '', lon: '' });
      fetchCameras();
      showSnackbar('Camera added successfully', 'success');
      
    } catch (err) {
      console.error('Error adding camera:', err);
      showSnackbar(`Failed to add camera: ${err.message}`, 'error');
    }
  };

  const handleRemoveCamera = async (cameraId) => {
    if (window.confirm(`Are you sure you want to remove camera ${cameraId}?`)) {
      try {
        const response = await fetch(`/api/cameras/${cameraId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove camera');
        }
        
        fetchCameras();
        showSnackbar('Camera removed successfully', 'success');
        
      } catch (err) {
        console.error('Error removing camera:', err);
        showSnackbar('Failed to remove camera', 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const getTrafficStatus = (density) => {
    if (!density) return 'Unknown';
    if (density < 0.3) return 'Light';
    if (density < 0.7) return 'Moderate';
    return 'Heavy';
  };

  const getTrafficColor = (density) => {
    if (!density) return 'text.secondary';
    if (density < 0.3) return 'success.main';
    if (density < 0.7) return 'warning.main';
    return 'error.main';
  };

  if (loading && cameras.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Camera Feeds
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Camera
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {cameras.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No cameras configured
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Add a camera to get started with real-time traffic monitoring.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{ mt: 2 }}
              >
                Add Your First Camera
              </Button>
            </Paper>
          </Grid>
        ) : (
          cameras.map((camera) => (
            <Grid item xs={12} md={6} lg={4} key={camera.camera_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: 'black' }}>
                  {camera.rtsp_url ? (
                    <Box
                      component="video"
                      src={camera.rtsp_url}
                      autoPlay
                      muted
                      loop
                      controls
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        bgcolor: 'rgba(0, 0, 0, 0.7)'
                      }}
                    >
                      <CameraIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography>Camera Feed Unavailable</Typography>
                    </Box>
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" component="div">
                        {camera.camera_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {camera.location?.lat?.toFixed(4)}, {camera.location?.lon?.toFixed(4)}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleRemoveCamera(camera.camera_id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <TrafficIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Traffic: 
                          <Box 
                            component="span" 
                            sx={{ 
                              color: getTrafficColor(camera.traffic_conditions?.density),
                              fontWeight: 'medium',
                              ml: 0.5
                            }}
                          >
                            {getTrafficStatus(camera.traffic_conditions?.density)}
                          </Box>
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <SpeedIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Vehicles: {camera.traffic_conditions?.vehicle_count || 'N/A'}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <TimelapseIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Updated: {camera.last_update || 'Never'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ 
                        p: 1, 
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="caption" color="text.secondary" align="center">
                          Traffic Density
                        </Typography>
                        <Box 
                          sx={{
                            height: 8,
                            bgcolor: 'divider',
                            borderRadius: 4,
                            mt: 0.5,
                            overflow: 'hidden'
                          }}
                        >
                          <Box 
                            sx={{
                              height: '100%',
                              width: `${(camera.traffic_conditions?.density || 0) * 100}%`,
                              bgcolor: getTrafficColor(camera.traffic_conditions?.density),
                              transition: 'width 0.5s ease-in-out'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" align="center" display="block" mt={0.5}>
                          {Math.round((camera.traffic_conditions?.density || 0) * 100)}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Camera Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Camera</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400, pt: 1 }}>
            <TextField
              label="Camera ID"
              value={newCamera.camera_id}
              onChange={(e) => setNewCamera({ ...newCamera, camera_id: e.target.value })}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="RTSP URL"
              value={newCamera.rtsp_url}
              onChange={(e) => setNewCamera({ ...newCamera, rtsp_url: e.target.value })}
              placeholder="rtsp://username:password@ip:port/stream"
              fullWidth
              margin="normal"
              required
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Latitude"
                type="number"
                value={newCamera.lat}
                onChange={(e) => setNewCamera({ ...newCamera, lat: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Longitude"
                type="number"
                value={newCamera.lon}
                onChange={(e) => setNewCamera({ ...newCamera, lon: e.target.value })}
                fullWidth
                margin="normal"
                required
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCamera} 
            variant="contained" 
            disabled={!newCamera.camera_id || !newCamera.rtsp_url || !newCamera.lat || !newCamera.lon}
          >
            Add Camera
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CameraDashboard;
