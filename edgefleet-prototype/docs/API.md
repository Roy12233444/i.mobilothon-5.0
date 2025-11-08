# 📚 EdgeFleet API Documentation

## Base URL
```
http://localhost:8000
```

## Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🔐 Authentication
Currently, the API is open (no authentication required for prototype).

**Future Implementation:**
- JWT-based authentication
- API key support
- Role-based access control (Admin, Manager, Driver)

---

## 📍 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint - API info |
| GET | `/health` | Health check |
| GET | `/api/vehicles` | Get all vehicles |
| GET | `/api/vehicles/{vehicle_id}` | Get specific vehicle |
| GET | `/api/drivers` | Get all drivers |
| GET | `/api/drivers/{driver_id}` | Get specific driver |
| GET | `/api/alerts` | Get recent alerts |
| POST | `/api/alerts` | Create new alert |
| GET | `/api/route-optimization/{vehicle_id}` | Get route optimization |
| GET | `/api/analytics/summary` | Get analytics summary |
| WS | `/ws` | WebSocket connection |

---

## 🚗 Vehicles API

### Get All Vehicles

**Endpoint:** `GET /api/vehicles`

**Description:** Retrieve a list of all vehicles in the fleet.

**Response:**
```json
{
  "vehicles": [
    {
      "id": "V001",
      "name": "Truck Alpha",
      "driver_id": "D001",
      "status": "active",
      "lat": 12.9716,
      "lng": 77.5946,
      "speed": 45.5,
      "fuel_level": 75.0
    },
    {
      "id": "V002",
      "name": "Van Beta",
      "driver_id": "D002",
      "status": "idle",
      "lat": 12.9352,
      "lng": 77.6245,
      "speed": 0.0,
      "fuel_level": 60.0
    }
  ],
  "total": 4
}
```

**Status Codes:**
- `200 OK` - Success

**Example cURL:**
```bash
curl http://localhost:8000/api/vehicles
```

---

### Get Vehicle by ID

**Endpoint:** `GET /api/vehicles/{vehicle_id}`

**Parameters:**
- `vehicle_id` (path) - Vehicle identifier (e.g., "V001")

**Response:**
```json
{
  "id": "V001",
  "name": "Truck Alpha",
  "driver_id": "D001",
  "status": "active",
  "lat": 12.9716,
  "lng": 77.5946,
  "speed": 45.5,
  "fuel_level": 75.0
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Vehicle not found

**Example cURL:**
```bash
curl http://localhost:8000/api/vehicles/V001
```

---

## 👤 Drivers API

### Get All Drivers

**Endpoint:** `GET /api/drivers`

**Description:** Retrieve a list of all drivers with their performance metrics.

**Response:**
```json
{
  "drivers": [
    {
      "id": "D001",
      "name": "Rajesh Kumar",
      "score": 85.5,
      "total_trips": 124,
      "harsh_braking": 8,
      "speeding_incidents": 5
    },
    {
      "id": "D002",
      "name": "Amit Sharma",
      "score": 92.3,
      "total_trips": 98,
      "harsh_braking": 3,
      "speeding_incidents": 2
    }
  ],
  "total": 4
}
```

**Status Codes:**
- `200 OK` - Success

**Example cURL:**
```bash
curl http://localhost:8000/api/drivers
```

---

### Get Driver by ID

**Endpoint:** `GET /api/drivers/{driver_id}`

**Parameters:**
- `driver_id` (path) - Driver identifier (e.g., "D001")

**Response:**
```json
{
  "id": "D001",
  "name": "Rajesh Kumar",
  "score": 85.5,
  "total_trips": 124,
  "harsh_braking": 8,
  "speeding_incidents": 5
}
```

**Driver Score Calculation:**
```
Base Score = 100
Penalty for harsh braking = harsh_braking_count * 1.5
Penalty for speeding = speeding_incidents * 2.0
Final Score = Base Score - (Harsh Braking Penalty + Speeding Penalty)
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Driver not found

**Example cURL:**
```bash
curl http://localhost:8000/api/drivers/D001
```

---

## 🚨 Alerts API

### Get Recent Alerts

**Endpoint:** `GET /api/alerts`

**Description:** Retrieve the last 50 alerts from the system.

