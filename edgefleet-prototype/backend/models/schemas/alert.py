"""
Alert-related Pydantic models for request/response validation.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Union
from pydantic import BaseModel, Field, HttpUrl, ConfigDict

class AlertType(str, Enum):
    MAINTENANCE = "MAINTENANCE"
    SPEEDING = "SPEEDING"
    HARD_BRAKING = "HARD_BRAKING"
    HARD_ACCELERATION = "HARD_ACCELERATION"
    HARD_CORNERING = "HARD_CORNERING"
    IDLING = "IDLING"
    ROUTE_DEVIATION = "ROUTE_DEVIATION"
    GEOTAG = "GEOTAG"
    OTHER = "OTHER"

class AlertStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertBase(BaseModel):
    """Base schema for Alert with common fields."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "type": "SPEEDING",
                "severity": "MEDIUM",
                "status": "OPEN",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 15 km/h",
                "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                "driver_id": "660e8400-e29b-41d4-a716-446655440001",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "123 Main St, New York, NY"
                },
                "metadata": {
                    "speed_limit": 60,
                    "actual_speed": 75,
                    "location_name": "Main Street"
                }
            }
        }
    )
    
    type: AlertType = Field(..., description="Type of the alert")
    severity: AlertSeverity = Field(..., description="Severity level of the alert")
    status: AlertStatus = Field(
        default=AlertStatus.OPEN, 
        description="Current status of the alert"
    )
    title: str = Field(..., max_length=200, description="Short title of the alert")
    description: Optional[str] = Field(
        None, 
        description="Detailed description of the alert"
    )
    vehicle_id: Optional[str] = Field(
        None, 
        description="ID of the vehicle related to this alert"
    )
    driver_id: Optional[str] = Field(
        None, 
        description="ID of the driver related to this alert"
    )
    location: Optional[Dict[str, Union[float, str]]] = Field(
        None,
        description="Geographic location where the alert was triggered. Should include 'lat' and 'lng' and optionally 'address'"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the alert"
    )
    
    @classmethod
    def validate_location(cls, v):
        if v is not None:
            if not isinstance(v, dict):
                raise ValueError("Location must be a dictionary")
            if 'lat' not in v or 'lng' not in v:
                raise ValueError("Location must contain 'lat' and 'lng'")
            if not (-90 <= float(v['lat']) <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180 <= float(v['lng']) <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        return v

class AlertCreate(AlertBase):
    """Schema for creating a new alert."""
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for the alert"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "type": "SPEEDING",
                "severity": "MEDIUM",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 15 km/h",
                "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                "driver_id": "660e8400-e29b-41d4-a716-446655440001",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "123 Main St, New York, NY"
                },
                "metadata": {
                    "speed_limit": 60,
                    "actual_speed": 75,
                    "location_name": "Main Street"
                }
            }
        }
    )

class AlertUpdate(BaseModel):
    """Schema for updating an existing alert."""
    status: Optional[AlertStatus] = Field(
        None, 
        description="Updated status of the alert"
    )
    description: Optional[str] = Field(
        None, 
        description="Updated description of the alert"
    )
    resolved_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the alert was resolved"
    )
    acknowledged_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the alert was acknowledged"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None, 
        description="Updated metadata for the alert"
    )
    is_active: Optional[bool] = Field(
        None, 
        description="Whether the alert is active"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ACKNOWLEDGED",
                "description": "Driver acknowledged the speeding alert",
                "acknowledged_at": "2023-01-15T10:35:00Z"
            }
        }
    )
    
    @classmethod
    def validate_timestamps(cls, v):
        if v is not None and not isinstance(v, datetime):
            try:
                return datetime.fromisoformat(v)
            except (TypeError, ValueError):
                raise ValueError("Invalid datetime format. Use ISO 8601 format.")
        return v

class AlertResponse(AlertBase):
    """Schema for alert responses (read operations)."""
    id: str = Field(..., description="Unique identifier for the alert")
    created_at: datetime = Field(..., description="Timestamp when the alert was created")
    updated_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the alert was last updated"
    )
    resolved_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the alert was resolved"
    )
    acknowledged_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the alert was acknowledged"
    )
    is_active: bool = Field(..., description="Whether the alert is currently active")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "type": "SPEEDING",
                "severity": "MEDIUM",
                "status": "ACKNOWLEDGED",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 15 km/h",
                "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                "driver_id": "660e8400-e29b-41d4-a716-446655440001",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "123 Main St, New York, NY"
                },
                "created_at": "2023-01-15T10:30:00Z",
                "updated_at": "2023-01-15T10:31:00Z",
                "resolved_at": None,
                "acknowledged_at": "2023-01-15T10:35:00Z",
                "is_active": True,
                "metadata": {
                    "speed_limit": 60,
                    "actual_speed": 75,
                    "location_name": "Main Street"
                }
            }
        }
    )
