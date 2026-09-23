from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from app.core.database import db
from app.routers.auth import get_current_user
from app.services.matlab_bridge import get_research_validation_metrics
from app.services.doctor_recommender import DOCTORS_DATABASE
from app.models.schema import (
    AdminDashboardStats,
    AdminPatientItem,
    AdminDoctorItem,
    AdminDoctorVerifyRequest,
    AccountStatusUpdateRequest,
    AdminScreeningItem,
    AdminSystemHealth,
    AdminAuditLogItem,
    AdminProfileUpdate,
    AdminPasswordChangeRequest,
    AdminNotificationItem
)

router = APIRouter(prefix="/admin", tags=["Admin Portal & System Governance"])

def verify_admin_role(current_user: dict = Depends(get_current_user)) -> dict:
    """Enforce strict role-based access control for administrative endpoints.
    Access is restricted exclusively to authorized administrator santrasudipta70@gmail.com.
    """
    if current_user.get("role") != "admin" or current_user.get("email") != "santrasudipta70@gmail.com":
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Admin Portal access is restricted exclusively to santrasudipta70@gmail.com."
        )
    return current_user


# 1. Admin Dashboard Statistics
@router.get("/dashboard-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(admin: dict = Depends(verify_admin_role)):
    return db.get_admin_dashboard_stats()


# 2. Patient Management
@router.get("/patients", response_model=List[AdminPatientItem])
def get_admin_patients(
    q: Optional[str] = Query(None, description="Search query for name, ID, email, or phone"),
    admin: dict = Depends(verify_admin_role)
):
    return db.get_admin_patients(query=q or "")

@router.patch("/patients/{patient_id}/status")
def update_patient_status(
    patient_id: str,
    req: AccountStatusUpdateRequest,
    admin: dict = Depends(verify_admin_role)
):
    if req.status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'.")
    user = db.set_user_status(patient_id, req.status, admin["id"], admin.get("name") or "Admin")
    if not user:
        raise HTTPException(status_code=404, detail="Patient account not found.")
    return {"success": True, "message": f"Patient status updated to {req.status}."}


# 3. Doctor Management
@router.get("/doctors", response_model=List[AdminDoctorItem])
def get_admin_doctors(
    q: Optional[str] = Query(None, description="Search query for name, email, reg number, or phone"),
    admin: dict = Depends(verify_admin_role)
):
    return db.get_admin_doctors(query=q or "")

@router.patch("/doctors/{doctor_id}/verify")
def verify_doctor(
    doctor_id: str,
    req: AdminDoctorVerifyRequest,
    admin: dict = Depends(verify_admin_role)
):
    target_status = req.get_status()
    if target_status not in ["verified", "rejected", "revoked", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid verification status. Must be 'verified', 'rejected', or 'revoked'.")
    user = db.verify_doctor(doctor_id, target_status, req.get_notes(), admin["id"], admin.get("name") or "Admin")
    if not user:
        raise HTTPException(status_code=404, detail="Doctor account not found.")
    return {
        "success": True,
        "message": f"Doctor credentials marked as {target_status}.",
        "doctor": user
    }

@router.patch("/doctors/{doctor_id}/status")
def update_doctor_status(
    doctor_id: str,
    req: AccountStatusUpdateRequest,
    admin: dict = Depends(verify_admin_role)
):
    if req.status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'.")
    user = db.set_user_status(doctor_id, req.status, admin["id"], admin.get("name") or "Admin")
    if not user:
        raise HTTPException(status_code=404, detail="Doctor account not found.")
    return {"success": True, "message": f"Doctor status updated to {req.status}."}


# 4. Screening Reports (Technical Oversight - Read-only clinical data)
@router.get("/screenings", response_model=List[AdminScreeningItem])
def get_admin_screenings(
    q: Optional[str] = Query(None, description="Search by screening ID, patient, doctor, or condition"),
    status: Optional[str] = Query(None, description="Filter by status ('all', 'pending', 'reviewed', 'recapture_required', 'referred', 'ungradable')"),
    admin: dict = Depends(verify_admin_role)
):
    return db.get_admin_screenings(query=q or "", status_filter=status or "")

@router.get("/screenings/{screening_id}")
def get_admin_screening_detail(
    screening_id: str,
    admin: dict = Depends(verify_admin_role)
):
    screening = db.get_admin_screening_detail(screening_id, admin["id"], admin.get("name") or "Admin")
    if not screening:
        raise HTTPException(status_code=404, detail="Screening report not found.")
    return screening


# 5. System Monitoring
@router.get("/system-health", response_model=AdminSystemHealth)
def get_system_health(admin: dict = Depends(verify_admin_role)):
    return db.get_system_health()

@router.get("/audit-logs", response_model=List[AdminAuditLogItem])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(verify_admin_role)
):
    return db.get_audit_logs(limit=limit)


# 6. Admin Notifications
@router.get("/notifications", response_model=List[AdminNotificationItem])
def get_admin_notifications(admin: dict = Depends(verify_admin_role)):
    return db.get_admin_notifications()


# 7. Admin Profile & Password
@router.get("/profile")
def get_admin_profile(admin: dict = Depends(verify_admin_role)):
    user = db.find_user_by_identifier(admin["id"]) or admin
    return {
        "id": user["id"],
        "name": user.get("name", "Administrator"),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "city": user.get("city", ""),
        "role": "admin",
        "created_at": user.get("created_at", "2026-06-01T10:00:00")
    }

@router.put("/profile")
def update_admin_profile(
    req: AdminProfileUpdate,
    admin: dict = Depends(verify_admin_role)
):
    updated = db.update_admin_profile(admin["id"], req.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Admin account not found.")
    return {"success": True, "message": "Admin profile updated successfully."}

@router.post("/change-password")
def change_admin_password(
    req: AdminPasswordChangeRequest,
    admin: dict = Depends(verify_admin_role)
):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirmation do not match.")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
    success = db.change_admin_password(admin["id"], req.current_password, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    return {"success": True, "message": "Password changed successfully."}


# 8. Backward Compatibility Endpoints
@router.get("/system-stats")
def get_system_stats() -> Dict[str, Any]:
    total_screenings = len(db.data.get("screenings", []))
    high_risk_screenings = sum(1 for s in db.data.get("screenings", []) if s.get("risk_level") == "High Risk")
    moderate_risk_screenings = sum(1 for s in db.data.get("screenings", []) if s.get("risk_level") == "Moderate Risk")
    low_risk_screenings = sum(1 for s in db.data.get("screenings", []) if s.get("risk_level") == "Low Risk")
    
    total_patients = sum(1 for u in db.data.get("users", []) if u.get("role") == "patient")
    total_appointments = len(db.data.get("appointments", []))
    confirmed_appointments = sum(1 for a in db.data.get("appointments", []) if a.get("status") == "Confirmed")
    
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

