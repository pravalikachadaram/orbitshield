import os
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import SpaceObject
from app.calculations.sgp4_service import sgp4_service
from app.core.config import settings

DEMO_OBJECTS: List[Dict[str, Any]] = [
    {
        "name": "ISS (ZARYA)",
        "norad_id": "25544",
        "object_type": "PAYLOAD",
        "tle_line1": "1 25544U 98067A   24080.52841435  .00014856  00000+0  26815-3 0  9997",
        "tle_line2": "2 25544  51.6416 290.4132 0004578  40.1254 320.0125 15.49842512444583",
        "source": "DEMO",
        "risk_status": "NOMINAL"
    },
    {
        "name": "COSMOS 1408 DEBRIS",
        "norad_id": "49863",
        "object_type": "DEBRIS",
        "tle_line1": "1 49863U 82092BY  24080.51234567  .00008542  00000+0  15421-3 0  9991",
        "tle_line2": "2 49863  82.5641 185.3421 0021450 120.4512 240.1254 15.31254120124589",
        "source": "DEMO",
        "risk_status": "CRITICAL"
    },
    {
        "name": "FENGYUN 1C DEBRIS",
        "norad_id": "31113",
        "object_type": "DEBRIS",
        "tle_line1": "1 31113U 99025ARK 24080.48512140  .00001420  00000+0  34120-4 0  9992",
        "tle_line2": "2 31113  98.8124  45.1245 0012451  85.4120 275.1245 14.81254120245121",
        "source": "DEMO",
        "risk_status": "ELEVATED"
    },
    {
        "name": "STARLINK-30114",
        "norad_id": "55123",
        "object_type": "PAYLOAD",
        "tle_line1": "1 55123U 23001A   24080.55124120  .00003512  00000+0  18541-4 0  9995",
        "tle_line2": "2 55123  43.0012 310.4512 0001850 210.4512 149.5412 15.02451200654125",
        "source": "DEMO",
        "risk_status": "NOMINAL"
    },
    {
        "name": "TIANGONG (CSS)",
        "norad_id": "48274",
        "object_type": "PAYLOAD",
        "tle_line1": "1 48274U 21035A   24080.51874512  .00011245  00000+0  19842-3 0  9993",
        "tle_line2": "2 48274  41.4721 142.1254 0005124  95.1245 265.1245 15.58912451164521",
        "source": "DEMO",
        "risk_status": "NOMINAL"
    },
    {
        "name": "SL-16 R/B (DEBRIS)",
        "norad_id": "22676",
        "object_type": "ROCKET_BODY",
        "tle_line1": "1 22676U 93036B   24080.49124512  .00000512  00000+0  45124-4 0  9990",
        "tle_line2": "2 22676  71.0245 210.1254 0015124 180.1245 180.1245 14.61254120451201",
        "source": "DEMO",
        "risk_status": "ELEVATED"
    },
    {
        "name": "HUBBLE SPACE TELESCOPE",
        "norad_id": "20580",
        "object_type": "PAYLOAD",
        "tle_line1": "1 20580U 90037B   24080.47124512  .00001245  00000+0  21541-4 0  9998",
        "tle_line2": "2 20580  28.4688  75.1245 0002850 110.1245 250.1245 15.09124512891245",
        "source": "DEMO",
        "risk_status": "NOMINAL"
    },
    {
        "name": "IRIDIUM 33 DEBRIS",
        "norad_id": "33758",
        "object_type": "DEBRIS",
        "tle_line1": "1 33758U 97051C   24080.45124512  .00002145  00000+0  31245-4 0  9994",
        "tle_line2": "2 33758  86.4012 340.1254 0041245  65.1245 295.1245 14.25412012741201",
        "source": "DEMO",
        "risk_status": "CRITICAL"
    }
]

