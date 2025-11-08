import os
import torch
import torch.nn as nn
import onnxruntime as ort
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelLoader:
    """Utility class for loading and managing ML models"""
    
    def __init__(self, models_dir=None):
        """
        Initialize the model loader
        
        Args:
            models_dir: Path to the directory containing saved models
        """
        self.models_dir = models_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'ml', 'saved_models'
        )
        self.loaded_models = {}
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Using device: {self.device}")
    
    def load_pytorch_model(self, model_name, model_class=None):
        """
        Load a PyTorch model
        
        Args:
            model_name: Name of the model file
            model_class: Optional model class (for custom architectures)
            
        Returns:
            Loaded PyTorch model
        """
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        model_path = os.path.join(self.models_dir, model_name)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            # Try loading as a state dict first
            checkpoint = torch.load(model_path, map_location=self.device)
            
            if model_class is not None and hasattr(checkpoint, 'state_dict'):
                # If it's a full model checkpoint
                model = model_class()
                model.load_state_dict(checkpoint.state_dict())
            elif model_class is not None:
                # If it's just weights
                model = model_class()
                if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                    model.load_state_dict(checkpoint['state_dict'])
                else:
                    model.load_state_dict(checkpoint)
            else:
                # If no model class is provided, assume it's a full model
                model = checkpoint
            
            model = model.to(self.device)
            model.eval()
            self.loaded_models[model_name] = model
            logger.info(f"Loaded PyTorch model: {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"Error loading PyTorch model {model_name}: {str(e)}")
            raise
    
    def load_onnx_model(self, model_name):
        """
        Load an ONNX model
        
        Args:
            model_name: Name of the ONNX model file
            
        Returns:
            ONNX Runtime session
        """
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        model_path = os.path.join(self.models_dir, model_name)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            # Set up ONNX Runtime
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] \
                if torch.cuda.is_available() else ['CPUExecutionProvider']
                
            session = ort.InferenceSession(
                model_path,
                providers=providers
            )
            
            self.loaded_models[model_name] = session
            logger.info(f"Loaded ONNX model: {model_name}")
            return session
            
        except Exception as e:
            logger.error(f"Error loading ONNX model {model_name}: {str(e)}")
            raise
    
    def load_tensorflow_model(self, model_name):
        """
        Load a TensorFlow model
        
        Args:
            model_name: Name of the TensorFlow model file
            
        Returns:
            Loaded TensorFlow model
        """
        try:
            import tensorflow as tf
            from tensorflow.keras.models import load_model
        except ImportError:
            logger.error("TensorFlow is required to load TensorFlow models")
            raise
            
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        model_path = os.path.join(self.models_dir, model_name)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            # Disable eager execution for TF 2.x compatibility
            tf.compat.v1.disable_eager_execution()
            
            # Load the model
            model = load_model(model_path)
            
            # Enable GPU if available
            if tf.config.list_physical_devices('GPU'):
                logger.info("GPU is available for TensorFlow")
                
            self.loaded_models[model_name] = model
            logger.info(f"Loaded TensorFlow model: {model_name}")
            return model
            
        except Exception as e:
            logger.error(f"Error loading TensorFlow model {model_name}: {str(e)}")
            raise
    
    def clear_cache(self):
        """Clear the model cache"""
        self.loaded_models.clear()
        logger.info("Cleared model cache")
        
    def get_available_models(self):
        """Get a list of available model files"""
        try:
            return [f for f in os.listdir(self.models_dir) 
                   if f.endswith(('.pth', '.pt', '.pth.tar', '.onnx', '.pb', '.h5'))]
        except Exception as e:
            logger.error(f"Error listing available models: {str(e)}")
            return []

# Global instance
model_loader = ModelLoader()
