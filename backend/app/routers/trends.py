from fastapi import APIRouter, HTTPException, Depends
from app.core.database import db
from app.routers.auth import get_current_user
from app.services.trend_analyzer import compute_longitudinal_trend
from app.models.schema import PatientTrendSummary

router = APIRouter(prefix="/trends", tags=["Longitudinal Trends"])

@router.get("/me", response_model=PatientTrendSummary)
def get_my_trend(current_user: dict = Depends(get_current_user)):
    """Compute longitudinal trend strictly for the authenticated user."""
    user_id = current_user["id"]
    user_name = current_user.get("name") or "User"
    screenings = db.get_user_screenings(user_id)
    return compute_longitudinal_trend(user_id, user_name, screenings)

@router.get("/patient/{patient_id}", response_model=PatientTrendSummary)
def get_patient_trend(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Compute longitudinal trend with user ownership check."""
    if current_user["id"] != patient_id and current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: You do not have permission to view another user's trend data."
        )

    # Find patient
    patient_name = "Patient"
    for u in db.data.get("users", []):
        if u["id"] == patient_id:
            patient_name = u.get("name") or "Patient"
            break
            
    screenings = db.get_user_screenings(patient_id)
    return compute_longitudinal_trend(patient_id, patient_name, screenings)
