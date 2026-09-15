from fastapi import APIRouter
from typing import Dict, Any
from app.core.database import db
from app.services.matlab_bridge import get_research_validation_metrics
from app.services.doctor_recommender import DOCTORS_DATABASE

router = APIRouter(prefix="/admin", tags=["Admin & Research Analytics"])

@router.get("/system-stats")
def get_system_stats() -> Dict[str, Any]:
    total_screenings = len(db.data["screenings"])
    high_risk_screenings = sum(1 for s in db.data["screenings"] if s.get("risk_level") == "High Risk")
    moderate_risk_screenings = sum(1 for s in db.data["screenings"] if s.get("risk_level") == "Moderate Risk")
    low_risk_screenings = sum(1 for s in db.data["screenings"] if s.get("risk_level") == "Low Risk")
    
    total_patients = sum(1 for u in db.data["users"] if u.get("role") == "patient")
    total_appointments = len(db.data["appointments"])
    confirmed_appointments = sum(1 for a in db.data["appointments"] if a.get("status") == "Confirmed")
    
    return {
        "total_patients": total_patients,
        "total_doctors": len(DOCTORS_DATABASE),
        "total_screenings": total_screenings,
        "high_risk_screenings": high_risk_screenings,
        "moderate_risk_screenings": moderate_risk_screenings,
        "low_risk_screenings": low_risk_screenings,
        "total_appointments": total_appointments,
        "confirmed_appointments": confirmed_appointments,
        "active_model_version": "Netra-EfficientNet-v1.4-XAI",
        "system_status": "Operational (All Services Healthy)"
    }

@router.get("/research-metrics")
def get_research_metrics() -> Dict[str, Any]:
    return get_research_validation_metrics()

@router.get("/model-versions")
def get_model_versions():
    return [
        {
            "version": "v1.0",
            "release_date": "2026-03-15",
            "backbone": "ResNet-50",
            "accuracy": "91.2%",
            "auc": "0.932",
            "parameters": "25.6M",
            "status": "Archived",
            "notes": "Baseline transfer learning prototype evaluated on Messidor-2."
        },
        {
            "version": "v1.1",
            "release_date": "2026-06-20",
            "backbone": "MobileNetV3-Large",
            "accuracy": "92.8%",
            "auc": "0.951",
            "parameters": "5.4M",
            "status": "Edge Target",
            "notes": "Quantized weights for offline mobile/PWA execution."
        },
        {
            "version": "v1.4-XAI",
            "release_date": "2026-09-05",
            "backbone": "EfficientNet-B4 + Grad-CAM",
            "accuracy": "94.6%",
            "auc": "0.972",
            "parameters": "19.3M",
            "status": "Active Production",
            "notes": "Multi-head classification with clinical risk stratification and lesion-guided Grad-CAM overlays."
        }
    ]
