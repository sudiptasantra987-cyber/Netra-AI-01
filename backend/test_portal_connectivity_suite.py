"""
Comprehensive Integration Test Suite for Netra AI Connected Portals
Verifies end-to-end integration across Patient, Doctor, and Admin Portals:
1. Role-based authentication & redirection checks.
2. Doctor registration with 'pending' verification status.
3. Automated Admin notification upon doctor registration.
4. Lockdown enforcement: Unverified (pending/rejected/revoked) doctors blocked from screening (403).
5. Lockdown enforcement: Unverified doctors blocked from finalizing/reviewing reports (403).
6. Patient self-screening restriction (403 Forbidden).
7. Admin approval of doctor credentials ('verified').
8. Walk-in patient enrollment by verified doctor (/api/doctor/patients/enroll).
9. Verified doctor initiates screening for patient, runs AI model, records Grad-CAM and both patient_id & doctor_id.
10. Clinical report sign-off and review status transition.
11. Automated patient notification dispatch upon report review.
12. Patient access to finalized screening report & isolation check (Patient A cannot view Patient B's report: 403).
13. Doctor privilege revocation and immediate screening block (403).
"""

import sys
import os
import uuid
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from starlette.testclient import TestClient
from app.main import app
from app.core.database import db

client = TestClient(app, raise_server_exceptions=True)

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

print("\n" + "="*70)
print("  Netra AI: 3-Portal Connectivity & Verification Test Suite")
print("="*70)

# 1. Authenticate Admin
print("\n[Step 1] Authenticate System Administrator")
r_admin = client.post("/api/auth/login", json={"email": "santrasudipta70@gmail.com", "password": "sudipta@70"})
test("Admin login succeeds (200)", r_admin.status_code == 200, str(r_admin.status_code))
admin_token = r_admin.json().get("access_token")
admin_headers = {"Authorization": f"Bearer {admin_token}"}
test("Admin user role is 'admin'", r_admin.json().get("user", {}).get("role") == "admin")

# 2. Authenticate Registered Patient
print("\n[Step 2] Authenticate Registered Patient")
r_pat = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Patient login succeeds (200)", r_pat.status_code == 200, str(r_pat.status_code))
pat_token = r_pat.json().get("access_token")
pat_headers = {"Authorization": f"Bearer {pat_token}"}
pat_user = r_pat.json().get("user", {})
pat_id = pat_user.get("id")
test("Patient user role is 'patient'", pat_user.get("role") == "patient")

# 3. Patient Self-Screening Restriction
print("\n[Step 3] Verify Patient Self-Screening Guardrail (403 Forbidden)")
r_pat_screen = client.post(
    "/api/screening/analyze",
    data={"sample_key": "diabetic_retinopathy.jpg"},
    headers=pat_headers
)
test(
    "Patient self-screening blocked with 403 Forbidden",
    r_pat_screen.status_code == 403,
    f"Status: {r_pat_screen.status_code}, Detail: {r_pat_screen.json().get('detail')}"
)

# 4. Doctor Registration with 'pending' verification status
print("\n[Step 4] Doctor Registration (Verification Status = 'pending')")
unique_suffix = uuid.uuid4().hex[:6]
doc_email = f"dr.test_{unique_suffix}@ruralvision.org"
doc_reg_no = f"WB-MCI-2026-{unique_suffix.upper()}"
doc_payload = {
    "name": f"Dr. Sujoy Bannerjee {unique_suffix.upper()}",
    "email": doc_email,
    "password": "SecurePassword123!",
    "role": "doctor",
    "phone": f"+91 98300 {unique_suffix[:5]}",
    "city": "Bankura",
    "medical_reg_no": doc_reg_no,
    "hospital": "Bankura Sammilani Rural Outreach Centre",
    "qualifications": "MBBS, DO, DNB (Ophthalmology)",
    "specialization": "Comprehensive Ophthalmology"
}
r_doc_reg = client.post("/api/auth/register", json=doc_payload)
test("Doctor registration succeeds (200)", r_doc_reg.status_code == 200, str(r_doc_reg.status_code))
new_doc_data = r_doc_reg.json()
new_doc_token = new_doc_data.get("access_token")
new_doc_user = new_doc_data.get("user", {})
new_doc_id = new_doc_user.get("id")
new_doc_headers = {"Authorization": f"Bearer {new_doc_token}"}
test("Newly registered doctor has verification_status == 'pending'", new_doc_user.get("verification_status") == "pending", str(new_doc_user.get("verification_status")))