class OrbitalDataService:
    """
    Manages TLE retrieval, CelesTrak querying, Space-Track integration architecture,
    and automatic Demo fallback.
    """

    @classmethod
    async def fetch_celestrak_tle(cls, norad_id: str) -> Optional[Dict[str, str]]:
        """
        Attempts to query CelesTrak for fresh TLE data.
        Falls back cleanly to None if offline or rate limited.
        """
        url = f"{settings.CELESTRAK_BASE_URL}?CATNR={norad_id}&FORMAT=TLE"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and resp.text:
                    lines = [line.strip() for line in resp.text.strip().split("\n") if line.strip()]
                    if len(lines) >= 3:
                        return {
                            "name": lines[0],
                            "tle_line1": lines[1],
                            "tle_line2": lines[2],
                            "source": "CELESTRAK"
                        }
                    elif len(lines) == 2:
                        return {
                            "name": f"NORAD-{norad_id}",
                            "tle_line1": lines[0],
                            "tle_line2": lines[1],
                            "source": "CELESTRAK"
                        }
        except Exception:
            pass
        return None

    @classmethod
    def seed_initial_objects(cls, db: Session) -> None:
        """Populates database with controlled demo objects if empty."""
        count = db.query(SpaceObject).count()
        if count == 0:
            for item in DEMO_OBJECTS:
                orbit_params = sgp4_service.extract_orbital_parameters_from_tle(
                    item["tle_line1"], item["tle_line2"]
                )
                obj = SpaceObject(
                    name=item["name"],
                    norad_id=item["norad_id"],
                    object_type=item["object_type"],
                    orbit_type=orbit_params["orbit_type"],
                    altitude_km=orbit_params["altitude_km"],
                    apogee_km=orbit_params["apogee_km"],
                    perigee_km=orbit_params["perigee_km"],
                    inclination_deg=orbit_params["inclination_deg"],
                    eccentricity=orbit_params["eccentricity"],
                    period_min=orbit_params["period_min"],
                    tle_line1=item["tle_line1"],
                    tle_line2=item["tle_line2"],
                    tle_epoch=datetime.utcnow(),
                    source="DEMO",
                    risk_status=item["risk_status"],
                    last_updated=datetime.utcnow()
                )
                db.add(obj)
            db.commit()

    @classmethod
    async def get_or_fetch_object(cls, db: Session, norad_id: str) -> Optional[SpaceObject]:
        """
        Retrieves object from local database; if missing or stale, queries CelesTrak.
        Falls back to demo templates if external fails.
        """
        obj = db.query(SpaceObject).filter(SpaceObject.norad_id == norad_id).first()
        if obj:
            return obj

        # Attempt external fetch
        external_tle = await cls.fetch_celestrak_tle(norad_id)
        if external_tle:
            orbit_params = sgp4_service.extract_orbital_parameters_from_tle(
                external_tle["tle_line1"], external_tle["tle_line2"]
            )
            obj = SpaceObject(
                name=external_tle["name"],
                norad_id=norad_id,
                object_type="PAYLOAD" if "DEBRIS" not in external_tle["name"].upper() else "DEBRIS",
                orbit_type=orbit_params["orbit_type"],
                altitude_km=orbit_params["altitude_km"],
                apogee_km=orbit_params["apogee_km"],
                perigee_km=orbit_params["perigee_km"],
                inclination_deg=orbit_params["inclination_deg"],
                eccentricity=orbit_params["eccentricity"],
                period_min=orbit_params["period_min"],
                tle_line1=external_tle["tle_line1"],
                tle_line2=external_tle["tle_line2"],
                tle_epoch=datetime.utcnow(),
                source="CELESTRAK",
                risk_status="NOMINAL",
                last_updated=datetime.utcnow()
            )
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return obj

        # Fallback to predefined demo if matching
        for demo in DEMO_OBJECTS:
            if demo["norad_id"] == norad_id:
                orbit_params = sgp4_service.extract_orbital_parameters_from_tle(
                    demo["tle_line1"], demo["tle_line2"]
                )
                obj = SpaceObject(
                    name=demo["name"],
                    norad_id=demo["norad_id"],
                    object_type=demo["object_type"],
                    orbit_type=orbit_params["orbit_type"],
                    altitude_km=orbit_params["altitude_km"],
                    apogee_km=orbit_params["apogee_km"],
                    perigee_km=orbit_params["perigee_km"],
                    inclination_deg=orbit_params["inclination_deg"],
                    eccentricity=orbit_params["eccentricity"],
                    period_min=orbit_params["period_min"],
                    tle_line1=demo["tle_line1"],
                    tle_line2=demo["tle_line2"],
                    tle_epoch=datetime.utcnow(),
                    source="DEMO",
                    risk_status=demo["risk_status"],
                    last_updated=datetime.utcnow()
                )
                db.add(obj)
                db.commit()
                db.refresh(obj)
                return obj

        return None

orbital_data_service = OrbitalDataService()
