"""
Telemetry-related Pydantic models for request/response validation.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field, ConfigDict

class TelemetryType(str, Enum):
    GPS = "GPS"
    SPEED = "SPEED"
    FUEL_LEVEL = "FUEL_LEVEL"
    ENGINE_TEMP = "ENGINE_TEMP"
    BATTERY_VOLTAGE = "BATTERY_VOLTAGE"
    ODOMETER = "ODOMETER"
    RPM = "RPM"
    THROTTLE_POSITION = "THROTTLE_POSITION"
    BRAKE_STATUS = "BRAKE_STATUS"
    HEADLIGHT_STATUS = "HEADLIGHT_STATUS"
    DOOR_STATUS = "DOOR_STATUS"
    SEATBELT_STATUS = "SEATBELT_STATUS"
    TIRE_PRESSURE = "TIRE_PRESSURE"
    OTHER = "OTHER"

class TelemetryBase(BaseModel):
    """Base schema for Telemetry with common fields."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "type": "GPS",
                "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                "driver_id": "660e8400-e29b-41d4-a716-446655440001",
                "timestamp": "2023-01-15T10:30:00Z",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "123 Main St, New York, NY"
                },
                "speed": 45.5,
                "heading": 90.0,
                "altitude": 10.5,
                "accuracy": 5.0,
                "metadata": {
                    "satellites": 8,
                    "hdop": 1.2,
                    "source": "GPS"
                }
            }
        }
    )
    
    type: TelemetryType = Field(..., description="Type of telemetry data")
    vehicle_id: str = Field(..., description="ID of the vehicle this telemetry is for")
    driver_id: Optional[str] = Field(None, description="ID of the driver if applicable")
    timestamp: datetime = Field(..., description="Timestamp when the telemetry was recorded")
    location: Optional[Dict[str, Union[float, str]]] = Field(
        None,
        description="Geographic location. Should include 'lat' and 'lng' and optionally 'address'"
    )
    speed: Optional[float] = Field(None, description="Speed in km/h")
    heading: Optional[float] = Field(
        None, 
        ge=0, 
        lt=360, 
        description="Heading in degrees from true north (0-359)"
    )
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    accuracy: Optional[float] = Field(None, description="Accuracy of the measurement in meters")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the telemetry data"
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

class TelemetryCreate(TelemetryBase):
    """Schema for creating a new telemetry record."""
    pass

class TelemetryBatch(BaseModel):
    """Schema for batch creation of telemetry records."""
    telemetry: List[TelemetryCreate] = Field(
        ...,
        description="List of telemetry records to create"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "telemetry": [
                    {
                        "type": "GPS",
                        "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                        "timestamp": "2023-01-15T10:30:00Z",
                        "location": {
                            "lat": 40.7128,
                            "lng": -74.0060,
                            "address": "123 Main St, New York, NY"
                        },
                        "speed": 45.5,
                        "heading": 90.0
                    },
                    {
                        "type": "SPEED",
                        "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                        "timestamp": "2023-01-15T10:30:00Z",
                        "speed": 45.5
                    }
                ]
            }
        }
    )

class TelemetryResponse(TelemetryBase):
    """Schema for telemetry responses (read operations)."""
    id: str = Field(..., description="Unique identifier for the telemetry record")
    created_at: datetime = Field(..., description="Timestamp when the record was created")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "770e8400-e29b-41d4-a716-446655440002",
                "type": "GPS",
                "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
                "driver_id": "660e8400-e29b-41d4-a716-446655440001",
                "timestamp": "2023-01-15T10:30:00Z",
                "created_at": "2023-01-15T10:30:05Z",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "123 Main St, New York, NY"
                },
                "speed": 45.5,
                "heading": 90.0,
                "altitude": 10.5,
                "accuracy": 5.0,
                "metadata": {
                    "satellites": 8,
                    "hdop": 1.2,
                    "source": "GPS"
                }
            }
        }
    )
