import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class AIService:
    """
    AI Explanation Layer.
    Only consumes structured calculated telemetry and risk data.
    Never invents orbital calculations.
    Provides deterministic fallback if external AI provider is unavailable.
    """

    @classmethod
    def generate_recommendation_text(cls, risk_level: str, miss_distance_km: float) -> str:
        """Generates conceptual decision-support response recommendation."""
        disclaimer = " (Decision-support recommendation only; not an operational spacecraft command)"
        if risk_level == "CRITICAL":
            return (
                f"CONSIDER MANEUVER PLANNING: Conjunction within lethal collision threshold ({miss_distance_km:.2f} km). "
                f"Recommend immediate ephemeris verification with Space-Track/18th SDS, tasking high-priority ground radar "
                f"tracking, and generating delta-v prograde/radial collision avoidance maneuver options.{disclaimer}"
            )
        elif risk_level == "HIGH":
            return (
                f"PRIORITIZE CONJUNCTION REVIEW: Conjunction geometry exhibits elevated collision probability. "
                f"Verify secondary object covariance matrix, coordinate with owner-operators, and evaluate screening fence margins.{disclaimer}"
            )
        elif risk_level == "MEDIUM":
            return (
                f"REQUEST ADDITIONAL TRACKING: Miss distance warrants enhanced surveillance. "
                f"Schedule follow-up sensor passes to reduce positional uncertainty ellipse prior to maneuver commit epoch.{disclaimer}"
            )
        else:
            return (
                f"MONITOR NOMINAL PASS: Miss distance exceeds primary alert threshold. "
                f"Continue automated routine catalog screening with no immediate maneuver required.{disclaimer}"
            )

    @classmethod
    def generate_deterministic_explanation(
        cls, 
        primary_name: str,
        secondary_name: str,
        risk_score: float,
        risk_level: str,
        miss_distance_km: float,
        relative_velocity_km_s: float,
        time_to_encounter_hours: float,
        factors: list[str]
    ) -> str:
        """Reliable, scientifically accurate deterministic explanation."""
        factors_text = "; ".join(factors) if factors else "Standard orbital screening baseline."
        return (
            f"OrbitShield deterministic conjunction assessment between '{primary_name}' and '{secondary_name}' "
            f"yielded a Risk Index of {risk_score:.1f}/100, categorized as {risk_level}. "
            f"The minimum predicted close approach distance is {miss_distance_km:.2f} km with a relative encounter velocity "
            f"of {relative_velocity_km_s:.2f} km/s occurring in {time_to_encounter_hours:.1f} hours. "
            f"Contributing factors: {factors_text}. "
            f"Due to the relative velocity of {relative_velocity_km_s:.2f} km/s, an impact would deliver hypervelocity kinetic fragmentation."
        )

    @classmethod
    async def get_ai_explanation(
        cls,
        primary_name: str,
        secondary_name: str,
        risk_score: float,
        risk_level: str,
        miss_distance_km: float,
        relative_velocity_km_s: float,
        time_to_encounter_hours: float,
        factors: list[str],
        data_mode: str
    ) -> Dict[str, Any]:
        """
        Calls OpenAI-compatible LLM endpoint if configured; otherwise provides high-fidelity
        deterministic flight-dynamics explanation.
        """
        fallback_text = cls.generate_deterministic_explanation(
            primary_name, secondary_name, risk_score, risk_level,
            miss_distance_km, relative_velocity_km_s, time_to_encounter_hours, factors
        )

        if not settings.AI_API_KEY:
            return {
                "explanation": fallback_text,
                "provider": "deterministic-fallback",
                "status": "Fallback Mode (No API Key configured)"
            }

        prompt = f"""
You are an Aerospace Flight Dynamics and Orbital Conjunction Safety Officer for OrbitShield.
Explain the following calculated conjunction data to mission operators:

Primary Object: {primary_name}
Secondary Object: {secondary_name}
Risk Index: {risk_score}/100 ({risk_level})
Miss Distance: {miss_distance_km:.2f} km
Relative Velocity: {relative_velocity_km_s:.2f} km/s
Time to Encounter: {time_to_encounter_hours:.1f} hours
Identified Risk Factors: {', '.join(factors)}
Data Mode: {data_mode}

Provide a concise, professional technical breakdown answering:
1. Why is this event classified as {risk_level}?
2. What are the orbital dynamic consequences (e.g. kinetic energy / fragmentation risk)?
3. What should the spacecraft operator review in the next pass?

CRITICAL: Do NOT invent orbital numbers. Strictly use the provided numbers. Do not output operational commands.
"""
        try:
            headers = {
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": settings.AI_MODEL,
                "messages": [
                    {"role": "system", "content": "You are OrbitShield's aerospace conjunction safety specialist. Provide concise technical mission analysis."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 400
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    f"{settings.AI_API_BASE}/chat/completions",
                    headers=headers,
                    json=payload
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    return {
                        "explanation": content,
                        "provider": "ai-live",
                        "status": "Operational"
                    }
        except Exception:
            pass

        return {
            "explanation": fallback_text,
            "provider": "deterministic-fallback",
            "status": "Fallback Mode (API Error or Offline)"
        }

ai_service = AIService()
