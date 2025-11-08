from sqlalchemy import Column, String, Float, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel
from datetime import datetime
import enum

class VehicleStatus(str, enum.Enum):
    ACTIVE = "active"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"

class Vehicle(BaseModel):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    driver_id = Column(String, ForeignKey('drivers.id'), nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.OFFLINE)
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    speed = Column(Float, default=0.0)
    fuel_level = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    driver = relationship("Driver", back_populates="vehicles")
    telemetry = relationship("Telemetry", back_populates="vehicle")
    alerts = relationship("Alert", back_populates="vehicle")

    def __repr__(self):
        return f"<Vehicle(id='{self.id}', name='{self.name}', status='{self.status}')>"

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from .base import BaseModel as DBBaseModel

# Pydantic models for API validation
class VehicleBase(BaseModel):
    name: str
    driver_id: Optional[str] = None
    status: str = "offline"
    lat: float = 0.0
    lng: float = 0.0
    speed: float = 0.0
    fuel_level: float = 100.0

    class Config:
        orm_mode = True

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    driver_id: Optional[str] = None
    status: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    speed: Optional[float] = None
    fuel_level: Optional[float] = None

    class Config:
        orm_mode = True