from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List
import uuid
import datetime
import cv2
import numpy as np
import base64
from pathlib import Path
from app.core.config import settings, UPLOADS_DIR, SAMPLE_IMAGES_DIR
from app.core.database import db
from app.routers.auth import get_current_user
from app.services.quality_assessment import assess_image_quality
from app.services.image_preprocessing import preprocess_retinal_image
from app.services.ai_model import analyze_retinal_features
from app.services.gradcam import generate_explainable_gradcam
from app.models.schema import QualityMetrics, ScreeningResponse

router = APIRouter(prefix="/screening", tags=["AI Screening"])

@router.post("/quality-check", response_model=QualityMetrics)
async def check_quality(file: UploadFile = File(...)):
    contents = await file.read()
    metrics = assess_image_quality(contents)
    return metrics

@router.post("/request")
async def create_screening_request(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Allow authenticated patient to submit a screening request with an uploaded fundus image.
    Performs optical image quality check, initializes status to 'Awaiting Review' (or 'Image Requires Recapture'),
    and queues it for tele-ophthalmology review by authorized doctors.
    """
    if file:
        image_bytes = await file.read()
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        save_path = UPLOADS_DIR / filename
        with open(save_path, "wb") as f:
            f.write(image_bytes)
        image_url = f"/uploads/{filename}"
    elif sample_key:
        sample_path = SAMPLE_IMAGES_DIR / sample_key
        if not sample_path.exists():
            raise HTTPException(status_code=404, detail="Sample image not found")
        with open(sample_path, "rb") as f:
            image_bytes = f.read()
        image_url = f"/sample_images/{sample_key}"
    else:
        raise HTTPException(status_code=400, detail="Must upload an eye image or select a sample image")

    # Step 1: Quality Check
    quality = assess_image_quality(image_bytes)
    is_gradable = quality.is_suitable

    # Determine initial status
    initial_status = "Awaiting Review" if is_gradable else "Image Requires Recapture"
    initial_review_status = "pending" if is_gradable else "recapture_required"

    # Step 2: Preprocessing & AI Model Analysis if gradable
    primary_cond = "Awaiting Doctor Evaluation"
    primary_conf = 0.0
    predictions = []
    risk_level = "Evaluation Pending"
    risk_score = 0.0
    recommendation = "Image queued for specialist clinical review."
    gradcam_base64 = None
    affected_quadrants = []

    if is_gradable:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is not None:
            try:
                preprocess_res = preprocess_retinal_image(img_bgr)
                p_cond, p_conf, p_preds, r_level, r_score, r_rec = analyze_retinal_features(img_bgr)
                primary_cond = p_cond
                primary_conf = p_conf
                predictions = p_preds
                risk_level = r_level
                risk_score = r_score
                recommendation = r_rec
                gradcam_res = generate_explainable_gradcam(img_bgr, p_cond, p_conf)
                gradcam_base64 = gradcam_res.get("gradcam_blended_base64")
                affected_quadrants = gradcam_res.get("affected_quadrants", [])
            except Exception as e:
                print(f"AI analysis during request creation warning: {e}")

    screening_id = f"scr-{uuid.uuid4().hex[:8]}"
    now_ts = datetime.datetime.now().isoformat()
    patient_id = current_user["id"]
    patient_name = current_user.get("name") or "Patient"

    record = {
        "screening_id": screening_id,
        "patient_id": patient_id,
        "patient_name": patient_name,
        "patient_notes": (notes or "").strip(),
        "doctor_id": None,
        "doctor_name": None,
        "assigned_doctor_id": None,
        "timestamp": now_ts,
        "date": now_ts.split("T")[0],
        "image_url": image_url,
        "quality": quality.dict(),
        "is_gradable": is_gradable,
        "status": initial_status,
        "review_status": initial_review_status,
        "primary_condition": primary_cond,
        "primary_confidence": primary_conf,
        "all_predictions": [p.dict() if hasattr(p, 'dict') else p for p in predictions],
        "risk_level": risk_level,
        "risk_score": risk_score,
        "clinical_recommendation": recommendation,
        "gradcam_image_base64": gradcam_base64,
        "affected_quadrants": affected_quadrants,
        "clinical_notes": None,
        "diagnosis_confirmed": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "model_version": "Netra-EfficientNet-v1.4-XAI"
    }

    db.data["screenings"].append(record)
    db.save()

    return {
        "success": True,
        "screening_id": screening_id,
        "patient_id": patient_id,
        "status": initial_status,
        "review_status": initial_review_status,
        "quality": quality.dict(),
        "is_gradable": is_gradable,
        "message": "Screening request submitted successfully and queued for clinical review." if is_gradable else "Image quality is insufficient for reliable grading. Please recapture."
    }

@router.get("/my-requests")
def get_my_screening_requests(current_user: dict = Depends(get_current_user)):
    """Return all screening requests submitted by the authenticated patient."""
    patient_id = current_user["id"]
    patient_scans = [s for s in db.data.get("screenings", []) if s.get("patient_id") == patient_id]
    return sorted(patient_scans, key=lambda s: s.get("timestamp", ""), reverse=True)

@router.post("/analyze", response_model=ScreeningResponse)
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    bypass_quality_check: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role", "patient")

    # 1. Enforce Role: Patients cannot perform self-screenings
    if user_role == "patient":
        raise HTTPException(
            status_code=403,
            detail="Patient self-screening is disabled. Retinal screening must be performed by an authorized clinical doctor or participating rural screening centre."
        )

    # 2. Enforce Doctor Verification Status
    if user_role == "doctor":
        verif_status = current_user.get("verification_status", "pending")
        if verif_status != "verified":
            raise HTTPException(
                status_code=403,
                detail=f"Doctor verification required. Current status: '{verif_status}'. You cannot perform retinal screening until verified by Netra AI Administration."
            )
        if not patient_id or not patient_id.strip():
            raise HTTPException(
                status_code=400,
                detail="Patient selection is required. Please select an authorized patient or enroll a new walk-in patient before performing retinal screening."
            )
        clean_pid = patient_id.strip()
        target_user = db.get_user(clean_pid)
        target_profile = db.get_profile(clean_pid)
        if not target_user and not target_profile:
            raise HTTPException(
                status_code=404,
                detail=f"Patient with ID '{clean_pid}' was not found in registered records."
            )
        effective_patient_id = clean_pid
        effective_patient_name = (
            (target_profile.get("full_name") if target_profile else None) or
            (target_user.get("name") if target_user else None) or
            (patient_name or "").strip() or
            "Patient"
        )
    elif user_role == "admin":
        clean_pid = (patient_id or "").strip()
        if clean_pid:
            target_user = db.get_user(clean_pid)
            target_profile = db.get_profile(clean_pid)
            effective_patient_id = clean_pid
            effective_patient_name = (
                (target_profile.get("full_name") if target_profile else None) or
                (target_user.get("name") if target_user else None) or
                (patient_name or "").strip() or
                "Patient"
            )
        else:
            effective_patient_id = "pat-01"
            effective_patient_name = "Admin Screening Test"
    else:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized role. Only verified doctors and administrators can perform retinal screenings."
        )

    if file:
        image_bytes = await file.read()
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        save_path = UPLOADS_DIR / filename
        with open(save_path, "wb") as f:
            f.write(image_bytes)
        image_url = f"/uploads/{filename}"
    elif sample_key:
        sample_path = SAMPLE_IMAGES_DIR / sample_key
        if not sample_path.exists():
            raise HTTPException(status_code=404, detail="Sample image not found")
        with open(sample_path, "rb") as f:
            image_bytes = f.read()
        image_url = f"/sample_images/{sample_key}"
    else:
        raise HTTPException(status_code=400, detail="Must upload an eye image or select a sample image")

    # Step 1: Quality Check
    quality = assess_image_quality(image_bytes)
    if not quality.is_suitable and not bypass_quality_check:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Image quality is insufficient for reliable AI analysis.",
                "quality": quality.dict()
            }
        )

    # Step 2: Decode into OpenCV matrix
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image content")

    # Step 3: Preprocessing (CLAHE, bilateral filter, green-channel)
    preprocess_res = preprocess_retinal_image(img_bgr)

    # Step 4: AI Model Feature Extraction & Multi-disease Prediction
    primary_cond, primary_conf, predictions, risk_level, risk_score, recommendation = analyze_retinal_features(img_bgr)

    # Step 5: Explainable AI - Grad-CAM Attention Heatmap
    gradcam_res = generate_explainable_gradcam(img_bgr, primary_cond, primary_conf)

    screening_id = f"scr-{uuid.uuid4().hex[:8]}"
    now_ts = datetime.datetime.now().isoformat()

    # Step 6: Persist Record linking patient and doctor
    record = {
        "screening_id": screening_id,
        "patient_id": effective_patient_id,
        "patient_name": effective_patient_name,
        "doctor_id": current_user["id"],
        "doctor_name": current_user.get("name") or "Authorized Doctor",
        "doctor_clinic": current_user.get("hospital") or current_user.get("clinic_name") or "Netra AI Rural Vision Centre",
        "timestamp": now_ts,
        "date": now_ts.split("T")[0],
        "image_url": image_url,
        "quality": quality.dict(),
        "primary_condition": primary_cond,
        "primary_confidence": primary_conf,
        "all_predictions": [p.dict() for p in predictions],
        "risk_level": risk_level,
        "risk_score": risk_score,
        "clinical_recommendation": recommendation,
        "gradcam_image_base64": gradcam_res["gradcam_blended_base64"],
        "affected_quadrants": gradcam_res["affected_quadrants"],
        "review_status": "pending",
        "model_version": "Netra-EfficientNet-v1.4-XAI"
    }

    try:
        db.data["screenings"].append(record)
        db.save()
    except Exception as e:
        if record in db.data.get("screenings", []):
            db.data["screenings"].remove(record)
        raise HTTPException(
            status_code=500,
            detail=f"Database persistence failure: Scan could not be saved to your account. {str(e)}"
        )

    return ScreeningResponse(
        screening_id=screening_id,
        patient_id=effective_patient_id,
        timestamp=now_ts,
        image_url=image_url,
        quality=quality,
        primary_condition=primary_cond,
        primary_confidence=primary_conf,
        all_predictions=predictions,
        risk_level=risk_level,
        risk_score=risk_score,
        clinical_recommendation=recommendation,
        gradcam_image_base64=gradcam_res["gradcam_blended_base64"],
        affected_quadrants=gradcam_res["affected_quadrants"],
        model_version="Netra-EfficientNet-v1.4-XAI"
    )

@router.get("/report/{screening_id}")
def get_single_report(screening_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve full screening report for patient or doctor with strict isolation."""
    report = db.get_screening(screening_id)
    if not report:
        raise HTTPException(status_code=404, detail="Screening report not found.")

    user_role = current_user.get("role", "patient")
    user_id = current_user["id"]

    # Strict isolation: patients can only access their own reports
    if user_role == "patient" and report.get("patient_id") != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You do not have permission to view another patient's medical screening report."
        )

    return report

