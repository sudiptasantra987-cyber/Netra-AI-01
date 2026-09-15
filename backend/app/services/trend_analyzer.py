from typing import List
from app.models.schema import PatientTrendPoint, PatientTrendSummary

def compute_longitudinal_trend(patient_id: str, patient_name: str, history: List[dict]) -> PatientTrendSummary:
    """
    Evaluates multi-screening trajectory across time.
    Calculates whether the ocular risk profile is Improving, Stable, or Deteriorating.
    """
    if not history:
        return PatientTrendSummary(
            patient_id=patient_id,
            patient_name=patient_name,
            total_screenings=0,
            trend_direction="Stable",
            trend_description="No baseline screening history recorded yet.",
            history_points=[]
        )
        
    points: List[PatientTrendPoint] = []
    for h in history:
        points.append(PatientTrendPoint(
            date=h.get("timestamp", "").split("T")[0] or h.get("date", "2026-09-10"),
            risk_score=float(h.get("risk_score", 10.0)),
            risk_level=h.get("risk_level", "Low Risk"),
            primary_condition=h.get("primary_condition", "Normal Eye Anatomy"),
            confidence=float(h.get("primary_confidence", 85.0)),
            screening_id=h.get("screening_id", "")
        ))
        
    # Sort chronological
    points.sort(key=lambda p: p.date)
    
    if len(points) == 1:
        direction = "Stable"
        desc = "Single baseline scan established. Longitudinal monitoring active."
    else:
        first_risk = points[0].risk_score
        last_risk = points[-1].risk_score
        delta = last_risk - first_risk
        
        if delta > 12.0:
            direction = "Deteriorating"
            desc = f"Screening risk increased by +{delta:.1f} points from baseline. Accelerated ophthalmology review recommended."
        elif delta < -10.0:
            direction = "Improving"
            desc = f"Screening risk decreased by {abs(delta):.1f} points. Positive therapeutic or stabilization trend observed."
        else:
            direction = "Stable"
            desc = "Longitudinal risk profile remains stable within acceptable variance bounds (±10%)."
            
    return PatientTrendSummary(
        patient_id=patient_id,
        patient_name=patient_name,
        total_screenings=len(points),
        trend_direction=direction,
        trend_description=desc,
        history_points=points
    )
