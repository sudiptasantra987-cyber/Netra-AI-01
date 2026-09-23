"""
Comprehensive Patient Portal & Tele-Screening End-to-End Test Suite for Netra AI
Verifies all 11 patient flow requirements:
1. Patient registration without auto-login.
2. Patient manual login to Patient Portal (Home).
3. Patient role and profile verification.
4. Patient screening request submission with optical quality check.
5. Unique request ID (scr-...) & no fake doctor assignment.
6. Doctor Portal queue visibility for unassigned patient requests.
7. Doctor clinical review with AI Grad-CAM inspection & sign-off.
8. Report status transition to 'Report Available'.
9. Automated patient notification: 'Your retinal screening report is now available.'
10. Patient access to finalized report with clinical notes & Grad-CAM.
11. Strict data isolation and ownership enforcement (403 Forbidden for other patients).
"""

import sys
import uuid
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from starlette.testclient import TestClient
from app.main import app
from app.core.database import db

client = TestClient(app, raise_server_exceptions=True)

PASS_COUNT = 0
FAIL_COUNT = 0

def test(name: str, condition: bool, detail: str = ""):
    global PASS_COUNT, FAIL_COUNT
    status = "[PASS]" if condition else "[FAIL]"
    suffix = f"  -> {detail}" if detail else ""
    print(f"  {status}  {name}{suffix}")
    if condition:
        PASS_COUNT += 1
    else:
        FAIL_COUNT += 1
    return condition

print("\n" + "="*70)
print("  Netra AI: Patient Portal & Tele-Screening Workflow Test Suite")
print("="*70)

# 1. Patient Registration
print("\n[Step 1] Patient Registration (No Auto-Login)")
rand_suffix = uuid.uuid4().hex[:6]
patient_email = f"pat_{rand_suffix}@netra.ai"
patient_password = "SecurePassword123!"

r_reg = client.post("/api/auth/register", json={
    "email": patient_email,
    "password": patient_password,
    "name": f"Test Patient {rand_suffix}",
    "role": "patient",
    "phone": f"+91 {uuid.uuid4().int % 9000000000 + 1000000000}",
    "city": "Burdwan Outreach Centre"
})

test("Patient registration succeeds (200)", r_reg.status_code == 200, str(r_reg.status_code))
reg_data = r_reg.json()
test("Registration confirms patient role", reg_data.get("user", {}).get("role") == "patient")
patient_id = reg_data.get("user", {}).get("id")
test("Patient ID assigned", bool(patient_id), str(patient_id))

# 2. Patient Manual Login
print("\n[Step 2] Patient Manual Login")
r_login = client.post("/api/auth/login", json={
    "email": patient_email,
    "password": patient_password
})
test("Patient manual login succeeds (200)", r_login.status_code == 200, str(r_login.status_code))
patient_token = r_login.json().get("access_token")
test("Access token issued", bool(patient_token))
patient_headers = {"Authorization": f"Bearer {patient_token}"}

r_me = client.get("/api/auth/me", headers=patient_headers)
test("Authenticated user role is 'patient'", r_me.json().get("role") == "patient")

# 3. Patient Submits Screening Request
print("\n[Step 3] Patient Submits Screening Request (Optical Quality & Queued)")
r_scr = client.post(
    "/api/screening/request",
    data={
        "sample_key": "diabetic_retinopathy.jpg",
        "notes": "Blurry central vision for 3 weeks"
    },
    headers=patient_headers
)
test("Screening request submission succeeds (200)", r_scr.status_code == 200, str(r_scr.status_code))
scr_data = r_scr.json()
screening_id = scr_data.get("screening_id")
test("Screening request ID generated with 'scr-' prefix", str(screening_id).startswith("scr-"), str(screening_id))
test("Initial status is 'Awaiting Review'", scr_data.get("status") == "Awaiting Review", str(scr_data.get("status")))
test("Initial review status is 'pending'", scr_data.get("review_status") == "pending")
test("Image is verified gradable", scr_data.get("is_gradable") is True)

# Verify DB record integrity (no fake doctor assigned)
screening_record = db.get_screening(screening_id)
test("DB record has no fake doctor assigned (doctor_id is None)", screening_record.get("doctor_id") is None)
test("DB record patient_id matches authenticated patient", screening_record.get("patient_id") == patient_id)

# 4. Patient Fetches My Screening Requests
print("\n[Step 4] Patient Views My Screening Requests")
r_my_reqs = client.get("/api/screening/my-requests", headers=patient_headers)
test("My requests endpoint succeeds (200)", r_my_reqs.status_code == 200)
my_reqs = r_my_reqs.json()
test("Created screening request appears in patient requests", any(s.get("screening_id") == screening_id for s in my_reqs))

# 5. Doctor Portal Queue Visibility
print("\n[Step 5] Doctor Portal Queue Visibility for Unassigned Patient Scan")
r_doc_login = client.post("/api/auth/login", json={
    "email": "doctor@netra.ai",
    "password": "password123"
})
test("Doctor login succeeds (200)", r_doc_login.status_code == 200)
doc_token = r_doc_login.json().get("access_token")
doc_headers = {"Authorization": f"Bearer {doc_token}"}
doc_id = r_doc_login.json().get("user", {}).get("id")

