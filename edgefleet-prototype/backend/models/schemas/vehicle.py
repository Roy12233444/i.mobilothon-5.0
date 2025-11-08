"""
Pydantic schemas for Vehicle resources.

This module contains Pydantic models used for request/response validation
and serialization of Vehicle resources.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from ..enums import VehicleStatus

class VehicleBase(BaseModel):
    """Base schema for Vehicle with common fields."""
    name: str = Field(..., min_length=2, max_length=100, description="Name of the vehicle")
    status: VehicleStatus = Field(
        default=VehicleStatus.OFFLINE, 
        description="Current status of the vehicle"
    )
    lat: float = Field(
        default=0.0,
        ge=-90,
        le=90,
        description="Latitude coordinate of the vehicle's current location"
    )
    lng: float = Field(
        default=0.0,
        ge=-180,
        le=180,
        description="Longitude coordinate of the vehicle's current location"
    )
    speed: float = Field(
        default=0.0,
        ge=0,
        description="Current speed of the vehicle in km/h"
    )
    fuel_level: float = Field(
        default=100.0,
        ge=0,
        le=100,
        description="Current fuel level as a percentage (0-100)"
    )
    driver_id: Optional[str] = Field(
        None,
        description="ID of the driver currently assigned to this vehicle"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the vehicle"
    )

    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "name": "Truck-42",
                "status": "active",
                "lat": 40.7128,
                "lng": -74.0060,
                "speed": 65.5,
                "fuel_level": 78.5,
                "driver_id": "driver_123",
                "metadata": {
                    "make": "Volvo",
                    "model": "VNL 760",
                    "year": 2023
                }
            }
        }

class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle."""
    id: str = Field(..., description="Unique identifier for the vehicle")

    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "id": "vehicle_123",
                "name": "Truck-42",
                "status": "active",
                "lat": 40.7128,
                "lng": -74.0060,
                "speed": 65.5,
                "fuel_level": 78.5,
                "driver_id": "driver_123",
                "metadata": {
                    "make": "Volvo",
                    "model": "VNL 760",
                    "year": 2023
                }
            }
        }

class VehicleUpdate(BaseModel):
    """Schema for updating an existing vehicle."""
    name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=100, 
        description="Updated name of the vehicle"
    )
    status: Optional[VehicleStatus] = Field(
        None, 
        description="Updated status of the vehicle"
    )
    lat: Optional[float] = Field(
        None,
        ge=-90,
        le=90,
        description="Updated latitude coordinate"
    )
    lng: Optional[float] = Field(
        None,
        ge=-180,
        le=180,
        description="Updated longitude coordinate"
    )
    speed: Optional[float] = Field(
        None,
        ge=0,
        description="Updated speed in km/h"
    )
    fuel_level: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Updated fuel level percentage (0-100)"
    )
    driver_id: Optional[str] = Field(
        None,
        description="Updated driver ID assignment"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated metadata"
    )

    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "name": "Truck-42-Updated",
                "status": "maintenance",
                "lat": 40.7129,
                "lng": -74.0061,
                "speed": 0.0,
                "fuel_level": 25.0,
                "driver_id": None,
                "metadata": {
                    "maintenance_required": True,
                    "last_service": "2025-10-15T10:30:00Z"
                }
            }
        }

class VehicleResponse(VehicleBase):
    """Schema for vehicle responses (read operations)."""
    id: str = Field(..., description="Unique identifier for the vehicle")
    created_at: datetime = Field(..., description="Timestamp when the vehicle was created")
    updated_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the vehicle was last updated"
    )

    class Config:
        """Pydantic config."""
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "vehicle_123",
                "name": "Truck-42",
                "status": "active",
                "lat": 40.7128,
                "lng": -74.0060,
                "speed": 65.5,
                "fuel_level": 78.5,
                "driver_id": "driver_123",
                "metadata": {
                    "make": "Volvo",
                    "model": "VNL 760",
                    "year": 2023
                },
                "created_at": "2025-01-15T08:30:00Z",
                "updated_at": "2025-11-05T14:22:10Z"
            }
        }
