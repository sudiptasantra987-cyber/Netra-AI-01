"""
Comprehensive Doctor Portal Test Suite for Netra AI.
Verifies role authorization, dynamic telemetry, patient directories,
screening reports inspection, review status transitions, patient notifications,
and doctor profile credential management.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from starlette.testclient import TestClient
from app.main import app
from app.core.database import db

client = TestClient(app, raise_server_exceptions=False)

PASS_COUNT = 0
FAIL_COUNT = 0

def test(name: str, result: bool, detail: str = ""):
    global PASS_COUNT, FAIL_COUNT
    status = "[PASS]" if result else "[FAIL]"
    suffix = f"  -> {detail}" if detail else ""
    print(f"  {status}  {name}{suffix}")
    if result:
        PASS_COUNT += 1
    else:
        FAIL_COUNT += 1
    return result

print("\n" + "="*68)
print("  Netra AI -- Doctor Portal Comprehensive Integration Suite")
print("="*68)

# [1] Authenticate Test Users
print("\n[1] Authentication Setup")
r_doc = client.post("/api/auth/login", json={"email": "doctor@netra.ai", "password": "password123"})
test("Doctor login succeeds (200)", r_doc.status_code == 200, str(r_doc.status_code))
doc_token = r_doc.json().get("access_token")
doc_headers = {"Authorization": f"Bearer {doc_token}"}

r_pat = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Patient login succeeds (200)", r_pat.status_code == 200, str(r_pat.status_code))
pat_token = r_pat.json().get("access_token")
pat_headers = {"Authorization": f"Bearer {pat_token}"}

# [2] Role-Based Access Control
print("\n[2] Security & Access Control")
r_unauth = client.get("/api/doctor/dashboard-stats")
test("Unauthenticated access rejected with 401", r_unauth.status_code == 401, str(r_unauth.status_code))

r_forbidden = client.get("/api/doctor/dashboard-stats", headers=pat_headers)
test("Patient access to doctor endpoints rejected with 403", r_forbidden.status_code == 403, str(r_forbidden.status_code))

# [3] Doctor Dashboard Telemetry (Dynamic calculation)
print("\n[3] Dynamic Dashboard Statistics")
r_stats = client.get("/api/doctor/dashboard-stats", headers=doc_headers)
test("GET /api/doctor/dashboard-stats returns 200", r_stats.status_code == 200, str(r_stats.status_code))
stats_data = r_stats.json()
test("Stats contains doctor_id", stats_data.get("doctor_id") == "doc-01")
test("Stats contains integer total_patients", isinstance(stats_data.get("total_patients"), int))
test("Stats contains integer reports_awaiting_review", isinstance(stats_data.get("reports_awaiting_review"), int))
test("Stats contains integer reports_reviewed", isinstance(stats_data.get("reports_reviewed"), int))
test("Stats contains integer reports_urgent", isinstance(stats_data.get("reports_urgent"), int))
test("Stats contains recent_activity list", isinstance(stats_data.get("recent_activity"), list))

# [4] Patient Management & Search
print("\n[4] Patient Management & Search")
r_patients = client.get("/api/doctor/patients", headers=doc_headers)
test("GET /api/doctor/patients returns 200", r_patients.status_code == 200, str(r_patients.status_code))
patients_list = r_patients.json()
test("Patients list is accessible", isinstance(patients_list, list))

# Test search query
r_search_name = client.get("/api/doctor/patients?q=pat", headers=doc_headers)
test("GET /api/doctor/patients?q=pat returns 200", r_search_name.status_code == 200)

# Check authorized patient details
if patients_list:
    target_pid = patients_list[0]["patient_id"]
    r_detail = client.get(f"/api/doctor/patients/{target_pid}", headers=doc_headers)
    test("GET /api/doctor/patients/{id} returns 200", r_detail.status_code == 200)
    detail_data = r_detail.json()
    test("Patient detail includes patient profile", "patient" in detail_data)
    test("Patient detail includes screening history list", "screenings" in detail_data)

# Check unauthorized patient isolation
r_fake_pat = client.get("/api/doctor/patients/non-existent-pat-999", headers=doc_headers)
test("Unauthorized/unassigned patient access returns 403", r_fake_pat.status_code == 403, str(r_fake_pat.status_code))

# [5] Screening Reports Queue & Filters
print("\n[5] Screening Reports Queue & Saliency Inspection")
r_reports = client.get("/api/doctor/reports?status=all", headers=doc_headers)
test("GET /api/doctor/reports?status=all returns 200", r_reports.status_code == 200)
reports = r_reports.json()
test("Reports list is populated", isinstance(reports, list))

if reports:
    target_sid = reports[0]["screening_id"]
    r_report_detail = client.get(f"/api/doctor/reports/{target_sid}", headers=doc_headers)
    test("GET /api/doctor/reports/{id} returns 200", r_report_detail.status_code == 200)
    report_data = r_report_detail.json()
    test("Report includes image_url", bool(report_data.get("image_url")))
    test("Report includes quality metrics", "quality" in report_data)
    test("Report includes is_gradable flag", "is_gradable" in report_data)
    test("Report includes primary_condition", bool(report_data.get("primary_condition")))
    test("Report includes primary_confidence score", isinstance(report_data.get("primary_confidence"), (int, float)))
    test("Report includes retinal_findings list", isinstance(report_data.get("retinal_findings"), list))
    test("Report includes clinical_recommendation", bool(report_data.get("clinical_recommendation")))

# [6] Clinical Review & Status Transitions
print("\n[6] Clinical Review & Patient Notifications")
if reports:
    target_sid = reports[0]["screening_id"]
    # 1. Mark as Reviewed with clinical remarks
    r_review = client.patch(f"/api/doctor/reports/{target_sid}/review", json={
        "review_status": "reviewed",
        "clinical_notes": "Dilated fundus photography demonstrates stable physiological retina without neovascularization.",
        "diagnosis_confirmed": "Normal Fundus - Annual Follow-Up"
    }, headers=doc_headers)
    test("PATCH review -> 'reviewed' returns 200", r_review.status_code == 200, str(r_review.status_code))
    test("Response status confirms reviewed", r_review.json().get("review_status") == "reviewed")

    # Verify review persisted in screening record
    r_check = client.get(f"/api/doctor/reports/{target_sid}", headers=doc_headers)
    test("Screening reflects review_status 'reviewed'", r_check.json().get("review_status") == "reviewed")
    test("Screening reflects clinical_notes", "stable physiological retina" in (r_check.json().get("clinical_notes") or ""))

    # 2. Test 'recapture_required' and verify notification created for patient
    r_recapture = client.patch(f"/api/doctor/reports/{target_sid}/review", json={
        "review_status": "recapture_required",
        "clinical_notes": "Mild blur around fovea. Please retake fundus photo with optimal pupil dilation.",
        "diagnosis_confirmed": None
    }, headers=doc_headers)
    test("PATCH review -> 'recapture_required' returns 200", r_recapture.status_code == 200)
    test("Response status confirms recapture_required", r_recapture.json().get("review_status") == "recapture_required")

    # Check patient notifications
    r_pat_notifs = client.get("/api/notifications", headers=pat_headers)
    test("Patient receives recapture notification", any(
        n.get("type") == "recapture_required" for n in r_pat_notifs.json()
    ))

    # Reset back to reviewed
    client.patch(f"/api/doctor/reports/{target_sid}/review", json={
        "review_status": "reviewed",
        "clinical_notes": "Clinical review confirmed.",
        "diagnosis_confirmed": "Verified Normal"
    }, headers=doc_headers)

# [7] Doctor Profile Credentials & Editing
print("\n[7] Doctor Profile Credentials & Editing")
r_get_prof = client.get("/api/doctor/profile", headers=doc_headers)
test("GET /api/doctor/profile returns 200", r_get_prof.status_code == 200)
prof_data = r_get_prof.json()
test("Profile includes doctor name", bool(prof_data.get("name")))
test("Profile includes medical_reg_no field", "medical_reg_no" in prof_data)
test("Profile includes hospital field", "hospital" in prof_data)

# Test updating doctor profile
r_update_prof = client.put("/api/doctor/profile", json={
    "medical_reg_no": "WBMC-68421",
    "qualifications": "MBBS, MS (Ophthalmology), FVRF",
    "specialization": "Vitreo-Retinal Surgeon",
    "hospital": "Sankara Nethralaya Eye Hospital",
    "city": "Kolkata",
    "bio": "Consultant Vitreo-Retinal Specialist specializing in rural diabetic screening and tele-ophthalmology."
}, headers=doc_headers)
test("PUT /api/doctor/profile returns 200", r_update_prof.status_code == 200)
updated_data = r_update_prof.json()
test("Medical registration number persisted", updated_data.get("medical_reg_no") == "WBMC-68421")
test("Hospital persisted", updated_data.get("hospital") == "Sankara Nethralaya Eye Hospital")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*68)
total = PASS_COUNT + FAIL_COUNT
print(f"  Results: {PASS_COUNT}/{total} tests passed")
if FAIL_COUNT > 0:
    print(f"  [FAIL] {FAIL_COUNT} test(s) FAILED")
    sys.exit(1)
else:
    print("  [SUCCESS] All Doctor Portal integration tests PASSED!")
    sys.exit(0)
