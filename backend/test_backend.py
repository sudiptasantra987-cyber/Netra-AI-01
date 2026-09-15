import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all():
    print("--- 1. Testing Root Endpoint ---")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("Root OK:", res.json()["platform"])

    print("\n--- 2. Testing Image Quality Check (Blurry Image) ---")
    blurry_path = Path("backend/sample_images/blurry_sample.jpg")
    with open(blurry_path, "rb") as f:
        res = client.post("/api/screening/quality-check", files={"file": ("blurry.jpg", f, "image/jpeg")})
    assert res.status_code == 200
    q = res.json()
    print(f"Blurry Image Quality: score={q['composite_quality']}%, suitable={q['is_suitable']}, status='{q['status_label']}'")
    assert q['is_suitable'] is False, "Blurry image should be marked not suitable!"
    print("Quality check rejection logic: PASSED!")

    print("\n--- 3. Testing Quality Check (Normal Retina) ---")
    normal_path = Path("backend/sample_images/normal_retina.jpg")
    with open(normal_path, "rb") as f:
        res = client.post("/api/screening/quality-check", files={"file": ("normal.jpg", f, "image/jpeg")})
    assert res.status_code == 200
    q_norm = res.json()
    print(f"Normal Retina Quality: score={q_norm['composite_quality']}%, suitable={q_norm['is_suitable']}, status='{q_norm['status_label']}'")
    assert q_norm['is_suitable'] is True, "Normal retina should be suitable!"
    print("Quality check acceptance logic: PASSED!")

    print("\n--- 4. Testing AI Screening & Grad-CAM Analysis ---")
    res = client.post("/api/screening/analyze", data={"sample_key": "diabetic_retinopathy.jpg", "patient_id": "pat-01"})
    assert res.status_code == 200, f"Screening failed: {res.text}"
    data = res.json()
    print(f"Diagnosis: {data['primary_condition']} ({data['primary_confidence']}%)")
    print(f"Risk Tier: {data['risk_level']} (Score: {data['risk_score']})")
    print(f"Affected Quadrants: {data['affected_quadrants']}")
    print(f"Grad-CAM Generated: {data['gradcam_image_base64'] is not None} (Length: {len(data['gradcam_image_base64'] or '')})")
    assert "Diabetic Retinopathy" in data['primary_condition']
    assert data['gradcam_image_base64'] is not None
    print("AI Screening & Grad-CAM: PASSED!")

    print("\n--- 5. Testing Doctor Geolocation Search & Smart Ranking ---")
    res = client.get("/api/doctors/search", params={"lat": 22.5726, "lng": 88.3639, "condition": "Diabetic Retinopathy"})
    assert res.status_code == 200
    docs = res.json()
    print(f"Doctors Found: {len(docs)}")
    print(f"Top Recommended: {docs[0]['name']} | {docs[0]['specialization']} | {docs[0]['hospital']} | Dist: {docs[0]['distance_km']} km | Match: {docs[0]['match_score']}")
    assert docs[0]['distance_km'] < 35.0, "Kolkata doctors should be within 35km of Kolkata coordinates"
    print("Doctor Search & Ranking: PASSED!")

    print("\n--- 6. Testing Appointment Booking & Double-Booking Prevention ---")
    book_req = {
        "doctor_id": docs[0]['id'],
        "date": "2026-09-20",
        "time_slot": "11:00 AM",
        "reason": "Diabetic retinopathy check",
        "screening_id": data['screening_id']
    }
    res = client.post("/api/appointments/book", json=book_req)
    assert res.status_code == 200, f"Booking failed: {res.text}"
    apt = res.json()
    print(f"Booked Appointment ID: {apt['appointment_id']} for {apt['doctor_name']} at {apt['time_slot']}")

    # Attempt double-booking same slot
    res_duplicate = client.post("/api/appointments/book", json=book_req)
    assert res_duplicate.status_code == 409, f"Expected 409 Conflict for double-booking, got {res_duplicate.status_code}"
    print("Double-booking collision prevention: PASSED (Returned 409 Conflict)!")

    print("\n--- 7. Testing AI Chatbot (Medical Safety & Emergency Triage) ---")
    # Standard inquiry
    res_chat = client.post("/api/chat", json={"message": "Can you explain my screening results?", "screening_context": {"primary_condition": "Diabetic Retinopathy", "risk_level": "High Risk", "primary_confidence": 92.4}})
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    print(f"Chatbot reply sample: {chat_data['reply'][:120]}...")
    assert chat_data['is_emergency'] is False
    assert "Medical Safety Notice" in chat_data['reply']

    # Emergency inquiry
    res_emer = client.post("/api/chat", json={"message": "I suddenly lost vision in my left eye with severe eye pain!"})
    assert res_emer.status_code == 200
    emer_data = res_emer.json()
    print(f"Emergency Alert Triggered: {emer_data['is_emergency']}")
    assert emer_data['is_emergency'] is True
    assert "EMERGENCY" in emer_data['reply']
    print("AI Chatbot Safety & Emergency Triage: PASSED!")

    print("\n--- 8. Testing Admin & Research Analytics ---")
    res_admin = client.get("/api/admin/system-stats")
    assert res_admin.status_code == 200
    stats = res_admin.json()
    print(f"System Stats: Screenings={stats['total_screenings']}, Appointments={stats['total_appointments']}, Model={stats['active_model_version']}")

    res_metrics = client.get("/api/admin/research-metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    print(f"Research Metrics: Accuracy={metrics['overall_accuracy']}%, ROC-AUC={metrics['roc_auc_macro']}")
    print("Admin & Research Metrics: PASSED!")

    print("\n==========================================")
    print("ALL 8 BACKEND TEST SUITES PASSED WITH 100% SUCCESS!")
    print("==========================================")

if __name__ == "__main__":
    test_all()