@router.get("/history")
def get_my_screening_history(current_user: dict = Depends(get_current_user)):
    """Return all scans strictly belonging to the authenticated user/patient or doctor."""
    user_role = current_user.get("role", "patient")
    if user_role == "patient":
        return db.get_user_screenings(current_user["id"])
    elif user_role == "doctor":
        scans = [s for s in db.data.get("screenings", []) if s.get("doctor_id") == current_user["id"] or s.get("assigned_doctor_id") == current_user["id"]]
        return sorted(scans, key=lambda s: s.get("timestamp", ""), reverse=True)
    else:
        return sorted(db.data.get("screenings", []), key=lambda s: s.get("timestamp", ""), reverse=True)

@router.get("/history/{patient_id}")
def get_patient_history(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Return scans for a specific patient with ownership enforcement."""
    if current_user.get("role") == "patient" and current_user["id"] != patient_id:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: You do not have permission to view another user's scan history."
        )
    return db.get_user_screenings(patient_id)

@router.delete("/{screening_id}")
def delete_screening(screening_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a screening record. Only the owner or an admin can delete."""
    try:
        is_admin = current_user.get("role") == "admin"
        deleted = db.delete_screening(screening_id, current_user["id"], is_admin=is_admin)
        if not deleted:
            raise HTTPException(status_code=404, detail="Screening record not found.")
        return {"success": True, "message": "Screening record deleted successfully."}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete screening record: {str(e)}")

@router.get("/samples")
def list_sample_images():
    samples = [
        {
            "key": "normal_retina.jpg",
            "name": "Healthy Normal Retina",
            "category": "Normal",
            "description": "Crisp optic disc margins, normal cup-to-disc ratio, clean macula."
        },
        {
            "key": "diabetic_retinopathy.jpg",
            "name": "Diabetic Retinopathy (Exudates)",
            "category": "Diabetic Retinopathy",
            "description": "Hard exudates and microvascular microaneurysms in posterior pole."
        },
        {
            "key": "glaucoma_fundus.jpg",
            "name": "Glaucoma (Deep Optic Cupping)",
            "category": "Glaucoma",
            "description": "Enlarged optic cup-to-disc ratio (>0.7) with neuroretinal rim loss."
        },
        {
            "key": "cataract_eye.jpg",
            "name": "Immature Senile Cataract",
            "category": "Cataract",
            "description": "Anterior crystalline lens opacification and diffuse scattering."
        },
        {
            "key": "blurry_sample.jpg",
            "name": "Blurry Low-Quality Capture",
            "category": "Poor Quality (Test Rejection)",
            "description": "Severely out-of-focus camera test image to verify rejection guardrail."
        }
    ]
    return samples
