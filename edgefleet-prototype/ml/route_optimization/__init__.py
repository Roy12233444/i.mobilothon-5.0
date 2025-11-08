"""
Route Optimization Module for EdgeFleet

This module provides tools for optimizing vehicle routes, calculating fuel consumption,
and managing road network graphs for fleet management.
"""

from .fuel_calculator import FuelCalculator
from .graph_builder import RouteGraphBuilder
from .optimizer import RouteOptimizer

__all__ = ['FuelCalculator', 'RouteGraphBuilder', 'RouteOptimizer']
