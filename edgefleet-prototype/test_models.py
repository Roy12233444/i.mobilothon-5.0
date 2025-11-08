import sys
import os
from pathlib import Path

# Set UTF-8 encoding for console output
if sys.platform == 'win32':
    import io
    import sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add the project root to the Python path
project_root = Path("E:/i.mobilothon 5.0/edgefleet-prototype")
sys.path.append(str(project_root))

print("\n" + "="*50)
print("🧪 Starting EdgeFleet AI Model Tests")
print("="*50)

try:
    from ml.model_loader import ModelManager
    import torch
    import numpy as np
except ImportError as e:
    print(f"❌ Error importing required packages: {e}")
    print("Please make sure you've installed all requirements with:")
    print("pip install -r ml/requirements.txt")
    sys.exit(1)

def test_yolov8(model):
    """Test YOLOv8 object detection."""
    print("\n🔍 Testing YOLOv8 Object Detection...")
    try:
        # Use a test image URL
        test_image = "https://ultralytics.com/images/zidane.jpg"
        print(f"Testing with image: {test_image}")
        
        # Run inference
        results = model(test_image)
        
        # Process results
        print(f"✅ YOLOv8 test successful!")
        print(f"Detected {len(results[0].boxes)} objects in the test image")
        
        # Print detected classes
        names = results[0].names
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            print(f"- {names[class_id]} (confidence: {confidence:.2f})")
            
    except Exception as e:
        print(f"❌ YOLOv8 test failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_driver_behavior(model):
    """Test driver behavior model with a dummy input."""
    print("\n🧠 Testing Driver Behavior Model...")
    try:
        # Create a dummy input (batch of 1, 3 color channels, 8 frames, 224x224)
        dummy_input = torch.randn(1, 3, 8, 224, 224)
        
        # Run inference
        with torch.no_grad():
            output = model(dummy_input)
            
        print("✅ Driver Behavior model test successful!")
        print(f"Output shape: {output.shape}")
        
    except Exception as e:
        print(f"❌ Driver Behavior model test failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_anomaly_detector(model):
    """Test anomaly detection with sample data."""
    print("\n📊 Testing Anomaly Detection...")
    try:
        # Generate some sample data
        np.random.seed(42)
        X = np.concatenate([
            np.random.normal(0, 1, (100, 5)),  # Normal data
            np.random.normal(5, 2, (10, 5))    # Anomalies
        ])
        
        # Fit and predict
        y_pred = model.fit_predict(X)
        n_anomalies = sum(y_pred == 1)
        
        print(f"✅ Anomaly Detection test successful!")
        print(f"Detected {n_anomalies} anomalies in {len(X)} samples")
        
    except Exception as e:
        print(f"❌ Anomaly Detection test failed: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    print("\n🔄 Initializing models...")
    
    # Initialize model manager
    manager = ModelManager()
    
    try:
        # Load all models
        print("\n" + "="*50)
        print("🚀 Loading AI Models")
        print("="*50)
        models = manager.setup_models()
        
        if not all(models.values()):
            print("\n⚠️ Some models failed to load. Tests may not run completely.")
            
        # Run tests for each model
        if models['yolov8']:
            test_yolov8(models['yolov8'])
            
        if models['driver_behavior']:
            test_driver_behavior(models['driver_behavior'])
            
        if models['anomaly_detector']:
            test_anomaly_detector(models['anomaly_detector'])
            
        # Test PyTorch and CUDA
        print("\n⚙️ System Information:")
        print(f"PyTorch version: {torch.__version__}")
        print(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"Current CUDA device: {torch.cuda.get_device_name(0)}")
            
        print("\n" + "="*50)
        print("✅ All tests completed!")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
        
    return 0
    
if __name__ == "__main__":
    sys.exit(main())
