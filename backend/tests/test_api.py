import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "OrbitShield" in data["service"]

def test_system_status():
    res = client.get("/api/system/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["Operational", "Degraded"]
    assert "services" in data
    assert len(data["services"]) >= 4

def test_auth_login():
    res = client.post("/api/auth/login", json={"email": "demo@orbitshield.space", "password": "orbitshield2026"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@orbitshield.space"

def test_monitored_satellites_and_registration():
    # Fetch monitored satellites (should return seeded ISS default)
    res = client.get("/api/monitored-satellites")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(s["norad_id"] == "25544" for s in data)

    # Register Tiangong CSS as monitored
    reg_res = client.post("/api/objects/register", json={
        "norad_id": "48274",
        "name": "TIANGONG (CSS)",
        "custom_label": "Space Station Tiangong"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["norad_id"] == "48274"
    assert reg_data["custom_label"] == "Space Station Tiangong"

    # Confirm it now shows up in monitored satellites list
    list_res = client.get("/api/monitored-satellites")
    assert list_res.status_code == 200
    assert any(s["norad_id"] == "48274" for s in list_res.json())

def test_conjunction_analyze():
    # Analyze with target_norad_id and candidate
    res = client.post("/api/conjunction/analyze", json={
        "target_norad_id": "25544",
        "secondary_object_id": "49863",
        "time_window_hours": 24
    })
    assert res.status_code == 200
    data = res.json()
    assert data["primary_object"]["norad_id"] == "25544"
    assert data["secondary_object"]["norad_id"] == "49863"
    assert "risk_score" in data
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "deterministic_explanation" in data
    assert "time_to_encounter_min" in data
    assert data["alert_created"] is True
    assert data["alert_id"] is not None

    # Verify that the Timely Alert is immediately accessible from /api/alerts
    alert_res = client.get("/api/alerts")
    assert alert_res.status_code == 200
    alerts = alert_res.json()
    assert len(alerts) >= 1
    assert any(a["conjunction_id"] == data["conjunction_id"] for a in alerts)
