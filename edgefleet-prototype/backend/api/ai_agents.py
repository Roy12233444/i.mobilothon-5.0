from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import random
import json
import os

router = APIRouter(
    prefix="/api/ai-agents",
    tags=["AI Agents"],
    responses={404: {"description": "Not found"}},
)

# Mock data for demonstration
MOCK_AGENTS = {
    "route-optimization": {
        "id": "route-optimization",
        "name": "Route Optimization Agent",
        "description": "Dynamically optimizes delivery routes based on real-time data",
        "status": "active",
        "lastRun": (datetime.utcnow() - timedelta(minutes=2)).isoformat(),
        "metrics": {
            "efficiency": "87%",
            "fuelSaved": "15%",
            "timeSaved": "22%"
        },
        "settings": {
            "autoRefresh": True,
            "alertThreshold": "medium",
            "dataRetention": "30 days",
            "notificationEnabled": True
        }
    },
    "predictive-maintenance": {
        "id": "predictive-maintenance",
        "name": "Predictive Maintenance",
        "description": "Predicts vehicle maintenance needs before breakdowns occur",
        "status": "active",
        "lastRun": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
        "metrics": {
            "issuesDetected": 3,
            "costSaved": "$2,450",
            "uptime": "99.2%"
        },
        "settings": {
            "autoRefresh": True,
            "alertThreshold": "high",
            "dataRetention": "90 days",
            "notificationEnabled": True
        }
    },
    "driver-behavior": {
        "id": "driver-behavior",
        "name": "Driver Behavior Analyst",
        "description": "Monitors and improves driver performance and safety",
        "status": "inactive",
        "lastRun": None,
        "metrics": {
            "safetyScore": "92%",
            "incidents": 2,
            "trainingNeeded": 1
        },
        "settings": {
            "autoRefresh": False,
            "alertThreshold": "medium",
            "dataRetention": "30 days",
            "notificationEnabled": True
        }
    },
    "load-optimization": {
        "id": "load-optimization",
        "name": "Load Optimization",
        "description": "Optimizes cargo loading for maximum efficiency",
        "status": "inactive",
        "lastRun": None,
        "metrics": {
            "spaceUtilized": "78%",
            "weightDist": "Optimal",
            "tripsSaved": "12%"
        },
        "settings": {
            "autoRefresh": False,
            "alertThreshold": "low",
            "dataRetention": "30 days",
            "notificationEnabled": False
        }
    },
    "demand-forecast": {
        "id": "demand-forecast",
        "name": "Demand Forecasting",
        "description": "Predicts delivery demand and optimizes resource allocation",
        "status": "inactive",
        "lastRun": None,
        "metrics": {
            "accuracy": "89%",
            "costReduction": "18%",
            "utilization": "82%"
        },
        "settings": {
            "autoRefresh": False,
            "alertThreshold": "medium",
            "dataRetention": "90 days",
            "notificationEnabled": True
        }
    },
    "security-monitor": {
        "id": "security-monitor",
        "name": "Security Monitor",
        "description": "Detects security threats and unusual activities",
        "status": "active",
        "lastRun": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
        "metrics": {
            "threatsBlocked": 24,
            "alerts": 3,
            "riskLevel": "Low"
        },
        "settings": {
            "autoRefresh": True,
            "alertThreshold": "high",
            "dataRetention": "30 days",
            "notificationEnabled": True
        }
    },
    "sustainability": {
        "id": "sustainability",
        "name": "Sustainability Agent",
        "description": "Reduces environmental impact and improves efficiency",
        "status": "inactive",
        "lastRun": None,
        "metrics": {
            "co2Reduced": "1.2t",
            "fuelSaved": "8%",
            "efficiency": "76%"
        },
        "settings": {
            "autoRefresh": False,
            "alertThreshold": "low",
            "dataRetention": "90 days",
            "notificationEnabled": False
        }
    }
}

