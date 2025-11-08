"""Alert model and schemas for the EdgeFleet application."""
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timezone
from sqlalchemy.sql import func
from sqlalchemy import Column, DateTime
from .enums import AlertType, AlertStatus, AlertSeverity
from database import Base
import uuid

class Alert(Base):
    """SQLAlchemy model for alerts."""
    __tablename__ = 'alerts'
    
    # Common fields from DBBaseModel
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    type = Column(SQLEnum(AlertType), nullable=False, index=True)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.OPEN, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    vehicle_id = Column(String, ForeignKey('vehicles.id'), index=True, nullable=True)
    driver_id = Column(String, ForeignKey('drivers.id'), index=True, nullable=True)
    
    # Location data
    location = Column(JSON, nullable=True)  # { "lat": float, "lng": float, "address": str }
    
    # Timestamps
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional metadata (renamed from 'metadata' to avoid SQLAlchemy conflict)
    alert_metadata = Column('metadata', JSON, default=dict, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="alerts")
    driver = relationship("Driver", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert(id='{self.id}', type='{self.type}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert alert to dictionary with proper datetime serialization."""
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "status": self.status,
            "title": self.title,
            "description": self.description,
            "vehicle_id": self.vehicle_id,
            "driver_id": self.driver_id,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "is_active": self.is_active,
            "metadata": self.alert_metadata
        }

# Pydantic models for request/response validation
class AlertBase(BaseModel):
    """Base schema for Alert with common fields."""
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
    
    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "type": "speeding",
                "severity": "high",
                "status": "open",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 20 km/h",
                "vehicle_id": "vehicle_123",
                "driver_id": "driver_456",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "New York, NY, USA"
                },
                "metadata": {
                    "speed_limit": 80,
                    "actual_speed": 100,
                    "location_name": "I-95 N, New York"
                }
            }
        }
    
    @validator('location')
    def validate_location(cls, v):
        if v is not None:
            if not all(key in v for key in ['lat', 'lng']):
                raise ValueError("Location must include 'lat' and 'lng'")
            if not (-90 <= v['lat'] <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180 <= v['lng'] <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        return v

class AlertCreate(AlertBase):
    """Schema for creating a new alert."""
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for the alert"
    )
    
    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "id": "alert_789",
                "type": "speeding",
                "severity": "high",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 20 km/h",
                "vehicle_id": "vehicle_123",
                "driver_id": "driver_456",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "New York, NY, USA"
                },
                "metadata": {
                    "speed_limit": 80,
                    "actual_speed": 100,
                    "location_name": "I-95 N, New York"
                }
            }
        }

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
    
    class Config:
        """Pydantic config."""
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "alert_789",
                "type": "speeding",
                "severity": "high",
                "status": "acknowledged",
                "title": "Speeding Alert",
                "description": "Vehicle exceeded speed limit by 20 km/h",
                "vehicle_id": "vehicle_123",
                "driver_id": "driver_456",
                "location": {
                    "lat": 40.7128,
                    "lng": -74.0060,
                    "address": "New York, NY, USA"
                },
                "metadata": {
                    "speed_limit": 80,
                    "actual_speed": 100,
                    "location_name": "I-95 N, New York"
                },
                "created_at": "2025-11-06T08:15:30Z",
                "updated_at": "2025-11-06T08:20:45Z",
                "acknowledged_at": "2025-11-06T08:20:45Z",
                "resolved_at": None,
                "is_active": True
            }
        }

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
    
    class Config:
        """Pydantic config."""
        schema_extra = {
            "example": {
                "status": "resolved",
                "description": "Driver acknowledged and reduced speed",
                "resolved_at": "2025-11-06T08:30:00Z",
                "metadata": {
                    "resolution_notes": "Driver was warned about speeding",
                    "action_taken": "Verbal warning issued"
                },
                "is_active": False
            }
        }
    
    @validator('resolved_at', 'acknowledged_at', pre=True)
    def validate_timestamps(cls, v):
        if v and not isinstance(v, datetime):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                raise ValueError("Invalid datetime format. Use ISO 8601 format (e.g., 2025-11-06T08:30:00Z)")
        return v