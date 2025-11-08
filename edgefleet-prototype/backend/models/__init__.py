"""
EdgeFleet Models Package

This package contains all the database models and schemas for the EdgeFleet application.
"""
# Import enums first
from models.enums import (
    VehicleStatus,
    DriverStatus,
    LicenseType,
    AlertType,
    AlertStatus,
    AlertSeverity,
    TelemetryType
)

# Import models
from models.vehicle import Vehicle
from models.driver import Driver
from models.alert import Alert
from models.telemetry import Telemetry

# Import Pydantic schemas
from models.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from models.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from models.schemas.alert import AlertCreate, AlertUpdate, AlertResponse
from models.schemas.telemetry import TelemetryCreate, TelemetryBatch, TelemetryResponse

# Make models and schemas available at package level
__all__ = [
    # Enums
    'VehicleStatus',
    'DriverStatus',
    'LicenseType',
    'AlertType',
    'AlertStatus',
    'AlertSeverity',
    'TelemetryType',
    
    # Models
    'Vehicle',
    'Driver',
    'Alert',
    'Telemetry',
    
    # Schemas
    'VehicleCreate',
    'VehicleUpdate',
    'VehicleResponse',
    'DriverCreate',
    'DriverUpdate',
    'DriverResponse',
    'AlertCreate',
    'AlertUpdate',
    'AlertResponse',
    'TelemetryCreate',
    'TelemetryBatch',
    'TelemetryResponse'
]