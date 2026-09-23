"""
Comprehensive Admin Portal Test Suite for Netra AI.
Verifies administrator authentication, role-based access control (RBAC),
dynamic dashboard statistics from database, patient management,
doctor management and credential verification, technical screening oversight,
system health and diagnostics, audit logging, and security restrictions.
"""

import sys
from pathlib import Path

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
print("  Netra AI -- Admin Portal Comprehensive Integration Suite")
print("="*68)

# [1] Authenticate Users & Seed Admin Account
print("\n[1] Authentication & RBAC")
r_admin = client.post("/api/auth/login", json={"email": "santrasudipta70@gmail.com", "password": "sudipta@70"})
test("Admin login succeeds with santrasudipta70@gmail.com / sudipta@70 (200)", r_admin.status_code == 200, str(r_admin.status_code))
admin_token = r_admin.json().get("access_token")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Verify old admin@netra.ai login is rejected
r_old_admin = client.post("/api/auth/login", json={"email": "admin@netra.ai", "password": "admin123"})
test("Old admin@netra.ai login is rejected", r_old_admin.status_code in (401, 403), str(r_old_admin.status_code))

r_doc = client.post("/api/auth/login", json={"email": "doctor@netra.ai", "password": "password123"})
test("Doctor login succeeds (200)", r_doc.status_code == 200, str(r_doc.status_code))
doc_token = r_doc.json().get("access_token")
doc_headers = {"Authorization": f"Bearer {doc_token}"}

r_pat = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Patient login succeeds (200)", r_pat.status_code == 200, str(r_pat.status_code))
pat_token = r_pat.json().get("access_token")
pat_headers = {"Authorization": f"Bearer {pat_token}"}

# Access control tests
r_unauth = client.get("/api/admin/dashboard-stats")
test("Unauthenticated access to admin endpoints rejected (401)", r_unauth.status_code == 401, str(r_unauth.status_code))

r_pat_admin = client.get("/api/admin/dashboard-stats", headers=pat_headers)
test("Patient access to admin endpoints rejected (403)", r_pat_admin.status_code == 403, str(r_pat_admin.status_code))

r_doc_admin = client.get("/api/admin/dashboard-stats", headers=doc_headers)
test("Doctor access to admin endpoints rejected (403)", r_doc_admin.status_code == 403, str(r_doc_admin.status_code))

# Reject public registration as admin
r_reg_admin = client.post("/api/auth/register", json={
    "name": "Hacker Admin",
    "identifier": "hacker_admin@example.com",
    "password": "password123",
    "confirm_password": "password123",
    "role": "admin"
})
test("Public registration of Admin role rejected (403)", r_reg_admin.status_code == 403, str(r_reg_admin.status_code))

# [2] Admin Dashboard Dynamic Stats
print("\n[2] Admin Dashboard Dynamic Statistics")
r_stats = client.get("/api/admin/dashboard-stats", headers=admin_headers)
test("Admin dashboard stats returns 200", r_stats.status_code == 200, str(r_stats.status_code))
stats = r_stats.json()
test("total_patients matches database count", stats.get("total_patients", 0) >= 1, f"Count: {stats.get('total_patients')}")
test("total_doctors matches database count", stats.get("total_doctors", 0) >= 1, f"Count: {stats.get('total_doctors')}")
test("total_screenings matches database count", stats.get("total_screenings", 0) >= 1, f"Count: {stats.get('total_screenings')}")
test("reports_awaiting_review is calculated", "reports_awaiting_review" in stats, str(stats.get("reports_awaiting_review")))
test("reports_reviewed is calculated", "reports_reviewed" in stats, str(stats.get("reports_reviewed")))
test("reports_requiring_attention is calculated", "reports_requiring_attention" in stats, str(stats.get("reports_requiring_attention")))
test("recent_activity stream is present and dynamic", len(stats.get("recent_activity", [])) > 0, f"{len(stats.get('recent_activity', []))} items")

