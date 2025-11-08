"""Base model definitions for the application."""
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import declarative_base
from database import Base as DBBase
from datetime import datetime
import re

class BaseModel(DBBase):
    """Base model class that provides common fields and methods for all models."""
    __abstract__ = True
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @declared_attr
    def __tablename__(cls):
        """
        Generate table name from class name.
        Converts CamelCase class name to snake_case table name.
        """
        # Convert CamelCase to snake_case
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
    
    def to_dict(self):
        """
        Convert model instance to dictionary.
        
        Returns:
            dict: Dictionary representation of the model instance.
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
    
    def update(self, **kwargs):
        """
        Update model attributes with provided key-value pairs.
        
        Args:
            **kwargs: Key-value pairs of attributes to update.
            
        Returns:
            self: The updated model instance.
        """
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return self
