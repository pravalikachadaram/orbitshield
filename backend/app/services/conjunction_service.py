from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.models import Conjunction, Analysis, Alert, SpaceObject
from app.calculations.sgp4_service import sgp4_service
from app.calculations.risk_engine import risk_engine
from app.services.ai_service import ai_service

class ConjunctionService:
    """
    Orchestrates the Conjunction Analysis Pipeline:
    1. Propagate target and candidate orbits across requested time window
    2. Sample positions and compute relative Euclidean distance
    3. Identify closest approach epoch (TCA) and miss distance
    4. Compute relative velocity at TCA
    5. Evaluate deterministic OrbitShield Risk Index — Prototype
    6. Generate response recommendations
    7. Generate AI explanation layer (or deterministic fallback)
    8. Persist to DB and trigger Alert if HIGH/CRITICAL
    """

    @classmethod
    def calculate_closest_approach(
        cls,
        sat1_tle1: str,
        sat1_tle2: str,
        sat2_tle1: str,
        sat2_tle2: str,
        window_hours: int,
        start_time: datetime
    ) -> Tuple[float, float, datetime, float]:
        sat1 = sgp4_service.parse_tle(sat1_tle1, sat1_tle2)
        sat2 = sgp4_service.parse_tle(sat2_tle1, sat2_tle2)

        # Stage 1: Coarse screening (3-minute steps)
        step_coarse_sec = 180
        total_seconds = window_hours * 3600
        steps = int(total_seconds / step_coarse_sec)

        min_dist = float("inf")
        best_t_sec = 0.0

        for i in range(steps + 1):
            t_sec = i * step_coarse_sec
            dt = start_time + timedelta(seconds=t_sec)
            try:
                p1, _ = sgp4_service.propagate_to_datetime(sat1, dt)
                p2, _ = sgp4_service.propagate_to_datetime(sat2, dt)
                dist = np.linalg.norm(p1 - p2)
                if dist < min_dist:
                    min_dist = dist
                    best_t_sec = t_sec
            except Exception:
                continue

        # Stage 2: Fine refinement (+/- 3 minutes at 5-second steps)
        refine_start = max(0.0, best_t_sec - 180)
        refine_end = min(float(total_seconds), best_t_sec + 180)
        step_fine = 5

        for t_sec in np.arange(refine_start, refine_end, step_fine):
            dt = start_time + timedelta(seconds=float(t_sec))
            try:
                p1, _ = sgp4_service.propagate_to_datetime(sat1, dt)
                p2, _ = sgp4_service.propagate_to_datetime(sat2, dt)
                dist = np.linalg.norm(p1 - p2)
                if dist < min_dist:
                    min_dist = dist
                    best_t_sec = float(t_sec)
            except Exception:
                continue

        # Evaluate vectors precisely at TCA
        tca_epoch = start_time + timedelta(seconds=best_t_sec)
        p1, v1 = sgp4_service.propagate_to_datetime(sat1, tca_epoch)
        p2, v2 = sgp4_service.propagate_to_datetime(sat2, tca_epoch)
        rel_vel = float(np.linalg.norm(v1 - v2))

        time_to_tca_hours = best_t_sec / 3600.0

        return round(float(min_dist), 3), round(rel_vel, 3), tca_epoch, round(time_to_tca_hours, 2)

    @classmethod
    async def analyze_and_record(
        cls,
        db: Session,
        primary_obj: SpaceObject,
        secondary_obj: SpaceObject,
        window_hours: int
    ) -> Dict[str, Any]:
        start_time = datetime.now(timezone.utc)
        
        # Orbital SGP4 propagation
        miss_dist_km, rel_vel_km_s, tca_dt, time_to_tca_h = cls.calculate_closest_approach(
            primary_obj.tle_line1, primary_obj.tle_line2,
            secondary_obj.tle_line1, secondary_obj.tle_line2,
            window_hours, start_time
        )

        data_mode = "demo" if (primary_obj.source == "DEMO" or secondary_obj.source == "DEMO") else "live"
        data_source = f"{primary_obj.source}/{secondary_obj.source}"
        data_quality = "HIGH" if data_mode == "live" else "MEDIUM"

        # Deterministic Risk Evaluation
        eval_result = risk_engine.evaluate(
            miss_distance_km=miss_dist_km,
            relative_velocity_km_s=rel_vel_km_s,
            time_to_encounter_hours=time_to_tca_h,
            data_quality=data_quality
        )

        recommendation = ai_service.generate_recommendation_text(
            eval_result["risk_level"], miss_dist_km
        )

        # AI explanation
        ai_res = await ai_service.get_ai_explanation(
            primary_name=primary_obj.name,
            secondary_name=secondary_obj.name,
            risk_score=eval_result["risk_score"],
            risk_level=eval_result["risk_level"],
            miss_distance_km=miss_dist_km,
            relative_velocity_km_s=rel_vel_km_s,
            time_to_encounter_hours=time_to_tca_h,
            factors=eval_result["risk_factors"],
            data_mode=data_mode
        )

        time_to_encounter_min = round(time_to_tca_h * 60.0, 1)

        # Persist Conjunction
        conjunction = Conjunction(
            primary_object_id=primary_obj.norad_id,
            secondary_object_id=secondary_obj.norad_id,
            closest_approach_km=miss_dist_km,
            relative_velocity_km_s=rel_vel_km_s,
            time_of_closest_approach=tca_dt,
            time_to_encounter_min=time_to_encounter_min,
            analysis_window_hours=window_hours,
            risk_score=eval_result["risk_score"],
            risk_level=eval_result["risk_level"],
            data_mode=data_mode,
            data_source=data_source
        )
        db.add(conjunction)
        db.flush()

        # Persist Analysis Detail
        analysis = Analysis(
            conjunction_id=conjunction.id,
            risk_factors=eval_result["risk_factors"],
            ai_explanation=ai_res["explanation"],
            recommendation=recommendation,
            calculation_metadata={
                "breakdown": eval_result["breakdown"],
                "ai_provider": ai_res["provider"],
                "ai_status": ai_res["status"],
                "data_quality": data_quality,
                "engine_version": "SGP4-RK4-v1.0"
            }
        )
        db.add(analysis)

        # Create Timely Alert for the conjunction run
        alert_title = f"{eval_result['risk_level']} Conjunction Alert: {primary_obj.name} vs {secondary_obj.name}"
        alert_msg = (
            f"Proximity encounter detected: {miss_dist_km:.2f} km miss distance at {rel_vel_km_s:.2f} km/s. "
            f"TCA encounter in {time_to_encounter_min:.1f} min ({time_to_tca_h:.2f}h). "
            f"OrbitShield Risk Index: {eval_result['risk_score']:.1f}/100 ({eval_result['risk_level']})."
        )
        alert = Alert(
            conjunction_id=conjunction.id,
            severity=eval_result["risk_level"],
            title=alert_title,
            message=alert_msg,
            status="ACTIVE"
        )
        db.add(alert)
        db.flush()
        alert_id = alert.id
        alert_created = True

        db.commit()
        db.refresh(conjunction)

        return {
            "conjunction_id": conjunction.id,
            "target_norad_id": primary_obj.norad_id,
            "object_norad_id": secondary_obj.norad_id,
            "primary_object": primary_obj,
            "secondary_object": secondary_obj,
            "closest_approach_km": miss_dist_km,
            "relative_velocity_km_s": rel_vel_km_s,
            "time_of_closest_approach": tca_dt,
            "time_to_encounter_min": time_to_encounter_min,
            "time_to_encounter_hours": time_to_tca_h,
            "analysis_window_hours": window_hours,
            "risk_score": eval_result["risk_score"],
            "risk_index": eval_result["risk_index"],
            "risk_level": eval_result["risk_level"],
            "risk_factors": eval_result["risk_factors"],
            "deterministic_explanation": eval_result["deterministic_explanation"],
            "ai_explanation": ai_res["explanation"],
            "recommendation": recommendation,
            "data_source": data_source,
            "data_mode": data_mode,
            "data_quality": data_quality,
            "calculation_metadata": analysis.calculation_metadata,
            "created_at": conjunction.created_at,
            "alert_created": alert_created,
            "alert_id": alert_id
        }

conjunction_service = ConjunctionService()
