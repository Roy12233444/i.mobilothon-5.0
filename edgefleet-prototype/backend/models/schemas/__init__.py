"""
Pydantic schemas for the EdgeFleet API.

This module contains all the Pydantic models used for request/response validation
and serialization in the EdgeFleet API.
"""
from .vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from .driver import DriverCreate, DriverUpdate, DriverResponse
from .alert import AlertCreate, AlertUpdate, AlertResponse
from .telemetry import TelemetryCreate, TelemetryBatch, TelemetryResponse

__all__ = [
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
