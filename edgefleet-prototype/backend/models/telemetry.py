from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TelemetryType(str, Enum):
    LOCATION = "location"
    SPEED = "speed"
    FUEL = "fuel"
    ENGINE = "engine"
    DIAGNOSTIC = "diagnostic"
    CUSTOM = "custom"

class TelemetryBase(BaseModel):
    id: str = Field(..., description="Unique identifier for the telemetry record")
    vehicle_id: str = Field(..., description="ID of the vehicle this telemetry belongs to")
    type: TelemetryType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: Optional[Dict[str, float]] = None  # { "lat": float, "lng": float, "alt"?: float }
    speed: Optional[float] = Field(None, ge=0, description="Speed in km/h")
    fuel_level: Optional[float] = Field(None, ge=0, le=100, description="Fuel level in percentage")
    engine_rpm: Optional[float] = Field(None, ge=0, description="Engine RPM")
    engine_temp: Optional[float] = Field(None, description="Engine temperature in °C")
    odometer: Optional[float] = Field(None, ge=0, description="Odometer reading in km")
    battery_voltage: Optional[float] = Field(None, gt=0, description="Battery voltage in volts")
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional telemetry data")

    @validator('location')
    def validate_location(cls, v):
        if v is not None:
            if 'lat' not in v or 'lng' not in v:
                raise ValueError("Location must contain 'lat' and 'lng'")
            if not (-90 <= v['lat'] <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180 <= v['lng'] <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        return v

class TelemetryCreate(TelemetryBase):
    pass

class Telemetry(TelemetryBase):
    received_at: datetime = Field(default_factory=datetime.utcnow)
    processed: bool = False
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TelemetryBatch(BaseModel):
    """Model for receiving multiple telemetry records at once"""
    records: List[TelemetryCreate]
    device_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)