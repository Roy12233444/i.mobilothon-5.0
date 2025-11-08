/**
 * Utility functions for camera access and frame processing
 */

export const getCameraDevices = async () => {
  try {
    // Request camera permissions
    await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Enumerate all devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Filter for video input devices
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}`,
        groupId: device.groupId
      }));
    
    return videoDevices;
  } catch (error) {
    console.error('Error accessing camera devices:', error);
    throw new Error('Could not access camera devices. Please ensure camera permissions are granted.');
  }
};

export const startCamera = async (videoElement, deviceId, options = {}) => {
  // Default constraints
  const defaultConstraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 15, max: 30 }
    },
    audio: false
  };
  
  // Merge with user options
  const constraints = {
    ...defaultConstraints,
    ...options,
    video: {
      ...defaultConstraints.video,
      ...(options.video || {})
    }
  };
  
  try {
    // Get the media stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Attach the stream to the video element
    if (videoElement) {
      // Stop any existing stream
      if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
      
      videoElement.srcObject = stream;
      
      // Play the video
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(reject);
        };
        videoElement.onerror = reject;
      });
    }
    
    return stream;
  } catch (error) {
    console.error('Error starting camera:', error);
    throw new Error('Could not start camera. Please check if another application is using the camera.');
  }
};

export const stopCamera = (videoElement) => {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    
    tracks.forEach(track => {
      track.stop();
    });
    
    videoElement.srcObject = null;
  }
};

export const captureFrame = (videoElement, canvasElement, format = 'image/jpeg', quality = 0.8) => {
  if (!videoElement || !canvasElement) {
    throw new Error('Video and canvas elements are required');
  }
  
  // Set canvas dimensions to match video
  canvasElement.width = videoElement.videoWidth || videoElement.width;
  canvasElement.height = videoElement.videoHeight || videoElement.height;
  
  const ctx = canvasElement.getContext('2d');
  
  // Draw the current video frame to the canvas
  ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  
  // Return the image data URL
  return canvasElement.toDataURL(format, quality);
};

export const processFrameForAnalysis = (videoElement, canvasElement) => {
  try {
    // Capture the current frame as a data URL
    const frameDataUrl = captureFrame(videoElement, canvasElement, 'image/jpeg', 0.7);
    
    // Extract the base64 data (remove the data URL prefix)
    const base64Data = frameDataUrl.split(',')[1];
    
    return {
      frameData: base64Data,
      timestamp: new Date().toISOString(),
      width: canvasElement.width,
      height: canvasElement.height
    };
  } catch (error) {
    console.error('Error processing frame:', error);
    throw error;
  }
};

export const createFrameProcessor = (videoElement, canvasElement, callback, interval = 200) => {
  let isProcessing = false;
  let frameId = null;
  
  const processFrame = async () => {
    if (isProcessing) return;
    
    isProcessing = true;
    
    try {
      // Only process if video is ready
      if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
        const frameData = processFrameForAnalysis(videoElement, canvasElement);
        await callback(frameData);
      }
    } catch (error) {
      console.error('Error in frame processing callback:', error);
    } finally {
      isProcessing = false;
    }
    
    // Schedule next frame
    frameId = setTimeout(processFrame, interval);
  };
  
  // Start processing
  processFrame();
  
  // Return cleanup function
  return () => {
    if (frameId) {
      clearTimeout(frameId);
      frameId = null;
    }
  };
};
