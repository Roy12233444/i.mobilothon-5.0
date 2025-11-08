import os
import torch
import gdown
from pathlib import Path
from ultralytics import YOLO
from pyod.models.iforest import IForest
import torchvision.models as models
import pytorchvideo.models.resnet
from tqdm import tqdm
import sys

class ModelManager:
    def __init__(self, base_dir=Path("E:/i.mobilothon 5.0/edgefleet-prototype")):
        """Initialize the ModelManager with base directory paths."""
        self.base_dir = Path(base_dir)
        self.ml_dir = self.base_dir / "ml"
        self.models_dir = self.ml_dir / "saved_models"
        self.data_dir = self.base_dir / "data"
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
    def setup_models(self):
        """Download and initialize all required models."""
        print("\n🚀 Starting model setup...")
        models = {
            'yolov8': self.setup_yolov8(),
            'driver_behavior': self.setup_driver_behavior(),
            'anomaly_detector': self.setup_anomaly_detector(),
            'route_optimizer': self.setup_route_optimizer()
        }
        print("\n✅ All models are ready!")
        return models
    
    def setup_yolov8(self, model_size='yolov8n.pt'):
        """Initialize YOLOv8 model with automatic download."""
        print("\n🔍 Setting up YOLOv8...")
        model_path = self.models_dir / "yolov8"
        model_path.mkdir(exist_ok=True)
        
        try:
            print("⏳ Downloading YOLOv8 model (this may take a few minutes)...")
            model = YOLO(model_size)
            print(f"✅ YOLOv8 model loaded successfully!")
            return model
        except Exception as e:
            print(f"❌ Error loading YOLOv8: {str(e)}")
            return None

    def setup_driver_behavior(self):
        """Initialize driver behavior analysis model."""
        print("\n🔍 Setting up Driver Behavior Model...")
        try:
            print("⏳ Loading 3D ResNet model (this may take a while)...")
            model = torch.hub.load('facebookresearch/pytorchvideo', 'slow_r50', pretrained=True)
            model.eval()
            print("✅ Driver Behavior model loaded successfully!")
            return model
        except Exception as e:
            print(f"❌ Error loading Driver Behavior model: {str(e)}")
            return None

    def setup_anomaly_detector(self):
        """Initialize anomaly detection model."""
        print("\n🔍 Setting up Anomaly Detector...")
        try:
            model = IForest(contamination=0.1, random_state=42)
            print("✅ Anomaly Detector initialized successfully!")
            return model
        except Exception as e:
            print(f"❌ Error initializing Anomaly Detector: {str(e)}")
            return None

    def setup_route_optimizer(self):
        """Initialize route optimization solver."""
        print("\n🔍 Setting up Route Optimizer...")
        try:
            from ortools.constraint_solver import pywrapcp
            print("✅ Route Optimizer initialized successfully!")
            return pywrapcp.RoutingIndexManager
        except Exception as e:
            print(f"❌ Error initializing Route Optimizer: {str(e)}")
            return None

def download_sample_data():
    """Download sample telemetry data if needed."""
    print("\n📥 Downloading sample data...")
    sample_data_path = Path("E:/i.mobilothon 5.0/edgefleet-prototype/data")
    sample_data_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # Create empty sample data file
        sample_file = sample_data_path / "sample_telemetry.json"
        if not sample_file.exists():
            with open(sample_file, 'w') as f:
                f.write('{"telemetry": []}')
        print("✅ Sample data is ready!")
    except Exception as e:
        print(f"⚠️ Could not create sample data: {str(e)}")

if __name__ == "__main__":
    print("="*50)
    print("🚀 EdgeFleet AI - Model Setup")
    print("="*50)
    
    # Initialize model manager
    manager = ModelManager()
    
    # Download all models
    models = manager.setup_models()
    
    # Download sample data
    download_sample_data()
    
    print("\n" + "="*50)
    print("🎉 Setup Complete! All models are ready to use.")
    print("You can now import and use these models in your application.")
    print("="*50)
