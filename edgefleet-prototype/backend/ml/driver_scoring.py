 # Driver behavior scoring
"""
Machine Learning based Driver Behavior Scoring
Uses clustering and classification for driver profiling
"""

import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple

class MLDriverScoring:
    """
    Advanced driver scoring using machine learning
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_weights = {
            'harsh_braking': 0.25,
            'speeding': 0.30,
            'acceleration': 0.15,
            'cornering': 0.15,
            'fuel_efficiency': 0.15
        }
    
    def extract_features(self, driver_data: Dict) -> np.ndarray:
        """
        Extract features from driver data
        
        Args:
            driver_data: Dictionary with driver metrics
            
        Returns:
            Feature array
        """
        features = [
            driver_data.get('harsh_braking_count', 0),
            driver_data.get('speeding_incidents', 0),
            driver_data.get('rapid_acceleration', 0),
            driver_data.get('sharp_turns', 0),
            driver_data.get('avg_fuel_consumption', 0)
        ]
        return np.array(features)
    
    def calculate_advanced_score(self, driver_data: Dict) -> float:
        """
        Calculate driver score using ML approach
        
        Args:
            driver_data: Driver behavior metrics
            
        Returns:
            Driver score (0-100)
        """
        features = self.extract_features(driver_data)
        total_trips = driver_data.get('total_trips', 1)
        
        # Normalize by trips
        if total_trips > 0:
            features = features / total_trips
        
        # Calculate weighted score
        score = 100
        
        # Harsh braking penalty
        score -= features[0] * 100 * self.feature_weights['harsh_braking']
        
        # Speeding penalty
        score -= features[1] * 100 * self.feature_weights['speeding']
        
        # Acceleration penalty
        score -= features[2] * 100 * self.feature_weights['acceleration']
        
        # Cornering penalty
        score -= features[3] * 100 * self.feature_weights['cornering']
        
        # Fuel efficiency bonus/penalty
        fuel_score = (1 - features[4]) * 100 * self.feature_weights['fuel_efficiency']
        score += fuel_score
        
        # Clamp between 0 and 100
        score = max(0, min(100, score))
        
        return round(score, 2)
    
    def predict_risk_level(self, driver_data: Dict) -> Tuple[str, float]:
        """
        Predict risk level for driver
        
        Args:
            driver_data: Driver behavior metrics
            
        Returns:
            Tuple of (risk_level, confidence)
        """
        score = self.calculate_advanced_score(driver_data)
        
        if score >= 85:
            return ("Low Risk", 0.95)
        elif score >= 70:
            return ("Medium Risk", 0.85)
        elif score >= 55:
            return ("High Risk", 0.80)
        else:
            return ("Very High Risk", 0.90)
    
    def get_improvement_areas(self, driver_data: Dict) -> List[Dict]:
        """
        Identify areas for improvement
        
        Args:
            driver_data: Driver behavior metrics
            
        Returns:
            List of improvement areas with priorities
        """
        features = self.extract_features(driver_data)
        total_trips = driver_data.get('total_trips', 1)
        
        if total_trips > 0:
            features = features / total_trips
        
        improvements = []
        
        # Check each metric
        if features[0] > 0.05:  # Harsh braking
            improvements.append({
                'area': 'Harsh Braking',
                'priority': 'High',
                'current_rate': f"{features[0]*100:.1f}%",
                'recommendation': 'Practice smooth braking techniques'
            })
        
        if features[1] > 0.03:  # Speeding
            improvements.append({
                'area': 'Speeding',
                'priority': 'Critical',
                'current_rate': f"{features[1]*100:.1f}%",
                'recommendation': 'Maintain speed limits consistently'
            })
        
        if features[2] > 0.08:  # Rapid acceleration
            improvements.append({
                'area': 'Acceleration',
                'priority': 'Medium',
                'current_rate': f"{features[2]*100:.1f}%",
                'recommendation': 'Accelerate gradually for better fuel efficiency'
            })
        
        if features[3] > 0.06:  # Sharp turns
            improvements.append({
                'area': 'Cornering',
                'priority': 'Medium',
                'current_rate': f"{features[3]*100:.1f}%",
                'recommendation': 'Reduce speed before turns'
            })
        
        return improvements


# Example usage
if __name__ == "__main__":
    ml_scorer = MLDriverScoring()
    
    sample_driver = {
        'harsh_braking_count': 8,
        'speeding_incidents': 5,
        'rapid_acceleration': 12,
        'sharp_turns': 7,
        'avg_fuel_consumption': 0.35,
        'total_trips': 124
    }
    
    score = ml_scorer.calculate_advanced_score(sample_driver)
    risk_level, confidence = ml_scorer.predict_risk_level(sample_driver)
    improvements = ml_scorer.get_improvement_areas(sample_driver)
    
    print(f"Driver Score: {score}")
    print(f"Risk Level: {risk_level} (Confidence: {confidence*100:.1f}%)")
    print("\nAreas for Improvement:")
    for imp in improvements:
        print(f"  • {imp['area']} ({imp['priority']} Priority)")
        print(f"    Current: {imp['current_rate']}")
        print(f"    Action: {imp['recommendation']}\n")