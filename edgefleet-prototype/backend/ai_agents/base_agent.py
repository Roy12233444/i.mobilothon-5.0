from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import torch
import os

class BaseAgent(ABC):
    def __init__(self, model_path: str, device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        """
        Base class for all AI agents
        
        Args:
            model_path: Path to the model file
            device: Device to run the model on ('cuda' or 'cpu')
        """
        self.model_path = model_path
        self.device = device
        self.model = None
        
    @abstractmethod
    def load_model(self):
        """Load the model from the specified path"""
        pass
    
    @abstractmethod
    def preprocess(self, data: Any) -> Any:
        """Preprocess input data"""
        pass
    
    @abstractmethod
    def predict(self, data: Any) -> Dict[str, Any]:
        """Make predictions using the model"""
        pass
    
    @abstractmethod
    def postprocess(self, predictions: Any) -> Dict[str, Any]:
        """Postprocess model predictions"""
        pass
    
    def __call__(self, data: Any) -> Dict[str, Any]:
        """Process data through the entire pipeline"""
        processed_data = self.preprocess(data)
        predictions = self.predict(processed_data)
        return self.postprocess(predictions)
    
    @staticmethod
    def get_model_path(model_name: str) -> str:
        """Get the full path to a model file"""
        base_path = os.path.join("E:\\i.mobilothon 5.0\\edgefleet-prototype\\ml\\saved_models")
        return os.path.join(base_path, model_name)
    
    def to(self, device: str) -> 'BaseAgent':
        """Move model to specified device"""
        self.device = device
        if self.model is not None:
            self.model = self.model.to(device)
        return self
