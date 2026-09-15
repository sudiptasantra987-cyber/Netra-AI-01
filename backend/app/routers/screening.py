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

@router.post("/analyze", response_model=ScreeningResponse)
async def analyze_image(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    bypass_quality_check: bool = Form(False),
    current_user: dict = Depends(get_current_user)
):
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

    # Determine account ownership:
    # Doctors and Admins can record scans for a designated patient_id.
    # Patients are strictly locked to their own authenticated user ID to prevent data leakage.
    user_role = current_user.get("role", "patient")
    if user_role in ["doctor", "admin"] and patient_id and patient_id.strip():
        effective_patient_id = patient_id.strip()
        effective_patient_name = (patient_name or "").strip() or "Patient"
    else:
        effective_patient_id = current_user["id"]
        effective_patient_name = current_user.get("name") or "User"

    # Step 6: Persist Record
    record = {
        "screening_id": screening_id,
        "patient_id": effective_patient_id,
        "patient_name": effective_patient_name,
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

@router.get("/history")
def get_my_screening_history(current_user: dict = Depends(get_current_user)):
    """Return all scans strictly belonging to the authenticated user, newest first."""
    return db.get_user_screenings(current_user["id"])

@router.get("/history/{patient_id}")
def get_patient_history(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Return scans for a specific patient with ownership enforcement."""
    if current_user["id"] != patient_id and current_user.get("role") not in ["doctor", "admin"]:
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
