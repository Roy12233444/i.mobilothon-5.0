"""
Driver-related Pydantic models for request/response validation.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, HttpUrl, validator, ConfigDict
import re

class LicenseType(str, Enum):
    LEARNER = "LEARNER"
    RESTRICTED = "RESTRICTED"
    FULL = "FULL"
    HEAVY = "HEAVY"

class DriverStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    SUSPENDED = "SUSPENDED"
    TERMINATED = "TERMINATED"

class DriverBase(BaseModel):
    """Base schema for Driver with common fields."""
    model_config = ConfigDict(
        from_attributes=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "license_number": "DL12345678",
                "license_type": "FULL",
                "license_expiry": "2030-12-31",
                "status": "ACTIVE",
                "hire_date": "2023-01-15",
                "address": "123 Main St",
                "city": "New York",
                "country": "USA",
                "postal_code": "10001",
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+1987654321",
                "profile_image_url": "https://example.com/profiles/john_doe.jpg"
            }
        }
    )
    
    first_name: str = Field(..., min_length=2, max_length=50, description="Driver's first name")
    last_name: str = Field(..., min_length=2, max_length=50, description="Driver's last name")
    email: EmailStr = Field(..., description="Driver's email address")
    phone: str = Field(..., min_length=10, max_length=20, description="Driver's contact number")
    license_number: str = Field(..., description="Driver's license number")
    license_type: LicenseType = Field(..., description="Type of driver's license")
    license_expiry: date = Field(..., description="License expiry date")
    status: DriverStatus = Field(
        default=DriverStatus.ACTIVE, 
        description="Current status of the driver"
    )
    hire_date: date = Field(..., description="Date when the driver was hired")
    address: Optional[str] = Field(None, max_length=255, description="Driver's street address")
    city: Optional[str] = Field(None, max_length=100, description="Driver's city")
    country: Optional[str] = Field(None, max_length=100, description="Driver's country")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal/ZIP code")
    emergency_contact_name: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Name of emergency contact person"
    )
    emergency_contact_phone: Optional[str] = Field(
        None, 
        min_length=10, 
        max_length=20, 
        description="Emergency contact phone number"
    )
    profile_image_url: Optional[HttpUrl] = Field(
        None, 
        description="URL to the driver's profile image"
    )
    
    @validator('phone', 'emergency_contact_phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[0-9\s-]{10,20}$', v):
            raise ValueError("Phone number must be 10-20 digits, with optional '+' prefix and spaces/dashes")
        return v.replace(' ', '').replace('-', '') if v else v
    
    @validator('license_number')
    def validate_license_number(cls, v):
        if not re.match(r'^[A-Z0-9]{8,20}$', v, re.IGNORECASE):
            raise ValueError("License number must be 8-20 alphanumeric characters")
        return v.upper()

class DriverCreate(DriverBase):
    """Schema for creating a new driver."""
    pass

class DriverUpdate(BaseModel):
    """Schema for updating an existing driver."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "first_name": "John",
                "last_name": "Doe Updated",
                "email": "john.doe.updated@example.com",
                "phone": "+1987654321",
                "license_number": "DL12345678",
                "license_type": "FULL",
                "license_expiry": "2025-12-31",
                "status": "on_leave",
                "address": "456 Updated St",
                "city": "Los Angeles",
                "country": "USA",
                "postal_code": "90001",
                "emergency_contact_name": "Jane Smith",
                "emergency_contact_phone": "+1987654322",
                "profile_image_url": "https://example.com/profiles/john_doe_updated.jpg",
                "is_active": True
            }
        }
    )
    
    first_name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=50, 
        description="Updated first name"
    )
    last_name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=50, 
        description="Updated last name"
    )
    email: Optional[EmailStr] = Field(
        None, 
        description="Updated email address"
    )
    phone: Optional[str] = Field(
        None, 
        min_length=10, 
        max_length=20, 
        description="Updated phone number"
    )
    license_number: Optional[str] = Field(
        None, 
        description="Updated license number"
    )
    license_type: Optional[LicenseType] = Field(
        None, 
        description="Updated license type"
    )
    license_expiry: Optional[date] = Field(
        None, 
        description="Updated license expiry date"
    )
    status: Optional[DriverStatus] = Field(
        None, 
        description="Updated driver status"
    )
    hire_date: Optional[date] = Field(
        None,
        description="Updated hire date"
    )
    address: Optional[str] = Field(
        None, 
        max_length=255, 
        description="Updated street address"
    )
    city: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Updated city"
    )
    country: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Updated country"
    )
    postal_code: Optional[str] = Field(
        None, 
        max_length=20, 
        description="Updated postal/ZIP code"
    )
    emergency_contact_name: Optional[str] = Field(
        None, 
        max_length=100, 
        description="Name of emergency contact person"
    )
    emergency_contact_phone: Optional[str] = Field(
        None, 
        min_length=10, 
        max_length=20, 
        description="Updated emergency contact phone"
    )
    profile_image_url: Optional[HttpUrl] = Field(
        None, 
        description="Updated profile image URL"
    )
    is_active: Optional[bool] = Field(
        None, 
        description="Whether the driver account is active"
    )
    
    @validator('phone', 'emergency_contact_phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+?[0-9\s-]{10,20}$', v):
            raise ValueError("Phone number must be 10-20 digits, with optional '+' prefix and spaces/dashes")
        return v.replace(' ', '').replace('-', '') if v else v

class DriverResponse(DriverBase):
    """Schema for driver responses (read operations)."""
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "license_number": "DL12345678",
                "license_type": "FULL",
                "license_expiry": "2030-12-31",
                "status": "ACTIVE",
                "hire_date": "2023-01-15",
                "address": "123 Main St",
                "city": "New York",
                "country": "USA",
                "postal_code": "10001",
                "emergency_contact_name": "Jane Doe",
                "emergency_contact_phone": "+1987654321",
                "profile_image_url": "https://example.com/profiles/john_doe.jpg",
                "created_at": "2023-01-15T10:30:00Z",
                "updated_at": "2023-01-15T10:30:00Z",
                "is_active": True
            }
        }
    )
    
    id: str = Field(..., description="Unique identifier for the driver")
    created_at: datetime = Field(..., description="Timestamp when the driver was created")
    updated_at: Optional[datetime] = Field(
        None, 
        description="Timestamp when the driver was last updated"
    )
    is_active: bool = Field(..., description="Whether the driver account is active")