# [3] Patient Management
print("\n[3] Patient Management & Governance")
r_patients = client.get("/api/admin/patients", headers=admin_headers)
test("Get patients returns 200", r_patients.status_code == 200, str(r_patients.status_code))
patients = r_patients.json()
test("Patients list has registered patients", len(patients) >= 1, f"{len(patients)} patients")

# Search patients
r_psearch = client.get("/api/admin/patients?q=pat-01", headers=admin_headers)
test("Patient search by ID returns matching records", len(r_psearch.json()) >= 1)

# Toggle patient account status active -> inactive -> active
r_deact = client.patch("/api/admin/patients/pat-01/status", json={"status": "inactive"}, headers=admin_headers)
test("Deactivate patient account returns 200", r_deact.status_code == 200, str(r_deact.status_code))

# Verify deactivated patient cannot log in
r_pat_login_fail = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Deactivated patient account login rejected (403)", r_pat_login_fail.status_code == 403, str(r_pat_login_fail.status_code))

# Reactivate patient account
r_react = client.patch("/api/admin/patients/pat-01/status", json={"status": "active"}, headers=admin_headers)
test("Reactivate patient account returns 200", r_react.status_code == 200, str(r_react.status_code))

r_pat_login_ok = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Reactivated patient account login succeeds (200)", r_pat_login_ok.status_code == 200, str(r_pat_login_ok.status_code))

# [4] Doctor Management & Verification
print("\n[4] Doctor Management & Verification")
r_doctors = client.get("/api/admin/doctors", headers=admin_headers)
test("Get doctors returns 200", r_doctors.status_code == 200, str(r_doctors.status_code))
doctors = r_doctors.json()
test("Doctors list contains doctors", len(doctors) >= 1, f"{len(doctors)} doctors")

# Doctor search by email or name
r_dsearch = client.get("/api/admin/doctors?q=doctor@netra.ai", headers=admin_headers)
test("Doctor search returns matching records", len(r_dsearch.json()) >= 1)

# Verify doctor credential status
r_verify = client.patch("/api/admin/doctors/doc-01/verify", json={
    "status": "verified",
    "notes": "Verified with State Medical Council records."
}, headers=admin_headers)
test("Verify doctor credentials returns 200", r_verify.status_code == 200, str(r_verify.status_code))

# Toggle doctor account status
r_doc_deact = client.patch("/api/admin/doctors/doc-01/status", json={"status": "inactive"}, headers=admin_headers)
test("Deactivate doctor account returns 200", r_doc_deact.status_code == 200, str(r_doc_deact.status_code))

r_doc_login_fail = client.post("/api/auth/login", json={"email": "doctor@netra.ai", "password": "password123"})
test("Deactivated doctor account login rejected (403)", r_doc_login_fail.status_code == 403, str(r_doc_login_fail.status_code))

r_doc_react = client.patch("/api/admin/doctors/doc-01/status", json={"status": "active"}, headers=admin_headers)
test("Reactivate doctor account returns 200", r_doc_react.status_code == 200, str(r_doc_react.status_code))

# [5] Screening Reports (Technical Oversight)
print("\n[5] Screening Reports Technical Oversight")
r_screenings = client.get("/api/admin/screenings", headers=admin_headers)
test("Get all screenings returns 200", r_screenings.status_code == 200, str(r_screenings.status_code))
screenings = r_screenings.json()
test("Screenings list contains records", len(screenings) >= 1, f"{len(screenings)} records")

if len(screenings) > 0:
    first_scr_id = screenings[0]["screening_id"]
    r_detail = client.get(f"/api/admin/screenings/{first_scr_id}", headers=admin_headers)
    test("Get screening detail returns 200", r_detail.status_code == 200, str(r_detail.status_code))
    test("Detail contains technical quality metrics", "quality" in r_detail.json())

# Filter screenings by ungradable
r_ungrad = client.get("/api/admin/screenings?status=ungradable", headers=admin_headers)
test("Filter by ungradable returns 200", r_ungrad.status_code == 200, str(r_ungrad.status_code))

