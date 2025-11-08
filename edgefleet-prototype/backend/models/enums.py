"""Enums for the EdgeFleet application."""
from enum import Enum

class VehicleStatus(str, Enum):
    """Enum representing the status of a vehicle."""
    ACTIVE = "active"
    IDLE = "idle"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"

class DriverStatus(str, Enum):
    """Enum representing the status of a driver."""
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class LicenseType(str, Enum):
    """Enum representing different types of driver's licenses."""
    CLASS_A = "class_a"  # Motorcycles, scooters, etc.
    CLASS_B = "class_b"  # Light motor vehicles
    CLASS_C = "class_c"  # Medium/heavy vehicles
    CLASS_D = "class_d"  # Commercial vehicles
    CLASS_E = "class_e"  # Special vehicles

class AlertType(str, Enum):
    """Enum representing different types of alerts."""
    SPEEDING = "speeding"
    HARD_BRAKING = "hard_braking"
    ROUTE_DEVIATION = "route_deviation"
    MAINTENANCE_REQUIRED = "maintenance_required"
    FUEL_LOW = "fuel_low"
    GEOTAG = "geotag"
    CUSTOM = "custom"

class AlertStatus(str, Enum):
    """Enum representing the status of an alert."""
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"

class AlertSeverity(str, Enum):
    """Enum representing the severity of an alert."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TelemetryType(str, Enum):
    """Enum representing different types of telemetry data."""
    LOCATION = "location"
    SPEED = "speed"
    FUEL = "fuel"
    ENGINE = "engine"
    DIAGNOSTIC = "diagnostic"
    CUSTOM = "custom"
