from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

# Absolute imports
from database import get_db
from models.driver import Driver, DriverCreate, DriverResponse, DriverUpdate
from models.enums import DriverStatus

router = APIRouter(
    prefix="/drivers",
    tags=["drivers"],
    responses={404: {"description": "Not found"}},
)

# Helper function to get driver by ID
def get_driver(db: Session, driver_id: str):
    return db.query(Driver).filter(Driver.id == driver_id).first()

# Create a new driver
@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    db_driver = db.query(Driver).filter(Driver.email == driver.email).first()
    if db_driver:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if license number already exists
    db_license = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if db_license:
        raise HTTPException(status_code=400, detail="License number already registered")
    
    # Create new driver
    db_driver = Driver(
        id=str(uuid.uuid4()),
        first_name=driver.first_name,
        last_name=driver.last_name,
        email=driver.email,
        phone=driver.phone,
        license_number=driver.license_number,
        license_type=driver.license_type,
        license_expiry=driver.license_expiry,
        status=driver.status,
        address=driver.address,
        city=driver.city,
        country=driver.country,
        postal_code=driver.postal_code,
        emergency_contact_name=driver.emergency_contact_name,
        emergency_contact_phone=driver.emergency_contact_phone,
        profile_image_url=driver.profile_image_url,
        is_active=driver.is_active if hasattr(driver, 'is_active') else True
    )
    
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

# Get all drivers
@router.get("", response_model=List[DriverResponse])
def read_drivers(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[DriverStatus] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Driver)
    
    if status:
        query = query.filter(Driver.status == status)
    if is_active is not None:
        query = query.filter(Driver.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

# Get a single driver by ID
@router.get("/{driver_id}", response_model=DriverResponse)
def read_driver(driver_id: str, db: Session = Depends(get_db)):
    db_driver = get_driver(db, driver_id=driver_id)
    if db_driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    return db_driver

# Update a driver
@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(
    driver_id: str, 
    driver_update: DriverUpdate, 
    db: Session = Depends(get_db)
):
    db_driver = get_driver(db, driver_id=driver_id)
    if db_driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Update driver fields
    update_data = driver_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_driver, field, value)
    
    db_driver.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_driver)
    return db_driver

# Delete a driver (soft delete)
@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(driver_id: str, db: Session = Depends(get_db)):
    db_driver = get_driver(db, driver_id=driver_id)
    if db_driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Soft delete by setting is_active to False
    db_driver.is_active = False
    db_driver.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Driver deactivated successfully"}