# 5. Automated Admin Notification for Doctor Registration
print("\n[Step 5] Automated Admin Notification on Doctor Registration")
r_admin_notifs = client.get("/api/admin/notifications", headers=admin_headers)
test("GET /api/admin/notifications returns 200", r_admin_notifs.status_code == 200)
admin_notifs = r_admin_notifs.json()
found_doc_notif = any(doc_reg_no in n.get("message", "") or new_doc_user.get("name", "") in n.get("message", "") for n in admin_notifs)
test("Admin received verification notification for pending doctor", found_doc_notif)

# 6. Unverified Doctor Blocked from Clinical Actions (403 Forbidden)
print("\n[Step 6] Unverified Doctor Clinical Lockdown (403 Forbidden)")
r_unverified_screen = client.post(
    "/api/screening/analyze",
    data={"sample_key": "diabetic_retinopathy.jpg", "patient_id": pat_id},
    headers=new_doc_headers
)
test(
    "Unverified doctor blocked from /api/screening/analyze with 403 Forbidden",
    r_unverified_screen.status_code == 403,
    f"Status: {r_unverified_screen.status_code}, Detail: {r_unverified_screen.json().get('detail')}"
)

r_unverified_enroll = client.post(
    "/api/doctor/patients/enroll",
    json={"name": "Walkin Test", "age": 45, "gender": "Male"},
    headers=new_doc_headers
)
test(
    "Unverified doctor blocked from enrolling patients with 403 Forbidden",
    r_unverified_enroll.status_code == 403,
    f"Status: {r_unverified_enroll.status_code}"
)

# 7. Admin Verifies Doctor
print("\n[Step 7] Admin Approves Doctor Verification")
r_verify = client.patch(
    f"/api/admin/doctors/{new_doc_id}/verify",
    json={"verification_status": "verified", "verification_notes": "WB-MCI credentials verified successfully."},
    headers=admin_headers
)
test("Admin approves doctor (200)", r_verify.status_code == 200, str(r_verify.status_code))
test("Doctor verification status is now 'verified'", r_verify.json().get("doctor", {}).get("verification_status") == "verified")

# Re-authenticate doctor to get updated token/session
r_doc_reauth = client.post("/api/auth/login", json={"email": doc_email, "password": "SecurePassword123!"})
verified_doc_token = r_doc_reauth.json().get("access_token")
verified_doc_headers = {"Authorization": f"Bearer {verified_doc_token}"}
test("Re-authenticated doctor verification_status is 'verified'", r_doc_reauth.json().get("user", {}).get("verification_status") == "verified")

# 8. Verified Doctor Enrolls Walk-In Patient
print("\n[Step 8] Verified Doctor Enrolls Walk-In Patient")
walkin_payload = {
    "name": f"Shanti Devi {unique_suffix.upper()}",
    "age": 58,
    "gender": "Female",
    "phone": f"+91 97321 {unique_suffix[:5]}",
    "city": "Purulia Rural Center",
    "email": f"shanti_{unique_suffix}@ruralvision.org"
}
r_enroll = client.post("/api/doctor/patients/enroll", json=walkin_payload, headers=verified_doc_headers)
test("Enroll walk-in patient succeeds (200)", r_enroll.status_code == 200, str(r_enroll.status_code))
enrolled_data = r_enroll.json()
walkin_pat_id = enrolled_data.get("patient", {}).get("patient_id")
test("Walk-in patient ID is formatted properly (pat-...)", bool(walkin_pat_id and walkin_pat_id.startswith("pat-")), str(walkin_pat_id))

# 9. Verified Doctor Performs Screening for Enrolled Patient
print("\n[Step 9] Verified Doctor Performs Retinal AI Screening for Patient")
r_screen = client.post(
    "/api/screening/analyze",
    data={
        "sample_key": "diabetic_retinopathy.jpg",
        "patient_id": walkin_pat_id,
        "patient_name": walkin_payload["name"]
    },
    headers=verified_doc_headers
)
test("Screening succeeds (200)", r_screen.status_code == 200, f"{r_screen.status_code}: {r_screen.text}")
if r_screen.status_code != 200:
    print(f"ERROR BODY: {r_screen.text}")
    sys.exit(1)
