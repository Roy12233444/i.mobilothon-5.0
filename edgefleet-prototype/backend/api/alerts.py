from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from enum import Enum

router = APIRouter()

# In-memory storage for alerts (replace with database in production)
alerts_db = [
    {
        'id': '1',
        'title': 'Low Fuel Alert',
        'message': 'Vehicle VH1001 is running low on fuel (15% remaining)',
        'severity': 'warning',
        'type': 'vehicle',
        'status': 'open',
        'source': 'vehicle_sensor',
        'related_id': 'VH1001',
        'created_at': datetime.utcnow() - timedelta(hours=2),
        'updated_at': datetime.utcnow() - timedelta(hours=2)
    },
    {
        'id': '2',
        'title': 'Rough Driving Detected',
        'message': 'Harsh braking detected for Driver D1001',
        'severity': 'error',
        'type': 'driver',
        'status': 'acknowledged',
        'source': 'telematics',
        'related_id': 'D1001',
        'created_at': datetime.utcnow() - timedelta(days=1),
        'updated_at': datetime.utcnow() - timedelta(hours=5)
    },
    {
        'id': '3',
        'title': 'Maintenance Due',
        'message': 'Scheduled maintenance due for Vehicle VH1002',
        'severity': 'info',
        'type': 'maintenance',
        'status': 'open',
        'source': 'maintenance_system',
        'related_id': 'VH1002',
        'created_at': datetime.utcnow() - timedelta(days=2),
        'updated_at': datetime.utcnow() - timedelta(days=1)
    },
    {
        'id': '4',
        'title': 'Engine Overheating',
        'message': 'Engine temperature critical for Vehicle VH1003',
        'severity': 'critical',
        'type': 'vehicle',
        'status': 'open',
        'source': 'vehicle_sensor',
        'related_id': 'VH1003',
        'created_at': datetime.utcnow() - timedelta(hours=1),
        'updated_at': datetime.utcnow() - timedelta(minutes=30)
    },
    {
        'id': '5',
        'title': 'System Update Available',
        'message': 'New system update available for installation',
        'severity': 'info',
        'type': 'system',
        'status': 'open',
        'source': 'system',
        'created_at': datetime.utcnow() - timedelta(days=3),
        'updated_at': datetime.utcnow() - timedelta(days=3)
    }
]

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

class AlertType(str, Enum):
    VEHICLE = "vehicle"
    DRIVER = "driver"
    SYSTEM = "system"
    MAINTENANCE = "maintenance"
    SECURITY = "security"

class AlertBase(BaseModel):
    title: str
    message: str
    severity: AlertSeverity = AlertSeverity.INFO
    type: AlertType = AlertType.SYSTEM
    source: Optional[str] = None
    related_id: Optional[str] = None  # Could be vehicle_id, driver_id, etc.
    metadata: dict = {}

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: str
    status: AlertStatus = AlertStatus.OPEN
    created_at: datetime
    updated_at: datetime
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Helper function to get alert by ID
def get_alert(alert_id: str):
    for alert in alerts_db:
        if alert['id'] == alert_id:
            return alert
    return None

# Create a new alert
@router.post("/", response_model=Alert)
async def create_alert(alert: AlertCreate):
    alert_data = alert.dict()
    alert_data.update({
        'id': str(uuid.uuid4()),
        'status': AlertStatus.OPEN,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    })
    alerts_db.append(alert_data)
    return alert_data

# Get all alerts with optional filtering
@router.get("/", response_model=List[Alert])
async def get_alerts(
    status: Optional[AlertStatus] = None,
    severity: Optional[AlertSeverity] = None,
    alert_type: Optional[AlertType] = None,
    limit: int = 100
):
    filtered = alerts_db
    if status:
        filtered = [a for a in filtered if a['status'] == status]
    if severity:
        filtered = [a for a in filtered if a['severity'] == severity]
    if alert_type:
        filtered = [a for a in filtered if a['type'] == alert_type]
    return filtered[:limit]

# Get a specific alert
@router.get("/{alert_id}", response_model=Alert)
async def get_alert_by_id(alert_id: str):
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

# Update alert status
@router.patch("/{alert_id}", response_model=Alert)
async def update_alert_status(alert_id: str, status: AlertStatus, user_id: str):
    alert = get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert['status'] = status
    alert['updated_at'] = datetime.utcnow()
    
    if status == AlertStatus.ACKNOWLEDGED:
        alert['acknowledged_by'] = user_id
    elif status == AlertStatus.RESOLVED:
        alert['resolved_at'] = datetime.utcnow()
    
    return alert

# Delete an alert
@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    global alerts_db
    initial_length = len(alerts_db)
    alerts_db = [a for a in alerts_db if a['id'] != alert_id]
    if len(alerts_db) == initial_length:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}

# Add some sample alerts if none exist
if not alerts_db:
    sample_alerts = [
        {
            'id': str(uuid.uuid4()),
            'title': 'New vehicle added',
            'message': 'A new vehicle (Truck-101) has been added to the fleet',
            'severity': AlertSeverity.INFO,
            'type': AlertType.VEHICLE,
            'status': AlertStatus.OPEN,
            'created_at': datetime.utcnow() - timedelta(hours=2),
            'updated_at': datetime.utcnow() - timedelta(hours=2),
            'source': 'fleet-management',
            'metadata': {'vehicle_id': 'truck-101'}
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Maintenance required',
            'message': 'Vehicle (Truck-42) is due for maintenance',
            'severity': AlertSeverity.WARNING,
            'type': AlertType.MAINTENANCE,
            'status': AlertStatus.OPEN,
            'created_at': datetime.utcnow() - timedelta(hours=1),
            'updated_at': datetime.utcnow() - timedelta(hours=1),
            'source': 'maintenance-scheduler',
            'metadata': {'vehicle_id': 'truck-42', 'maintenance_code': 'OIL_CHANGE'}
        },
        {
            'id': str(uuid.uuid4()),
            'title': 'Driver shift violation',
            'message': 'Driver JohnD has exceeded maximum shift hours',
            'severity': AlertSeverity.ERROR,
            'type': AlertType.DRIVER,
            'status': AlertStatus.OPEN,
            'created_at': datetime.utcnow() - timedelta(minutes=30),
            'updated_at': datetime.utcnow() - timedelta(minutes=30),
            'source': 'driver-monitoring',
            'metadata': {'driver_id': 'driver-007', 'hours_worked': 13}
        }
    ]
    alerts_db.extend(sample_alerts)