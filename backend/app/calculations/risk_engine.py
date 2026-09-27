from typing import Dict, Any, List

class DeterministicRiskEngine:
    """
    OrbitShield Risk Index — Prototype
    Deterministic Multi-Factor Scoring (0–100 scale).

    IMPORTANT SCIENTIFIC SCOPE:
    This score is a decision-support heuristic index (OrbitShield Risk Index — Prototype),
    NOT an authoritative covariance-based collision probability (Pc).
    
    Formula components:
    1. Distance Penalty (0 to 55 pts):
       - < 0.2 km: 55 pts (Lethal envelope)
       - 0.2 - 0.5 km: 45 pts
       - 0.5 - 1.0 km: 35 pts
       - 1.0 - 2.5 km: 25 pts
       - 2.5 - 5.0 km: 15 pts
       - > 5.0 km: 2 pts
    
    2. Relative Velocity Penalty (0 to 25 pts):
       - > 12 km/s: 25 pts (Hypervelocity kinetic fragmentation)
       - 8 - 12 km/s: 20 pts
       - 4 - 8 km/s: 14 pts
       - < 4 km/s: 6 pts
    
    3. Time to Encounter Penalty (0 to 20 pts):
       - < 6 hours: 20 pts (Critical urgency)
       - 6 - 12 hours: 15 pts
       - 12 - 24 hours: 10 pts
       - 24 - 48 hours: 5 pts
       - > 48 hours: 2 pts

    Severity:
    0–24:   LOW
    25–49:  MEDIUM
    50–74:  HIGH
    75–100: CRITICAL
    """

    @classmethod
    def evaluate(
        cls,
        miss_distance_km: float,
        relative_velocity_km_s: float,
        time_to_encounter_hours: float,
        data_quality: str = "HIGH"
    ) -> Dict[str, Any]:
        risk_factors: List[str] = []

        # 1. Distance penalty (0 - 55)
        dist_score = 0.0
        if miss_distance_km < 0.2:
            dist_score = 55.0
            risk_factors.append(f"Extremely small miss distance ({miss_distance_km:.2f} km) within lethal encounter radius")
        elif miss_distance_km < 0.5:
            dist_score = 45.0
            risk_factors.append(f"Sub-kilometer conjunction distance ({miss_distance_km:.2f} km)")
        elif miss_distance_km < 1.0:
            dist_score = 35.0
            risk_factors.append(f"Close approach distance under 1 km ({miss_distance_km:.2f} km)")
        elif miss_distance_km < 2.5:
            dist_score = 25.0
            risk_factors.append(f"Conjunction distance within standard screening threshold ({miss_distance_km:.2f} km)")
        elif miss_distance_km < 5.0:
            dist_score = 15.0
            risk_factors.append(f"Moderate distance screening ({miss_distance_km:.2f} km)")
        else:
            dist_score = 2.0
            risk_factors.append(f"Wide miss distance ({miss_distance_km:.2f} km)")

        # 2. Relative velocity penalty (0 - 25)
        vel_score = 0.0
        if relative_velocity_km_s >= 12.0:
            vel_score = 25.0
            risk_factors.append(f"Hypervelocity encounter ({relative_velocity_km_s:.2f} km/s), catastrophic kinetic impact potential")
        elif relative_velocity_km_s >= 8.0:
            vel_score = 20.0
            risk_factors.append(f"High relative velocity ({relative_velocity_km_s:.2f} km/s), energetic fragmentation risk")
        elif relative_velocity_km_s >= 4.0:
            vel_score = 14.0
            risk_factors.append(f"Moderate orbital encounter velocity ({relative_velocity_km_s:.2f} km/s)")
        else:
            vel_score = 6.0
            risk_factors.append(f"Low relative velocity encounter ({relative_velocity_km_s:.2f} km/s)")

        # 3. Urgency penalty (0 - 20)
        time_score = 0.0
        if time_to_encounter_hours <= 6.0:
            time_score = 20.0
            risk_factors.append(f"Immediate time to encounter ({time_to_encounter_hours:.1f} hrs) requiring urgent operational review")
        elif time_to_encounter_hours <= 12.0:
            time_score = 15.0
            risk_factors.append(f"Short response window ({time_to_encounter_hours:.1f} hrs)")
        elif time_to_encounter_hours <= 24.0:
            time_score = 10.0
            risk_factors.append(f"Standard operational planning window ({time_to_encounter_hours:.1f} hrs)")
        elif time_to_encounter_hours <= 48.0:
            time_score = 5.0
            risk_factors.append(f"Ample maneuver planning timeline ({time_to_encounter_hours:.1f} hrs)")
        else:
            time_score = 2.0
            risk_factors.append(f"Extended multi-day monitoring horizon ({time_to_encounter_hours:.1f} hrs)")

        total_score = min(100.0, max(0.0, dist_score + vel_score + time_score))
        
        # Exact prompt thresholds: 0-24 LOW, 25-49 MEDIUM, 50-74 HIGH, 75-100 CRITICAL
        if total_score >= 75.0:
            risk_level = "CRITICAL"
        elif total_score >= 50.0:
            risk_level = "HIGH"
        elif total_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        explanation = (
            f"OrbitShield Risk Index — Prototype: {total_score:.1f}/100 ({risk_level}). "
            f"Evaluated with miss distance of {miss_distance_km:.2f} km, relative velocity of {relative_velocity_km_s:.2f} km/s, "
            f"and time to encounter of {time_to_encounter_hours:.1f} hours ({time_to_encounter_hours*60:.0f} min). "
            f"Data confidence indicator: {data_quality}."
        )

        return {
            "risk_score": round(total_score, 1),
            "risk_index": round(total_score, 1),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "deterministic_explanation": explanation,
            "breakdown": {
                "distance_score": round(dist_score, 1),
                "velocity_score": round(vel_score, 1),
                "urgency_score": round(time_score, 1)
            }
        }

risk_engine = DeterministicRiskEngine()