**Response:**
```json
{
  "alerts": [
    {
      "id": "A0001",
      "vehicle_id": "V001",
      "type": "harsh_braking",
      "severity": "medium",
      "message": "Harsh braking detected for Truck Alpha",
      "timestamp": "2025-11-06T10:30:45.123456"
    },
    {
      "id": "A0002",
      "vehicle_id": "V002",
      "type": "speeding",
      "severity": "high",
      "message": "Speeding detected: Van Beta at 72.3 km/h",
      "timestamp": "2025-11-06T10:32:12.654321"
    }
  ],
  "total": 2
}
```

**Alert Types:**
- `harsh_braking` - Sudden deceleration detected
- `speeding` - Vehicle exceeding speed limit
- `low_fuel` - Fuel level below 20%
- `maintenance` - Scheduled maintenance due
- `deviation` - Route deviation detected

**Severity Levels:**
- `high` - Immediate attention required
- `medium` - Should be addressed soon
- `low` - Informational

**Status Codes:**
- `200 OK` - Success

**Example cURL:**
```bash
curl http://localhost:8000/api/alerts
```

---

### Create Alert

**Endpoint:** `POST /api/alerts`

**Description:** Create a new alert (used internally by system).

**Request Body:**
```json
{
  "id": "A0003",
  "vehicle_id": "V001",
  "type": "low_fuel",
  "severity": "medium",
  "message": "Low fuel alert: Truck Alpha at 18.5%",
  "timestamp": "2025-11-06T10:35:00.000000"
}
```

**Response:**
```json
{
  "id": "A0003",
  "vehicle_id": "V001",
  "type": "low_fuel",
  "severity": "medium",
  "message": "Low fuel alert: Truck Alpha at 18.5%",
  "timestamp": "2025-11-06T10:35:00.000000"
}
```

**Status Codes:**
- `200 OK` - Alert created successfully

**Example cURL:**
```bash
curl -X POST http://localhost:8000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "A0003",
    "vehicle_id": "V001",
    "type": "low_fuel",
    "severity": "medium",
    "message": "Low fuel alert",
    "timestamp": "2025-11-06T10:35:00.000000"
  }'
```

---

## 🛣️ Route Optimization API

### Get Route Optimization

**Endpoint:** `GET /api/route-optimization/{vehicle_id}`

**Parameters:**
- `vehicle_id` (path) - Vehicle identifier

**Description:** Get optimized route analysis for a vehicle.

**Response:**
```json
{
  "vehicle_id": "V001",
  "original_distance": 125.5,
  "optimized_distance": 112.3,
  "fuel_saved": 5.28,
  "time_saved": 19.8,
  "savings_percentage": 10.5
}
```

**Calculations:**
- `fuel_saved` = (original_distance - optimized_distance) * 0.4 L/km
- `time_saved` = (original_distance - optimized_distance) / 40 km/h * 60 min
- `savings_percentage` = (distance_saved / original_distance) * 100

**Status Codes:**
- `200 OK` - Success

**Example cURL:**
```bash
curl http://localhost:8000/api/route-optimization/V001
```

---

## 📊 Analytics API

### Get Analytics Summary

**Endpoint:** `GET /api/analytics/summary`

**Description:** Get overall fleet analytics and key metrics.

**Response:**
```json
{
  "total_vehicles": 4,
  "active_vehicles": 3,
  "idle_vehicles": 1,
  "avg_driver_score": 86.35,
  "total_alerts": 47,
  "high_priority_alerts": 8,
  "fleet_efficiency": 88.5
}
```

**Metrics Explanation:**
- `total_vehicles` - Total fleet size
- `active_vehicles` - Currently moving vehicles
- `idle_vehicles` - Parked/stopped vehicles
- `avg_driver_score` - Average score across all drivers
- `total_alerts` - All alerts generated today
- `high_priority_alerts` - Alerts with "high" severity
- `fleet_efficiency` - Overall fleet performance (0-100)

**Status Codes:**
- `200 OK` - Success

**Example cURL:**
```bash
curl http://localhost:8000/api/analytics/summary
```

---

## 🔌 WebSocket API

### Connect to Real-Time Updates

**Endpoint:** `WS /ws`

