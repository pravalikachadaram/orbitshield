from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Conjunction, Analysis, SpaceObject

class HistoryService:
    @staticmethod
    def get_history(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        conjunctions = db.query(Conjunction).order_by(Conjunction.created_at.desc()).limit(limit).all()
        history = []
        for c in conjunctions:
            p = db.query(SpaceObject).filter(SpaceObject.norad_id == c.primary_object_id).first()
            s = db.query(SpaceObject).filter(SpaceObject.norad_id == c.secondary_object_id).first()
            
            history.append({
                "id": c.id,
                "conjunction_id": c.id,
                "primary_object_name": p.name if p else c.primary_object_id,
                "primary_object_norad": c.primary_object_id,
                "secondary_object_name": s.name if s else c.secondary_object_id,
                "secondary_object_norad": c.secondary_object_id,
                "closest_approach_km": c.closest_approach_km,
                "relative_velocity_km_s": c.relative_velocity_km_s,
                "risk_score": c.risk_score,
                "risk_level": c.risk_level,
                "time_of_closest_approach": c.time_of_closest_approach,
                "data_mode": c.data_mode,
                "created_at": c.created_at
            })
        return history

    @staticmethod
    def get_conjunction_detail(db: Session, conjunction_id: str) -> Optional[Dict[str, Any]]:
        c = db.query(Conjunction).filter(Conjunction.id == conjunction_id).first()
        if not c:
            return None
        
        analysis = db.query(Analysis).filter(Analysis.conjunction_id == c.id).first()
        p = db.query(SpaceObject).filter(SpaceObject.norad_id == c.primary_object_id).first()
        s = db.query(SpaceObject).filter(SpaceObject.norad_id == c.secondary_object_id).first()

        # Calculate time_to_encounter_hours relative to now
        now = c.created_at
        diff_hours = max(0.0, (c.time_of_closest_approach - now).total_seconds() / 3600.0)

        meta = analysis.calculation_metadata if analysis and analysis.calculation_metadata else {}
        risk_factors = analysis.risk_factors if analysis and analysis.risk_factors else []
        ai_exp = analysis.ai_explanation if analysis else "No analysis explanation stored."
        recom = analysis.recommendation if analysis else "MONITOR NOMINAL PASS"

        return {
            "conjunction_id": c.id,
            "primary_object": p,
            "secondary_object": s,
            "closest_approach_km": c.closest_approach_km,
            "relative_velocity_km_s": c.relative_velocity_km_s,
            "time_of_closest_approach": c.time_of_closest_approach,
            "time_to_encounter_hours": round(diff_hours, 2),
            "analysis_window_hours": c.analysis_window_hours,
            "risk_score": c.risk_score,
            "risk_level": c.risk_level,
            "risk_factors": risk_factors,
            "deterministic_explanation": (
                f"Historical conjunction record. Risk Score {c.risk_score}/100 ({c.risk_level}). "
                f"Calculated closest approach {c.closest_approach_km:.2f} km with relative velocity {c.relative_velocity_km_s:.2f} km/s."
            ),
            "ai_explanation": ai_exp,
            "recommendation": recom,
            "data_source": c.data_source,
            "data_mode": c.data_mode,
            "data_quality": meta.get("data_quality", "HIGH" if c.data_mode == "live" else "MEDIUM"),
            "calculation_metadata": meta,
            "created_at": c.created_at,
            "alert_created": c.risk_level in ["HIGH", "CRITICAL"],
            "alert_id": None
        }

history_service = HistoryService()
