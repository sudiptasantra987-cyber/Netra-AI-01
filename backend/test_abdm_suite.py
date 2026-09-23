"""
Netra AI -- ABDM & Ayushman Card Integration Test Suite
Tests format validation, demo mode, masking, consent, and user isolation.
Run: python test_abdm_suite.py
"""

import sys
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    from starlette.testclient import TestClient
except ImportError:
    from fastapi.testclient import TestClient

from app.main import app

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

print("\n" + "="*64)
print("  Netra AI -- ABDM & Ayushman Card Test Suite")
print("="*64)

# 1. Login seed patient
print("\n[1] Authenticate Test Patient")
r_login = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "password123"})
test("Patient login succeeds", r_login.status_code == 200, str(r_login.status_code))
patient_token = r_login.json().get("access_token")
patient_headers = {"Authorization": f"Bearer {patient_token}"}

# 2. Login seed doctor (for user isolation test)
r_doc_login = client.post("/api/auth/login", json={"email": "doctor@netra.ai", "password": "password123"})
test("Doctor login succeeds", r_doc_login.status_code == 200, str(r_doc_login.status_code))
doc_token = r_doc_login.json().get("access_token")
doc_headers = {"Authorization": f"Bearer {doc_token}"}

# 3. GET /api/abdm/card requires authentication
print("\n[2] Unauthorized Access Check")
r_unauth = client.get("/api/abdm/card")
test("GET /api/abdm/card without auth -> 401", r_unauth.status_code == 401, str(r_unauth.status_code))

# 4. Clean up any existing card for patient
client.delete("/api/abdm/card", headers=patient_headers)

# 5. GET /api/abdm/card when unlinked
print("\n[3] Initial Unlinked State")
r_initial = client.get("/api/abdm/card", headers=patient_headers)
test("Unlinked card returns 200", r_initial.status_code == 200, str(r_initial.status_code))
data_initial = r_initial.json()
test("Card status is linked=False", data_initial.get("linked") == False)

# 6. POST /api/abdm/card/link missing consent -> 400
print("\n[4] Consent Enforcement")
r_no_consent = client.post("/api/abdm/card/link", json={
    "abha_id": "91-8273-1928-3482",
    "pmjay_id": "P12345678",
    "consent_given": False,
    "demo_mode": True
}, headers=patient_headers)
test("Missing consent -> 400", r_no_consent.status_code == 400, str(r_no_consent.status_code))
test("Consent error message returned", "Consent is required" in r_no_consent.json().get("detail", ""))

# 7. POST /api/abdm/card/link invalid ABHA ID format -> 400
print("\n[5] Format Validation: ABHA ID")
r_bad_abha = client.post("/api/abdm/card/link", json={
    "abha_id": "invalid-abha-123",
    "pmjay_id": "P12345678",
    "consent_given": True,
    "demo_mode": True
}, headers=patient_headers)
test("Invalid ABHA format -> 400", r_bad_abha.status_code == 400, str(r_bad_abha.status_code))
test("ABHA error message returned", "Invalid ABHA ID format" in r_bad_abha.json().get("detail", ""))

# 8. POST /api/abdm/card/link invalid PM-JAY ID format -> 400
print("\n[6] Format Validation: PM-JAY ID")
r_bad_pmjay = client.post("/api/abdm/card/link", json={
    "abha_id": "91-8273-1928-3482",
    "pmjay_id": "bad$$id",
    "consent_given": True,
    "demo_mode": True
}, headers=patient_headers)
test("Invalid PM-JAY format -> 400", r_bad_pmjay.status_code == 400, str(r_bad_pmjay.status_code))
test("PM-JAY error message returned", "Invalid PM-JAY" in r_bad_pmjay.json().get("detail", ""))

# 9. POST /api/abdm/card/link with valid 14-digit numeric ABHA ID & PM-JAY ID
print("\n[7] Successful Link in Demo Mode")
r_link = client.post("/api/abdm/card/link", json={
    "abha_id": "91-8273-1928-3482",
    "pmjay_id": "PMJAY12345678",
    "consent_given": True,
    "demo_mode": True
}, headers=patient_headers)
test("Valid link request -> 200", r_link.status_code == 200, str(r_link.status_code))
link_data = r_link.json()
test("Demo mode is marked True", link_data.get("demo_mode") == True)
test("ABHA ID is masked for privacy", link_data.get("abha_id_masked") == "••••-••••-3482", link_data.get("abha_id_masked"))
test("PM-JAY ID is masked for privacy", link_data.get("pmjay_id_masked") == "••••-••••-5678", link_data.get("pmjay_id_masked"))
test("Full ABHA ID is not exposed", "91-8273" not in str(link_data))
test("Beneficiary name is recorded", bool(link_data.get("beneficiary_name")))

# 10. GET /api/abdm/card when linked
print("\n[8] Verified Card Status")
r_status = client.get("/api/abdm/card", headers=patient_headers)
test("Card status -> 200", r_status.status_code == 200, str(r_status.status_code))
status_data = r_status.json()
test("Card status is linked=True", status_data.get("linked") == True)
test("Returned card has masked ABHA", status_data.get("card", {}).get("abha_id_masked") == "••••-••••-3482")

# 11. User Isolation: Doctor cannot see Patient's card
print("\n[9] User Isolation Check")
r_doc_card = client.get("/api/abdm/card", headers=doc_headers)
test("Doctor sees their own card status (linked=False)", r_doc_card.json().get("linked") == False)

# 12. Unlink / Remove card
print("\n[10] Remove Ayushman Card")
r_del = client.delete("/api/abdm/card", headers=patient_headers)
test("DELETE /api/abdm/card -> 200", r_del.status_code == 200, str(r_del.status_code))
test("Success message returned", r_del.json().get("success") == True)

# 13. Verify card is now unlinked
r_after_del = client.get("/api/abdm/card", headers=patient_headers)
test("Status after delete is linked=False", r_after_del.json().get("linked") == False)

# 14. Second delete returns 404 (not found)
r_del_again = client.delete("/api/abdm/card", headers=patient_headers)
test("Second delete returns 404", r_del_again.status_code == 404, str(r_del_again.status_code))

# 15. Also test ABHA address format (e.g. user@abdm)
print("\n[11] Link via ABHA Address Format (@abdm)")
r_link_addr = client.post("/api/abdm/card/link", json={
    "abha_id": "patient@abdm",
    "pmjay_id": "P98765432",
    "consent_given": True,
    "demo_mode": True
}, headers=patient_headers)
test("ABHA address link -> 200", r_link_addr.status_code == 200, str(r_link_addr.status_code))
test("ABHA address masked appropriately", "••••" in r_link_addr.json().get("abha_id_masked"))

# 16. Doctor cannot link Ayushman card (role check)
print("\n[12] Doctor Role Protection (Cannot Link Card)")
r_doctor_link = client.post("/api/abdm/card/link", json={
    "abha_id": "patient@abdm",
    "pmjay_id": "P98765432",
    "consent_given": True,
    "demo_mode": True
}, headers=doc_headers)
test("Doctor link attempt rejected with 403", r_doctor_link.status_code == 403, str(r_doctor_link.status_code))

# Clean up linked card from test patient
client.delete("/api/abdm/card", headers=patient_headers)

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*64)
total = PASS_COUNT + FAIL_COUNT
print(f"  Results: {PASS_COUNT}/{total} tests passed")
if FAIL_COUNT > 0:
    print(f"  ❌ {FAIL_COUNT} test(s) FAILED")
    sys.exit(1)
else:
    print("  ✅ All ABDM integration tests PASSED")
    sys.exit(0)