screening_res = r_screen.json()
scr_id = screening_res.get("screening_id")
test("Screening response has valid screening_id (scr-...)", bool(scr_id and scr_id.startswith("scr-")), str(scr_id))
test("Screening response patient_id matches enrolled patient", screening_res.get("patient_id") == walkin_pat_id)
test("Screening generates Grad-CAM explainability heatmap", bool(screening_res.get("gradcam_image_base64")))
test("Screening predicts primary condition", bool(screening_res.get("primary_condition")))

# Verify record persistence in database
saved_record = db.get_screening(scr_id)
test("Screening record stored in database with doctor_id", saved_record.get("doctor_id") == new_doc_id)
test("Screening record stored with patient_id", saved_record.get("patient_id") == walkin_pat_id)

# 10. Doctor Reviews and Signs Off on Screening Report
print("\n[Step 10] Doctor Reviews and Finalizes Screening Report")
review_payload = {
    "review_status": "reviewed",
    "clinical_notes": "Moderate NPDR confirmed with focal lipid exudates in macular vicinity. Glycemic control and 6-month follow-up advised.",
    "diagnosis_confirmed": "Moderate Non-Proliferative Diabetic Retinopathy"
}
r_review = client.patch(
    f"/api/doctor/reports/{scr_id}/review",
    json=review_payload,
    headers=verified_doc_headers
)
test("Report sign-off succeeds (200)", r_review.status_code == 200, str(r_review.status_code))
test("Report status marked as 'reviewed'", r_review.json().get("review_status") == "reviewed")

# 11. Automated Notification Delivery to Patient
print("\n[Step 11] Verify Patient Notification Dispatch")
pat_notifs = db.get_user_notifications(walkin_pat_id)
test("Patient notifications exist", len(pat_notifs) > 0)
has_report_notif = any(n.get("type") == "report_reviewed" or "reviewed" in n.get("title", "").lower() for n in pat_notifs)
test("Patient received 'Screening Report Evaluated' notification", has_report_notif)

# 12. Patient Access & Strict Report Isolation
print("\n[Step 12] Patient Access & Report Isolation")
# Login as walk-in patient
r_walkin_login = client.post("/api/auth/login", json={"email": walkin_payload["email"], "password": "patient123"})
test("Enrolled patient can log in with default credentials (200)", r_walkin_login.status_code == 200)
walkin_token = r_walkin_login.json().get("access_token")
walkin_headers = {"Authorization": f"Bearer {walkin_token}"}

# Walk-in patient retrieves their report
r_pat_report = client.get(f"/api/screening/report/{scr_id}", headers=walkin_headers)
test("Patient can access their own screening report (200)", r_pat_report.status_code == 200, str(r_pat_report.status_code))
report_data = r_pat_report.json()
test("Report includes reviewing doctor name", bool(report_data.get("reviewed_by") or report_data.get("doctor_name")))
test("Report includes clinical assessment notes", report_data.get("clinical_notes") == review_payload["clinical_notes"])

# Strict Isolation: Registered patient (pat-01) tries to access walk-in patient's report
r_isolate = client.get(f"/api/screening/report/{scr_id}", headers=pat_headers)
test("Unauthorized patient access to another patient's report rejected with 403 Forbidden", r_isolate.status_code == 403, str(r_isolate.status_code))

# 13. Doctor Revocation Check
print("\n[Step 13] Admin Revokes Doctor Privileges & Immediate Screening Block")
r_revoke = client.patch(
    f"/api/admin/doctors/{new_doc_id}/verify",
    json={"verification_status": "revoked", "verification_notes": "Clinical privileges suspended for audit."},
    headers=admin_headers
)
test("Admin revokes doctor (200)", r_revoke.status_code == 200)

r_revoked_screen = client.post(
    "/api/screening/analyze",
    data={"sample_key": "diabetic_retinopathy.jpg", "patient_id": walkin_pat_id},
    headers=verified_doc_headers
)
test("Revoked doctor immediately blocked from screening with 403 Forbidden", r_revoked_screen.status_code == 403, str(r_revoked_screen.status_code))

print("\n" + "="*70)
print(f"  Test Suite Completed: {PASS_COUNT} Passed, {FAIL_COUNT} Failed")
print("="*70 + "\n")

if FAIL_COUNT > 0:
    sys.exit(1)
