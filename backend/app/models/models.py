from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="Flight Dynamics Officer")
    role = Column(String, default="OPERATOR")
    created_at = Column(DateTime, default=datetime.utcnow)

    monitored_satellites = relationship("MonitoredSatellite", back_populates="user", cascade="all, delete-orphan")

class SpaceObject(Base):
    __tablename__ = "objects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True, nullable=False)
    norad_id = Column(String, unique=True, index=True, nullable=False)
    object_type = Column(String, default="PAYLOAD")  # PAYLOAD, DEBRIS, ROCKET_BODY, UNKNOWN
    orbit_type = Column(String, default="LEO")       # LEO, MEO, GEO, HEO
    altitude_km = Column(Float, nullable=True)
    apogee_km = Column(Float, nullable=True)
    perigee_km = Column(Float, nullable=True)
    inclination_deg = Column(Float, nullable=True)
    eccentricity = Column(Float, nullable=True)
    period_min = Column(Float, nullable=True)
    tle_line1 = Column(String, nullable=True)
    tle_line2 = Column(String, nullable=True)
    tle_epoch = Column(DateTime, nullable=True)
    source = Column(String, default="DEMO")          # CELESTRAK, SPACE-TRACK, DEMO
    risk_status = Column(String, default="NOMINAL")  # NOMINAL, ELEVATED, CRITICAL
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    monitored_records = relationship("MonitoredSatellite", back_populates="satellite", cascade="all, delete-orphan")

class MonitoredSatellite(Base):
    __tablename__ = "monitored_satellites"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    object_norad_id = Column(String, ForeignKey("objects.norad_id"), nullable=False)
    custom_label = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="monitored_satellites")
    satellite = relationship("SpaceObject", back_populates="monitored_records")

class Conjunction(Base):
    __tablename__ = "conjunctions"

    id = Column(String, primary_key=True, default=generate_uuid)
    primary_object_id = Column(String, ForeignKey("objects.norad_id"), nullable=False)
    secondary_object_id = Column(String, ForeignKey("objects.norad_id"), nullable=False)
    closest_approach_km = Column(Float, nullable=False)
    relative_velocity_km_s = Column(Float, nullable=False)
    time_of_closest_approach = Column(DateTime, nullable=False)
    time_to_encounter_min = Column(Float, nullable=True, default=0.0)
    analysis_window_hours = Column(Integer, default=24)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)      # LOW, MEDIUM, HIGH, CRITICAL
    data_mode = Column(String, default="demo")       # live, demo
    data_source = Column(String, default="DEMO")     # CELESTRAK, DEMO
    created_at = Column(DateTime, default=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="conjunction", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="conjunction", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    conjunction_id = Column(String, ForeignKey("conjunctions.id"), nullable=False)
    risk_factors = Column(JSON, nullable=False, default=list)
    ai_explanation = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=False)
    calculation_metadata = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    conjunction = relationship("Conjunction", back_populates="analyses")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    conjunction_id = Column(String, ForeignKey("conjunctions.id"), nullable=False)
    severity = Column(String, nullable=False)        # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE")        # ACTIVE, REVIEWED, DISMISSED
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    conjunction = relationship("Conjunction", back_populates="alerts")
