import asyncio
import queue
import threading
import time
from typing import Dict, Optional, Callable
import cv2
import numpy as np
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CameraFeedManager:
    def __init__(self, max_queue_size: int = 10, max_workers: int = 3):
        """
        Initialize the Camera Feed Manager.
        
        Args:
            max_queue_size: Maximum number of frames to queue per camera
            max_workers: Maximum number of worker threads for processing
        """
        self.max_queue_size = max_queue_size
        self.max_workers = max_workers
        self.camera_queues: Dict[str, queue.Queue] = {}
        self.camera_threads: Dict[str, threading.Thread] = {}
        self.worker_threads = []
        self.stop_event = threading.Event()
        self.processing_lock = threading.Lock()
        self.callbacks = {}
        
        # Start worker threads
        self._start_workers()
    
    def _start_workers(self):
        """Start worker threads for processing camera feeds."""
        for i in range(self.max_workers):
            worker = threading.Thread(
                target=self._process_queues,
                name=f"CameraWorker-{i+1}",
                daemon=True
            )
            worker.start()
            self.worker_threads.append(worker)
    
    def add_camera(self, camera_id: str, rtsp_url: str, callback: Optional[Callable] = None):
        """
        Add a new camera feed to the manager.
        
        Args:
            camera_id: Unique identifier for the camera
            rtsp_url: RTSP URL or camera index for OpenCV
            callback: Optional callback function to process frames
        """
        if camera_id in self.camera_queues:
            logger.warning(f"Camera {camera_id} already exists")
            return
        
        self.camera_queues[camera_id] = queue.Queue(maxsize=self.max_queue_size)
        if callback:
            self.callbacks[camera_id] = callback
        
        # Start capture thread for this camera
        self.camera_threads[camera_id] = threading.Thread(
            target=self._capture_frames,
            args=(camera_id, rtsp_url),
            daemon=True
        )
        self.camera_threads[camera_id].start()
        logger.info(f"Started capture for camera {camera_id}")
    
    def remove_camera(self, camera_id: str):
        """Remove a camera feed from the manager."""
        if camera_id in self.camera_queues:
            # Signal the capture thread to stop
            if camera_id in self.camera_threads:
                self.camera_threads[camera_id].join(timeout=1.0)
                del self.camera_threads[camera_id]
            
            # Clear the queue
            while not self.camera_queues[camera_id].empty():
                try:
                    self.camera_queues[camera_id].get_nowait()
                except queue.Empty:
                    break
            
            del self.camera_queues[camera_id]
            if camera_id in self.callbacks:
                del self.callbacks[camera_id]
            
            logger.info(f"Removed camera {camera_id}")
    
    def _capture_frames(self, camera_id: str, rtsp_url: str):
        """Capture frames from a camera and add them to the processing queue."""
        cap = cv2.VideoCapture(rtsp_url)
        
        if not cap.isOpened():
            logger.error(f"Failed to open camera {camera_id} at {rtsp_url}")
            return
        
        logger.info(f"Started capturing from camera {camera_id}")
        
        try:
            while not self.stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"Failed to capture frame from camera {camera_id}")
                    time.sleep(1)  # Prevent tight loop on error
                    continue
                
                # Add timestamp to frame
                timestamp = datetime.now().isoformat()
                frame_data = {
                    'camera_id': camera_id,
                    'frame': frame,
                    'timestamp': timestamp
                }
                
                # Add to queue (non-blocking)
                try:
                    self.camera_queues[camera_id].put_nowait(frame_data)
                except queue.Full:
                    # Drop the oldest frame if queue is full
                    try:
                        self.camera_queues[camera_id].get_nowait()
                        self.camera_queues[camera_id].put_nowait(frame_data)
                        logger.warning(f"Queue full for camera {camera_id}, dropped oldest frame")
                    except queue.Empty:
                        pass
                
                # Small delay to prevent overwhelming the system
                time.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Error in capture thread for camera {camera_id}: {str(e)}")
        finally:
            cap.release()
            logger.info(f"Stopped capturing from camera {camera_id}")
    
    def _process_queues(self):
        """Worker thread function to process frames from all camera queues."""
        while not self.stop_event.is_set():
            try:
                # Check each camera queue
                for camera_id, q in self.camera_queues.items():
                    try:
                        # Get frame data (non-blocking)
                        frame_data = q.get_nowait()
                        
                        # Process the frame if a callback is registered
                        if camera_id in self.callbacks:
                            try:
                                self.callbacks[camera_id](frame_data)
                            except Exception as e:
                                logger.error(f"Error in callback for camera {camera_id}: {str(e)}")
                        
                        # Mark task as done
                        q.task_done()
                        
                    except queue.Empty:
                        # No frames in this queue, try the next one
                        continue
                    
                    # Small sleep to prevent tight loop when all queues are empty
                    time.sleep(0.01)
                
                # Small sleep to prevent CPU spinning
                time.sleep(0.01)
                
            except Exception as e:
                logger.error(f"Error in worker thread: {str(e)}")
                time.sleep(1)  # Prevent tight error loop
    
    def get_queue_status(self) -> Dict:
        """Get the status of all camera queues."""
        status = {}
        for camera_id, q in self.camera_queues.items():
            status[camera_id] = {
                'queue_size': q.qsize(),
                'is_alive': camera_id in self.camera_threads and self.camera_threads[camera_id].is_alive()
            }
        return status
    
    def stop(self):
        """Stop all camera feeds and worker threads."""
        self.stop_event.set()
        
        # Stop all camera threads
        for camera_id in list(self.camera_threads.keys()):
            self.remove_camera(camera_id)
        
        # Wait for worker threads to finish
        for worker in self.worker_threads:
            worker.join(timeout=1.0)
        
        logger.info("Camera feed manager stopped")

# Singleton instance
camera_manager = CameraFeedManager()

# Example usage:
if __name__ == "__main__":
    def process_frame(frame_data):
        print(f"Processing frame from {frame_data['camera_id']} at {frame_data['timestamp']}")
        # Add your frame processing logic here
        pass
    
    # Add test cameras
    manager = CameraFeedManager()
    manager.add_camera("test1", 0, process_frame)  # Using webcam
    
    try:
        while True:
            # Print queue status every 5 seconds
            print("\nQueue status:")
            for cam_id, status in manager.get_queue_status().items():
                print(f"{cam_id}: {status}")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nStopping...")
        manager.stop()