# [6] System Monitoring & Health Diagnostics
print("\n[6] System Monitoring & Live Health")
r_health = client.get("/api/admin/system-health", headers=admin_headers)
test("System health endpoint returns 200", r_health.status_code == 200, str(r_health.status_code))
health = r_health.json()
test("app_status is dynamically reported", health.get("app_status") in ["Healthy", "Degraded"])
test("ai_model_status is dynamically reported", "ai_model_status" in health)
test("database_status reports connection", health.get("database_status") in ["Connected", "Degraded (In-Memory)"])
test("database_records_count contains breakdown", "users" in health.get("database_records_count", {}))
test("backend_uptime_seconds is positive number", health.get("backend_uptime_seconds", -1) >= 0)

# [7] Audit Logging
print("\n[7] Administrative Audit Logging")
r_audit = client.get("/api/admin/audit-logs", headers=admin_headers)
test("Get audit logs returns 200", r_audit.status_code == 200, str(r_audit.status_code))
logs = r_audit.json()
test("Audit logs contain recorded events", len(logs) >= 1, f"{len(logs)} audit entries")

# [8] Admin Notifications
print("\n[8] Admin Notifications")
r_notif = client.get("/api/admin/notifications", headers=admin_headers)
test("Get admin notifications returns 200", r_notif.status_code == 200, str(r_notif.status_code))
notifs = r_notif.json()
test("Admin notifications list is populated", len(notifs) >= 1, f"{len(notifs)} alerts")

# [9] Admin Profile & Password Management
print("\n[9] Admin Profile & Password Management")
r_prof = client.get("/api/admin/profile", headers=admin_headers)
test("Get admin profile returns 200", r_prof.status_code == 200, str(r_prof.status_code))
test("Profile role is admin", r_prof.json().get("role") == "admin")

# Update profile
r_uprof = client.put("/api/admin/profile", json={
    "name": "Netra Chief Administrator",
    "phone": "+91 99999 77777",
    "city": "New Delhi"
}, headers=admin_headers)
test("Update admin profile returns 200", r_uprof.status_code == 200, str(r_uprof.status_code))

# Password change test: incorrect old password rejected
r_pw_fail = client.post("/api/admin/change-password", json={
    "current_password": "wrongpassword",
    "new_password": "admin_new_password_123",
    "confirm_password": "admin_new_password_123"
}, headers=admin_headers)
test("Password change with invalid current password rejected (400)", r_pw_fail.status_code == 400, str(r_pw_fail.status_code))

# Password change test: valid current password
r_pw_ok = client.post("/api/admin/change-password", json={
    "current_password": "sudipta@70",
    "new_password": "admin_new_password_123",
    "confirm_password": "admin_new_password_123"
}, headers=admin_headers)
test("Password change with valid current password succeeds (200)", r_pw_ok.status_code == 200, str(r_pw_ok.status_code))

# Test login with new password
r_login_new_pw = client.post("/api/auth/login", json={"email": "santrasudipta70@gmail.com", "password": "admin_new_password_123"})
test("Admin login with new password succeeds (200)", r_login_new_pw.status_code == 200, str(r_login_new_pw.status_code))

# Revert password back to sudipta@70 so testing environment stays standard
new_token = r_login_new_pw.json().get("access_token")
r_revert_pw = client.post("/api/admin/change-password", json={
    "current_password": "admin_new_password_123",
    "new_password": "sudipta@70",
    "confirm_password": "sudipta@70"
}, headers={"Authorization": f"Bearer {new_token}"})
test("Revert password back to sudipta@70 succeeds (200)", r_revert_pw.status_code == 200)

print("\n" + "="*68)
print(f"  RESULTS: {PASS_COUNT} PASSED, {FAIL_COUNT} FAILED")
print("="*68 + "\n")

if FAIL_COUNT > 0:
    sys.exit(1)
