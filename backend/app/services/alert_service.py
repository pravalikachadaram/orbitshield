from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Alert, Conjunction, SpaceObject

class AlertService:
    @staticmethod
    def get_alerts(db: Session, status: Optional[str] = None, severity: Optional[str] = None) -> List[dict]:
        query = db.query(Alert, Conjunction).join(Conjunction, Alert.conjunction_id == Conjunction.id)
        
        if status and status.upper() != "ALL":
            query = query.filter(Alert.status == status.upper())
        if severity and severity.upper() != "ALL":
            query = query.filter(Alert.severity == severity.upper())

        alerts_list = []
        for alert, conj in query.order_by(Alert.created_at.desc()).all():
            obj_a = db.query(SpaceObject).filter(SpaceObject.norad_id == conj.primary_object_id).first()
            obj_b = db.query(SpaceObject).filter(SpaceObject.norad_id == conj.secondary_object_id).first()
            
            alerts_list.append({
                "id": alert.id,
                "conjunction_id": conj.id,
                "severity": alert.severity,
                "title": alert.title,
                "message": alert.message,
                "status": alert.status,
                "created_at": alert.created_at,
                "primary_object_name": obj_a.name if obj_a else conj.primary_object_id,
                "primary_object_norad": conj.primary_object_id,
                "secondary_object_name": obj_b.name if obj_b else conj.secondary_object_id,
                "secondary_object_norad": conj.secondary_object_id,
                "closest_approach_km": conj.closest_approach_km,
                "risk_score": conj.risk_score
            })
        return alerts_list

    @staticmethod
    def mark_reviewed(db: Session, alert_id: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = "REVIEWED"
            db.commit()
            db.refresh(alert)
        return alert

alert_service = AlertService()
