import pytest
from app.calculations.risk_engine import risk_engine
from app.calculations.sgp4_service import sgp4_service

def test_risk_engine_critical_threshold():
    # Miss distance < 0.2km, rel vel 14 km/s, encounter 2 hours
    result = risk_engine.evaluate(
        miss_distance_km=0.15,
        relative_velocity_km_s=14.2,
        time_to_encounter_hours=2.0,
        data_quality="HIGH"
    )
    assert result["risk_level"] == "CRITICAL"
    assert result["risk_score"] >= 80.0
    assert len(result["risk_factors"]) >= 3

def test_risk_engine_low_threshold():
    result = risk_engine.evaluate(
        miss_distance_km=25.0,
        relative_velocity_km_s=3.0,
        time_to_encounter_hours=60.0,
        data_quality="HIGH"
    )
    assert result["risk_level"] == "LOW"
    assert result["risk_score"] < 35.0

def test_sgp4_tle_parsing_and_parameters():
    line1 = "1 25544U 98067A   24080.52841435  .00014856  00000+0  26815-3 0  9997"
    line2 = "2 25544  51.6416 290.4132 0004578  40.1254 320.0125 15.49842512444583"
    params = sgp4_service.extract_orbital_parameters_from_tle(line1, line2)
    assert params["orbit_type"] == "LEO"
    assert 400 < params["altitude_km"] < 450
    assert round(params["inclination_deg"]) == 52
