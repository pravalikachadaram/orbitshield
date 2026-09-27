from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Space Objects
class SpaceObjectBase(BaseModel):
    name: str
    norad_id: str
    object_type: str
    orbit_type: Optional[str] = "LEO"
    altitude_km: Optional[float] = None
    apogee_km: Optional[float] = None
    perigee_km: Optional[float] = None
    inclination_deg: Optional[float] = None
    eccentricity: Optional[float] = None
    period_min: Optional[float] = None
    tle_line1: Optional[str] = None
    tle_line2: Optional[str] = None
    tle_epoch: Optional[datetime] = None
    source: str = "DEMO"
    risk_status: str = "NOMINAL"

class SpaceObjectOut(SpaceObjectBase):
    id: str
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Satellite Registration & Monitored Satellite
class SatelliteRegisterRequest(BaseModel):
    name: Optional[str] = None
    norad_id: str
    custom_label: Optional[str] = None

class MonitoredSatelliteOut(BaseModel):
    id: str
    norad_id: str
    name: str
    object_type: str
    orbit_type: Optional[str] = "LEO"
    altitude_km: Optional[float] = None
    inclination_deg: Optional[float] = None
    period_min: Optional[float] = None
    source: str
    custom_label: Optional[str] = None
    tle_epoch: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Conjunction Analysis Request
class ConjunctionAnalysisRequest(BaseModel):
    target_norad_id: Optional[str] = Field(None, description="Monitored target NORAD ID")
    primary_object_id: Optional[str] = Field(None, description="Primary NORAD ID")
    secondary_object_id: Optional[str] = Field(None, description="Secondary/Candidate NORAD ID")
    time_window_hours: int = Field(24, ge=6, le=72, description="Analysis time window in hours (6, 12, 24, 48, 72)")
    analysis_window_hours: Optional[int] = None

# Risk Factors & Scoring
class RiskEvaluation(BaseModel):
    risk_score: float
    risk_index: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_factors: List[str]
    deterministic_explanation: str
    data_quality: str  # HIGH, MEDIUM, LOW

# Full Conjunction Response
class ConjunctionAnalysisResponse(BaseModel):
    conjunction_id: str
    target_norad_id: str
    object_norad_id: str
    primary_object: SpaceObjectOut
    secondary_object: SpaceObjectOut
    closest_approach_km: float
    relative_velocity_km_s: float
    time_of_closest_approach: datetime
    time_to_encounter_min: float
    time_to_encounter_hours: float
    analysis_window_hours: int
    risk_score: float
    risk_index: float
    risk_level: str
    risk_factors: List[str]
    deterministic_explanation: str
    ai_explanation: Optional[str] = None
    recommendation: str
    data_source: str
    data_mode: str  # live, demo
    data_quality: str
    calculation_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    alert_created: bool = False
    alert_id: Optional[str] = None

# Analysis Item for History Table
class ConjunctionHistoryItem(BaseModel):
    id: str
    conjunction_id: str
    primary_object_name: str
    primary_object_norad: str
    secondary_object_name: str
    secondary_object_norad: str
    closest_approach_km: float
    relative_velocity_km_s: float
    time_to_encounter_min: Optional[float] = 0.0
    risk_score: float
    risk_index: float
    risk_level: str
    time_of_closest_approach: datetime
    data_mode: str
    created_at: datetime

# Alerts
class AlertOut(BaseModel):
    id: str
    conjunction_id: str
    severity: str
    title: str
    message: str
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    primary_object_name: Optional[str] = None
    primary_object_norad: Optional[str] = None
    secondary_object_name: Optional[str] = None
    secondary_object_norad: Optional[str] = None
    closest_approach_km: Optional[float] = None
    risk_score: Optional[float] = None
    risk_index: Optional[float] = None

    class Config:
        from_attributes = True

# System Status
class ServiceStatus(BaseModel):
    name: str
    status: str  # Operational, Degraded, Unavailable
    latency_ms: Optional[float] = None
    details: Optional[str] = None

class SystemStatusResponse(BaseModel):
    status: str  # Operational, Degraded, Unavailable
    timestamp: datetime
    version: str
    environment: str
    data_mode: str  # live, demo
    services: List[ServiceStatus]
    tracked_objects_count: int
    active_satellites_count: int
    debris_count: int
    critical_conjunctions_count: int

# Auth
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Flight Dynamics Officer"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