**Description:** WebSocket connection for real-time vehicle updates and alerts.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to EdgeFleet WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'vehicle_update') {
    console.log('Vehicle positions updated:', data.data);
  } else if (data.type === 'new_alert') {
    console.log('New alert received:', data.data);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket');
};
```

**Message Types:**

#### Vehicle Update
```json
{
  "type": "vehicle_update",
  "data": [
    {
      "id": "V001",
      "lat": 12.9716,
      "lng": 77.5946,
      "speed": 45.5,
      "fuel_level": 74.8
    }
  ]
}
```
**Frequency:** Every 5 seconds

#### New Alert
```json
{
  "type": "new_alert",
  "data": {
    "id": "A0123",
    "vehicle_id": "V002",
    "type": "harsh_braking",
    "severity": "medium",
    "message": "Harsh braking detected",
    "timestamp": "2025-11-06T10:45:30.123456"
  }
}
```
**Frequency:** As events occur

---

## 🏥 Health Check

### Health Check Endpoint

**Endpoint:** `GET /health`

**Description:** Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T10:30:00.123456"
}
```

**Status Codes:**
- `200 OK` - API is healthy

**Example cURL:**
```bash
curl http://localhost:8000/health
```

---

## 🔧 Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message description"
}
```

### Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## 📝 Rate Limiting

**Current:** No rate limiting (prototype)

**Future Implementation:**
- 100 requests per minute per IP
- 1000 requests per hour per API key
- WebSocket: 1 connection per client

---

## 🧪 Testing the API

### Using cURL

```bash
# Get all vehicles
curl http://localhost:8000/api/vehicles

# Get specific driver
curl http://localhost:8000/api/drivers/D001

# Get analytics
curl http://localhost:8000/api/analytics/summary
```

### Using Python

```python
import requests

# Get vehicles
response = requests.get('http://localhost:8000/api/vehicles')
vehicles = response.json()
print(vehicles)

# Create alert
alert_data = {
    "id": "A9999",
    "vehicle_id": "V001",
    "type": "test_alert",
    "severity": "low",
    "message": "Test alert",
    "timestamp": "2025-11-06T12:00:00"
}
response = requests.post('http://localhost:8000/api/alerts', json=alert_data)
print(response.json())
```

### Using JavaScript (Fetch)

```javascript
// Get drivers
fetch('http://localhost:8000/api/drivers')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Get route optimization
fetch('http://localhost:8000/api/route-optimization/V001')
  .then(response => response.json())
  .then(data => console.log('Route optimization:', data));
```

---

## 📊 Data Models

### Vehicle Model
```typescript
interface Vehicle {
  id: string;           // Unique identifier (e.g., "V001")
  name: string;         // Vehicle name (e.g., "Truck Alpha")
  driver_id: string;    // Associated driver ID
  status: string;       // "active" | "idle" | "maintenance"
  lat: number;          // Latitude coordinate
  lng: number;          // Longitude coordinate
  speed: number;        // Current speed in km/h
  fuel_level: number;   // Fuel level percentage (0-100)
}
```

### Driver Model
```typescript
interface Driver {
  id: string;              // Unique identifier (e.g., "D001")
  name: string;            // Driver name
  score: number;           // Performance score (0-100)
  total_trips: number;     // Total trips completed
  harsh_braking: number;   // Count of harsh braking events
  speeding_incidents: number; // Count of speeding violations
}
```

### Alert Model
```typescript
interface Alert {
  id: string;              // Unique identifier
  vehicle_id: string;      // Associated vehicle
  type: string;            // Alert type
  severity: string;        // "high" | "medium" | "low"
  message: string;         // Human-readable message
  timestamp: string;       // ISO 8601 datetime
}
```

---

## 🎓 Best Practices

1. **Always check response status codes**
2. **Handle WebSocket disconnections gracefully**
3. **Cache frequently accessed data**
4. **Use compression for large responses** (gzip)
5. **Implement exponential backoff for retries**

---

## 📞 Support

- **Interactive Docs**: http://localhost:8000/docs
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/edgefleet/issues)
- **Email**: api-support@edgefleet.com

---

**Last Updated:** November 6, 2025  
**API Version:** 1.0.0