r_doc_reports = client.get("/api/doctor/reports", headers=doc_headers)
test("Doctor reports queue endpoint succeeds (200)", r_doc_reports.status_code == 200)
doc_reports = r_doc_reports.json()
test("Unassigned patient request visible in Doctor queue", any(r.get("screening_id") == screening_id for r in doc_reports))

# 6. Doctor Opens Detail with AI Triage & Grad-CAM Heatmap
print("\n[Step 6] Doctor Opens Request Detail for Clinical Inspection")
r_detail = client.get(f"/api/doctor/reports/{screening_id}", headers=doc_headers)
test("Doctor report detail succeeds (200)", r_detail.status_code == 200, str(r_detail.status_code))
detail_data = r_detail.json()
test("Detail includes fundus image URL", bool(detail_data.get("image_url")))
test("Detail includes Grad-CAM heatmap visualization", bool(detail_data.get("gradcam_image_base64")))
test("Detail includes AI disease predictions", len(detail_data.get("all_predictions", [])) > 0)
test("Detail includes optical quality metrics", bool(detail_data.get("quality")))

# 7. Doctor Finalizes Clinical Review & Report Sign-Off
print("\n[Step 7] Doctor Finalizes Clinical Review & Signs Off Report")
r_review = client.patch(
    f"/api/doctor/reports/{screening_id}/review",
    json={
        "review_status": "reviewed",
        "diagnosis_confirmed": "Moderate Non-Proliferative Diabetic Retinopathy",
        "clinical_notes": "Multiple microaneurysms detected in macula. Advise strict glycemic control (HbA1c < 7%) and follow-up in 6 months."
    },
    headers=doc_headers
)
test("Doctor review update succeeds (200)", r_review.status_code == 200, str(r_review.status_code))

updated_record = db.get_screening(screening_id)
test("Screening status transitioned to 'Report Available'", updated_record.get("status") == "Report Available", str(updated_record.get("status")))
test("Doctor ID recorded on review", updated_record.get("doctor_id") == doc_id)
test("Doctor reviewer name recorded", bool(updated_record.get("reviewed_by")))

# 8. Patient Receives Automated Notification
print("\n[Step 8] Patient Receives Automated Report Notification")
r_notifs = client.get("/api/notifications", headers=patient_headers)
test("Patient notifications endpoint succeeds (200)", r_notifs.status_code == 200)
notifs = r_notifs.json()
expected_msg = "Your retinal screening report is now available."
has_report_notif = any(expected_msg in n.get("message", "") for n in notifs)
test("Patient received notification: 'Your retinal screening report is now available.'", has_report_notif)

# 9. Patient Accesses Finalized Report in My Screening Reports
print("\n[Step 9] Patient Views Finalized Report in My Screening Reports")
r_report = client.get(f"/api/reports/{screening_id}", headers=patient_headers)
test("Patient access to finalized report succeeds (200)", r_report.status_code == 200, str(r_report.status_code))
rep_json = r_report.json()
scr_in_rep = rep_json.get("screening", {})
test("Report contains confirmed diagnosis from doctor", scr_in_rep.get("diagnosis_confirmed") == "Moderate Non-Proliferative Diabetic Retinopathy")
test("Report contains doctor clinical notes", "glycemic control" in (scr_in_rep.get("clinical_notes") or ""))
test("Report clearly identifies reviewing doctor", bool(scr_in_rep.get("reviewed_by")))
test("Report includes Grad-CAM explainability heatmap", bool(scr_in_rep.get("gradcam_image_base64")))

# 10. Patient History Endpoint
print("\n[Step 10] Patient History Endpoint Isolation")
r_hist = client.get("/api/screening/history", headers=patient_headers)
test("Patient history succeeds (200)", r_hist.status_code == 200)
hist_items = r_hist.json()
test("Finalized report present in history", any(s.get("screening_id") == screening_id for s in hist_items))

# 11. Security & Data Isolation Enforcement
print("\n[Step 11] Strict Security & Data Isolation Check")
other_email = f"pat_other_{rand_suffix}@netra.ai"
client.post("/api/auth/register", json={
    "email": other_email,
    "password": patient_password,
    "name": "Other Patient",
    "role": "patient"
})
r_other_login = client.post("/api/auth/login", json={
    "email": other_email,
    "password": patient_password
})
other_token = r_other_login.json().get("access_token")
other_headers = {"Authorization": f"Bearer {other_token}"}

# Attempt 1: Other patient tries to read first patient's report
r_leak1 = client.get(f"/api/reports/{screening_id}", headers=other_headers)
test("Other patient blocked from accessing report (403 Forbidden)", r_leak1.status_code == 403, str(r_leak1.status_code))

# Attempt 2: Other patient tries to read first patient's scan history
r_leak2 = client.get(f"/api/screening/history/{patient_id}", headers=other_headers)
test("Other patient blocked from viewing scan history (403 Forbidden)", r_leak2.status_code == 403, str(r_leak2.status_code))

print("\n" + "="*70)
print(f"  Summary: {PASS_COUNT} Passed, {FAIL_COUNT} Failed")
print("="*70 + "\n")

if FAIL_COUNT > 0:
    sys.exit(1)