class AgentSettings(BaseModel):
    autoRefresh: bool = True
    alertThreshold: str = "medium"  # low, medium, high
    dataRetention: str = "30 days"  # 7 days, 30 days, 90 days, 1 year
    notificationEnabled: bool = True

class AgentUpdate(BaseModel):
    status: Optional[str] = None
    settings: Optional[AgentSettings] = None

@router.get("/", response_model=List[Dict])
async def list_agents():
    """List all available AI agents"""
    return list(MOCK_AGENTS.values())

@router.get("/{agent_id}", response_model=Dict)
async def get_agent(agent_id: str):
    """Get details of a specific AI agent"""
    if agent_id not in MOCK_AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    return MOCK_AGENTS[agent_id]

@router.patch("/{agent_id}", response_model=Dict)
async def update_agent(agent_id: str, update: AgentUpdate):
    """Update agent status or settings"""
    if agent_id not in MOCK_AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = MOCK_AGENTS[agent_id]
    
    # Update status if provided
    if update.status is not None:
        if update.status not in ["active", "inactive"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'")
        agent["status"] = update.status
        
        # Update last run time if activating
        if update.status == "active":
            agent["lastRun"] = datetime.utcnow().isoformat()
    
    # Update settings if provided
    if update.settings is not None:
        if "settings" not in agent:
            agent["settings"] = {}
        agent["settings"].update(update.settings.dict(exclude_unset=True))
    
    return agent

@router.post("/{agent_id}/refresh", response_model=Dict)
async def refresh_agent(agent_id: str):
    """Refresh agent data and update metrics"""
    if agent_id not in MOCK_AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = MOCK_AGENTS[agent_id]
    
    # Update last run time
    agent["lastRun"] = datetime.utcnow().isoformat()
    
    # Simulate some metric updates
    if agent_id == "route-optimization":
        agent["metrics"]["efficiency"] = f"{random.randint(80, 95)}%"
        agent["metrics"]["fuelSaved"] = f"{random.randint(10, 25)}%"
        agent["metrics"]["timeSaved"] = f"{random.randint(15, 30)}%"
    elif agent_id == "predictive-maintenance":
        agent["metrics"]["issuesDetected"] = random.randint(0, 5)
        agent["metrics"]["costSaved"] = f"${random.randint(1000, 5000):,}"
        agent["metrics"]["uptime"] = f"{random.randint(98, 100)}.{random.randint(0, 9)}%"
    elif agent_id == "driver-behavior":
        agent["metrics"]["safetyScore"] = f"{random.randint(85, 98)}%"
        agent["metrics"]["incidents"] = random.randint(0, 5)
        agent["metrics"]["trainingNeeded"] = random.randint(0, 3)
    
    return agent

@router.post("/{agent_id}/execute", response_model=Dict)
async def execute_agent(agent_id: str, params: Optional[Dict] = None):
    """Execute an agent with the given parameters"""
    if agent_id not in MOCK_AGENTS:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = MOCK_AGENTS[agent_id]
    
    # Update last run time
    agent["lastRun"] = datetime.utcnow().isoformat()
    
    # Simulate execution
    result = {
        "agent_id": agent_id,
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        "execution_time_ms": random.randint(100, 2000),
        "results": {}
    }
    
    # Add some example results based on agent type
    if agent_id == "route-optimization":
        result["results"] = {
            "optimized_route": {
                "waypoints": ["A", "B", "C", "D"],
                "total_distance_km": 42.5,
                "estimated_time_min": 65,
                "fuel_savings": random.randint(10, 25)
            }
        }
    elif agent_id == "predictive-maintenance":
        result["results"] = {
            "maintenance_needed": [
                {
                    "component": "Brakes",
                    "severity": "high",
                    "estimated_failure_in": "2 weeks",
                    "recommended_action": "Schedule maintenance"
                },
                {
                    "component": "Engine Oil",
                    "severity": "medium",
                    "estimated_failure_in": "3 months",
                    "recommended_action": "Monitor and schedule oil change"
                }
            ]
        }
    
    return result
