from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
import uuid

router = APIRouter()

# In-memory database (replace with a real database in production)
vehicles_db = []

# Pydantic models
class VehicleBase(BaseModel):
    name: str
    type: str = "truck"
    status: str = "active"
    fuel_type: str = "diesel"
    capacity: Optional[float] = None
    registration_number: Optional[str] = None
    last_service_date: Optional[date] = None
    next_service_date: Optional[date] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Helper function to find a vehicle by ID
def get_vehicle_by_id(vehicle_id: str):
    for vehicle in vehicles_db:
        if vehicle["id"] == vehicle_id:
            return vehicle
    return None

# Create a new vehicle
@router.post("", response_model=Vehicle)
async def create_vehicle(vehicle: VehicleCreate):
    print(f"Received vehicle data: {vehicle.dict()}")
    vehicle_dict = vehicle.dict()
    vehicle_dict["id"] = str(uuid.uuid4())
    vehicle_dict["created_at"] = datetime.utcnow()
    vehicle_dict["updated_at"] = datetime.utcnow()
    vehicles_db.append(vehicle_dict)
    print(f"Added new vehicle: {vehicle_dict}")
    print(f"Current vehicles in DB: {vehicles_db}")
    return vehicle_dict

# Get all vehicles
@router.get("", response_model=List[Vehicle])
async def get_vehicles():
    print(f"Returning vehicles: {vehicles_db}")
    return vehicles_db

# Get a single vehicle by ID
@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str):
    vehicle = get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

# Update a vehicle
@router.put("/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_update: VehicleCreate):
    vehicle = get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        vehicle[key] = value
    
    return vehicle

# Delete a vehicle
@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(vehicle_id: str):
    vehicle = get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicles_db.remove(vehicle)
    return {"message": "Vehicle deleted successfully"}