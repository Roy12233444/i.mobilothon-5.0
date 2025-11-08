import os
import cv2
import numpy as np
import torch
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

class TrafficSignDetector:
    def __init__(self, model_path: str):
        """
        Initialize the traffic sign detector with a YOLOv5 model.
        
        Args:
            model_path: Path to the YOLOv5 model file (.pt)
        """
        self.model = None
        self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load the YOLOv5 model for traffic sign detection."""
        try:
            # Use CPU for inference to avoid CUDA memory issues
            self.model = torch.hub.load('ultralytics/yolov5', 'custom', path=self.model_path, force_reload=False)
            self.model.eval()
            logger.info(f"Loaded traffic sign detection model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load traffic sign detection model: {e}")
            raise
    
    def detect_traffic_signs(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detect traffic signs in an image.
        
        Args:
            image_path: Path to the input image
            
        Returns:
            List of detected traffic signs with their positions and confidences
        """
        if not os.path.exists(image_path):
            logger.warning(f"Image not found: {image_path}")
            return []
            
        try:
            # Read and preprocess the image
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to read image: {image_path}")
                return []
                
            # Convert BGR to RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Run inference
            results = self.model([img_rgb], size=640)  # batch of images
            
            # Process results
            detections = []
            for *xyxy, conf, cls in results.xyxy[0]:
                if conf < 0.5:  # Confidence threshold
                    continue
                    
                x1, y1, x2, y2 = map(int, xyxy)
                detections.append({
                    'class': self.model.names[int(cls)],
                    'confidence': float(conf),
                    'bbox': [x1, y1, x2, y2],
                    'center': [(x1 + x2) // 2, (y1 + y2) // 2]
                })
                
            return detections
            
        except Exception as e:
            logger.error(f"Error detecting traffic signs: {e}")
            return []
    
    def get_traffic_sign_impact(self, detections: List[Dict[str, Any]], route_segment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate the impact of detected traffic signs on a route segment.
        
        Args:
            detections: List of detected traffic signs
            route_segment: Dictionary containing route segment information
            
        Returns:
            Dictionary with impact analysis
        """
        impact = {
            'speed_limit': None,
            'hazards': [],
            'delays': 0,  # in seconds
            'warnings': []
        }
        
        for detection in detections:
            sign_type = detection['class'].lower()
            
            # Handle different types of traffic signs
            if 'speed limit' in sign_type:
                try:
                    # Extract speed limit number from the class name
                    speed = int(''.join(filter(str.isdigit, sign_type)))
                    if impact['speed_limit'] is None or speed < impact['speed_limit']:
                        impact['speed_limit'] = speed
                except (ValueError, AttributeError):
                    pass
                    
            elif any(sign in sign_type for sign in ['stop', 'yield', 'give way']):
                impact['delays'] += 15  # Add 15 seconds delay for stop/yield signs
                impact['warnings'].append(f"{sign_type.capitalize()} sign detected")
                
            elif any(sign in sign_type for sign in ['construction', 'warning', 'hazard']):
                impact['hazards'].append(sign_type)
                impact['warnings'].append(f"{sign_type.capitalize()} detected")
                impact['delays'] += 30  # Add 30 seconds delay for hazards
        
        return impact

# Global instance
traffic_sign_detector = None

def get_traffic_sign_detector(model_path: str = None):
    """Get or create a traffic sign detector instance."""
    global traffic_sign_detector
    
    if traffic_sign_detector is None and model_path:
        try:
            traffic_sign_detector = TrafficSignDetector(model_path)
        except Exception as e:
            logger.error(f"Failed to initialize traffic sign detector: {e}")
            
    return traffic_sign_detector
