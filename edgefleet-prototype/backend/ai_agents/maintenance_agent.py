import torch
import torch.nn as nn
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
import joblib
from sklearn.ensemble import RandomForestRegressor
from .base_agent import BaseAgent

class PredictiveMaintenanceAgent(BaseAgent):
    """
    AI agent for predictive maintenance of fleet vehicles.
    Predicts component failures and recommends maintenance schedules.
    """
    
    def __init__(self, model_path: str = None, scaler_path: str = None):
        """
        Initialize the Predictive Maintenance Agent
        
        Args:
            model_path: Path to the trained model file
            scaler_path: Path to the feature scaler
        """
        model_path = model_path or super().get_model_path("predictive_maintenance.pth")
        super().__init__(model_path)
        self.scaler_path = scaler_path or super().get_model_path("maintenance_scaler.pkl")
        self.scaler = None
        self.component_thresholds = {
            'engine': 0.85,
            'transmission': 0.8,
            'brakes': 0.75,
            'battery': 0.9,
            'tires': 0.7
        }
        self.maintenance_costs = {
            'engine': 2000,
            'transmission': 1500,
            'brakes': 500,
            'battery': 300,
            'tires': 800
        }
    
    def load_model(self):
        """Load the predictive maintenance model and scaler"""
        try:
            # Load the model
            if os.path.exists(self.model_path):
                self.model = torch.load(self.model_path, map_location=self.device)
                if hasattr(self.model, 'eval'):
                    self.model.eval()
            
            # Load the scaler
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                
        except Exception as e:
            print(f"Error loading model or scaler: {e}")
            # Fallback to a simple model if loading fails
            self.model = self._create_fallback_model()
    
    def _create_fallback_model(self):
        """Create a simple fallback model if loading fails"""
        class FallbackModel(nn.Module):
            def __init__(self):
                super(FallbackModel, self).__init__()
                self.fc = nn.Linear(10, 5)  # Dummy model
                
            def forward(self, x):
                # Return random predictions as fallback
                return torch.rand(x.size(0), 5) * 0.5 + 0.5  # Values between 0.5 and 1.0
                
        return FallbackModel()
    
    def preprocess(self, data: Dict) -> Dict:
        """
        Preprocess vehicle sensor data for prediction
        
        Args:
            data: Dictionary containing vehicle sensor data and metadata
                - vehicle_id: ID of the vehicle
                - component_readings: Dict of component sensor readings
                - maintenance_history: List of past maintenance records
                - current_mileage: Current vehicle mileage
                - last_service_date: Date of last service
                
        Returns:
            Processed data ready for prediction
        """
        processed = {
            'vehicle_id': data.get('vehicle_id'),
            'component_readings': data.get('component_readings', {}),
            'maintenance_history': data.get('maintenance_history', []),
            'current_mileage': data.get('current_mileage', 0),
            'last_service_date': data.get('last_service_date'),
            'vehicle_model': data.get('vehicle_model', 'default')
        }
        
        # Calculate days since last service
        if processed['last_service_date']:
            if isinstance(processed['last_service_date'], str):
                last_service = datetime.fromisoformat(processed['last_service_date'])
            else:
                last_service = processed['last_service_date']
            days_since_service = (datetime.utcnow() - last_service).days
        else:
            days_since_service = 365  # Default to 1 year if no service history
            
        processed['days_since_service'] = days_since_service
        
        # Calculate average component health
        component_health = {}
        for component, reading in processed['component_readings'].items():
            if isinstance(reading, dict):
                # If reading is a dict with multiple metrics, calculate an average
                component_health[component] = sum(reading.values()) / len(reading)
            else:
                component_health[component] = reading
                
        processed['component_health'] = component_health
        
        # Calculate maintenance urgency score (0-1, higher is more urgent)
        urgency_scores = []
        for component, health in component_health.items():
            threshold = self.component_thresholds.get(component, 0.8)
            # Normalize to 0-1 range where 1 is threshold and 0 is perfect health
            score = max(0, (threshold - health) / threshold)
            urgency_scores.append(score)
            
        processed['maintenance_urgency'] = sum(urgency_scores) / max(len(urgency_scores), 1)
        
        return processed
    
    def predict(self, data: Dict) -> Dict:
        """
        Predict maintenance needs for vehicle components
        
        Args:
            data: Preprocessed vehicle data
            
        Returns:
            Dictionary containing maintenance predictions and recommendations
        """
        # Prepare features for the model
        features = self._prepare_features(data)
        
        # Make predictions
        if self.model is not None:
            with torch.no_grad():
                try:
                    # Convert to tensor and move to device
                    features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
                    predictions = self.model(features_tensor).cpu().numpy()[0]
                except Exception as e:
                    print(f"Error making prediction: {e}")
                    # Fallback to simple heuristic if model prediction fails
                    predictions = self._predict_with_heuristics(data)
        else:
            # Fallback to simple heuristic if no model is loaded
            predictions = self._predict_with_heuristics(data)
        
        # Process predictions
        components = list(data['component_health'].keys()) or list(self.component_thresholds.keys())
        component_predictions = {}
        
        for i, component in enumerate(components):
            if i < len(predictions):
                # Get prediction for this component
                health_score = 1.0 - predictions[i]  # Convert to health score (1.0 is healthy)
                
                # Get threshold for this component
                threshold = self.component_thresholds.get(component, 0.8)
                
                # Determine status
                if health_score < threshold * 0.7:  # Critical
                    status = 'critical'
                    priority = 'immediate'
                elif health_score < threshold * 0.9:  # Warning
                    status = 'warning'
                    priority = 'soon'
                else:  # Normal
                    status = 'normal'
                    priority = 'monitor'
                
                # Calculate estimated time to failure (days)
                if status == 'normal':
                    ttf = 90  # Default TTF for normal components
                else:
                    # Simple linear model for TTF based on health score
                    ttf = max(7, int((1.0 - health_score) * 60))  # 7-60 days
                
                component_predictions[component] = {
                    'health_score': float(health_score),
                    'status': status,
                    'priority': priority,
                    'estimated_ttf_days': ttf,
                    'maintenance_cost': self.maintenance_costs.get(component, 500),
                    'recommended_actions': self._get_recommended_actions(component, status)
                }
        
        # Generate maintenance schedule
        maintenance_schedule = self._generate_maintenance_schedule(component_predictions, data)
        
        return {
            'vehicle_id': data['vehicle_id'],
            'current_mileage': data['current_mileage'],
            'days_since_service': data['days_since_service'],
            'overall_health': 1.0 - data['maintenance_urgency'],
            'components': component_predictions,
            'maintenance_schedule': maintenance_schedule,
            'prediction_timestamp': datetime.utcnow().isoformat()
        }
    
    def _prepare_features(self, data: Dict) -> np.ndarray:
        """Prepare input features for the model"""
        # This is a simplified version - in practice, you'd use more sophisticated feature engineering
        features = []
        
        # Add component health scores
        for component in self.component_thresholds.keys():
            features.append(data['component_health'].get(component, 1.0))
        
        # Add mileage and days since service (normalized)
        features.append(min(data['current_mileage'] / 300000, 1.0))  # Assuming 300,000 km is max
        features.append(min(data['days_since_service'] / 365, 1.0))  # Normalize to 0-1 range
        
        # Add vehicle age factor (if available)
        features.append(0.5)  # Default value if not available
        
        # Convert to numpy array and scale if scaler is available
        features = np.array(features, dtype=np.float32).reshape(1, -1)
        
        if self.scaler is not None:
            try:
                features = self.scaler.transform(features)
            except Exception as e:
                print(f"Error scaling features: {e}")
        
        return features
    
    def _predict_with_heuristics(self, data: Dict) -> np.ndarray:
        """Fallback prediction using simple heuristics"""
        # This is a simple fallback when the model is not available
        predictions = []
        
        for component in self.component_thresholds.keys():
            # Base prediction on component health and time since last service
            health = data['component_health'].get(component, 1.0)
            days_factor = min(data['days_since_service'] / 365, 1.0)
            
            # Simple heuristic: combine health and time factors
            prediction = (1.0 - health) * 0.7 + days_factor * 0.3
            predictions.append(min(max(prediction, 0.0), 1.0))
        
        return np.array(predictions, dtype=np.float32)
    
    def _get_recommended_actions(self, component: str, status: str) -> List[str]:
        """Get recommended maintenance actions for a component"""
        actions = {
            'engine': {
                'normal': ["Continue regular maintenance schedule"],
                'warning': ["Schedule engine diagnostic", "Check oil level and quality", "Inspect air filter"],
                'critical': ["Immediate engine inspection required", "Check for error codes", "Schedule maintenance"]
            },
            'transmission': {
                'normal': ["Continue regular maintenance schedule"],
                'warning': ["Check transmission fluid level", "Monitor for unusual noises"],
                'critical': ["Immediate transmission inspection required", "Check for leaks"]
            },
            'brakes': {
                'normal': ["Continue regular maintenance schedule"],
                'warning': ["Inspect brake pads and rotors", "Check brake fluid level"],
                'critical': ["Immediate brake inspection required", "Check for worn pads/rotors"]
            },
            'battery': {
                'normal': ["Continue regular maintenance schedule"],
                'warning': ["Test battery health", "Check charging system"],
                'critical': ["Battery replacement recommended", "Check alternator"]
            },
            'tires': {
                'normal': ["Continue regular maintenance schedule"],
                'warning': ["Check tire pressure", "Inspect tread depth"],
                'critical': ["Tire replacement recommended", "Check for uneven wear"]
            }
        }
        
        return actions.get(component, {}).get(status, ["No specific recommendations available"])
    
    def _generate_maintenance_schedule(self, component_predictions: Dict, data: Dict) -> List[Dict]:
        """Generate a prioritized maintenance schedule"""
        schedule = []
        
        # Add critical items first
        for component, prediction in component_predictions.items():
            if prediction['status'] == 'critical':
                schedule.append({
                    'component': component,
                    'priority': 'high',
                    'recommended_action': 'Immediate attention required',
                    'estimated_cost': prediction['maintenance_cost'],
                    'suggested_date': datetime.utcnow().strftime('%Y-%m-%d'),
                    'estimated_ttf_days': prediction['estimated_ttf_days']
                })
        
        # Add warning items
        for component, prediction in component_predictions.items():
            if prediction['status'] == 'warning':
                schedule.append({
                    'component': component,
                    'priority': 'medium',
                    'recommended_action': 'Schedule maintenance soon',
                    'estimated_cost': prediction['maintenance_cost'],
                    'suggested_date': (datetime.utcnow() + timedelta(days=7)).strftime('%Y-%m-%d'),
                    'estimated_ttf_days': prediction['estimated_ttf_days']
                })
        
        # Add normal items that are due for regular maintenance
        days_since_service = data.get('days_since_service', 0)
        if days_since_service > 180:  # More than 6 months since last service
            schedule.append({
                'component': 'general',
                'priority': 'low',
                'recommended_action': 'Routine maintenance check',
                'estimated_cost': 200,
                'suggested_date': (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d'),
                'estimated_ttf_days': 365 - days_since_service
            })
        
        return schedule
    
    def postprocess(self, predictions: Dict) -> Dict:
        """
        Format the predictions for the API response
        
        Args:
            predictions: Raw predictions from the model
            
        Returns:
            Formatted response dictionary
        """
        return {
            'status': 'success',
            'data': {
                'vehicle_id': predictions['vehicle_id'],
                'current_mileage': predictions['current_mileage'],
                'days_since_service': predictions['days_since_service'],
                'overall_health': {
                    'score': predictions['overall_health'],
                    'status': self._get_overall_status(predictions['overall_health'])
                },
                'components': predictions['components'],
                'maintenance_schedule': predictions['maintenance_schedule'],
                'total_estimated_cost': sum(
                    item['estimated_cost'] 
                    for item in predictions['maintenance_schedule']
                )
            },
            'timestamp': predictions['prediction_timestamp']
        }
    
    def _get_overall_status(self, health_score: float) -> str:
        """Convert health score to status string"""
        if health_score < 0.7:
            return 'critical'
        elif health_score < 0.9:
            return 'warning'
        else:
            return 'normal'
