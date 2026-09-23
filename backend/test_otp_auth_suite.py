"""
Netra AI -- OTP Authentication Test Suite
Tests 13 scenarios for OTP registration and forgot-password flows.
Run: python test_otp_auth_suite.py
"""

import json
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
print("  Netra AI — OTP Auth Test Suite")
print("="*64)

# ── 1. Register via Email: Request OTP ───────────────────────────────────────
print("\n[1] Register via Email — Request OTP")
r = client.post("/api/auth/register/request-otp", json={
    "name": "Test User OTP",
    "destination": "otptest@netra.ai",
    "destination_type": "email",
    "password": "testpass123",
    "confirm_password": "testpass123",
})
test("Request OTP returns 200", r.status_code == 200, str(r.status_code))
data = r.json()
test("Response has success=True", data.get("success") == True)
test("Response has cooldown_seconds=60", data.get("cooldown_seconds") == 60)
msg = data.get("message", "")
test("Message contains DEV OTP (no email provider configured)", "[DEV: OTP=" in msg, msg[:80])
# Extract dev OTP
dev_otp_reg = ""
if "[DEV: OTP=" in msg:
    dev_otp_reg = msg.split("[DEV: OTP=")[1].split("]")[0]
print(f"  ℹ️  Dev OTP captured: {dev_otp_reg}")

# ── 2. Register via Email: Duplicate Detection before OTP ────────────────────
print("\n[2] Register via Email — Resend Cooldown")
r2 = client.post("/api/auth/register/request-otp", json={
    "name": "Test User OTP",
    "destination": "otptest@netra.ai",
    "destination_type": "email",
    "password": "testpass123",
})
test("Resend within 60s → 429", r2.status_code == 429, str(r2.status_code))

# ── 3. Register via Email: Wrong OTP ─────────────────────────────────────────
print("\n[3] Register via Email — Wrong OTP")
r3 = client.post("/api/auth/register/verify-otp", json={
    "destination": "otptest@netra.ai",
    "destination_type": "email",
    "otp": "000000",
})
test("Wrong OTP → 400", r3.status_code == 400, str(r3.status_code))
test("Error mentions 'Invalid code'", "Invalid code" in r3.json().get("detail", ""), r3.json().get("detail", "")[:80])

# ── 4. Register via Email: Correct OTP → Account Created ─────────────────────
print("\n[4] Register via Email — Correct OTP → Account Created")
if dev_otp_reg:
    r4 = client.post("/api/auth/register/verify-otp", json={
        "destination": "otptest@netra.ai",
        "destination_type": "email",
        "otp": dev_otp_reg,
    })
    test("Verify OTP → 200", r4.status_code == 200, str(r4.status_code))
    d4 = r4.json()
    test("Returns access_token", bool(d4.get("access_token")))
    test("Returns user email", d4.get("user", {}).get("email") == "otptest@netra.ai")
    token_reg = d4.get("access_token", "")
else:
    print("  ⚠️  Skipping — no dev OTP captured")
    token_reg = ""

# ── 5. Register via Email: Duplicate Account Detection ───────────────────────
print("\n[5] Register via Email — Duplicate Detection (post-creation)")
r5 = client.post("/api/auth/register/request-otp", json={
    "name": "Duplicate",
    "destination": "otptest@netra.ai",
    "destination_type": "email",
    "password": "testpass123",
})
test("Duplicate email → 400", r5.status_code == 400, str(r5.status_code))
test("Error mentions 'already exists'", "already exists" in r5.json().get("detail", "").lower(), r5.json().get("detail", "")[:60])

# ── 6. Register via Phone: Request OTP ───────────────────────────────────────
print("\n[6] Register via Phone -- Request OTP")
import random
unique_phone = f"+91{random.randint(7000000000, 9999999999)}"
r6 = client.post("/api/auth/register/request-otp", json={
    "name": "Phone User",
    "destination": unique_phone,
    "destination_type": "phone",
    "password": "phonepass123",
    "country_code": "+91",
})
test("Phone OTP request -> 200", r6.status_code == 200, str(r6.status_code))
msg6 = r6.json().get("message", "")
dev_otp_phone = ""
if "[DEV: OTP=" in msg6:
    dev_otp_phone = msg6.split("[DEV: OTP=")[1].split("]")[0]
print(f"  [i] Phone Dev OTP captured: {dev_otp_phone}  phone={unique_phone}")

# ── 7. Register via Phone: Verify OTP -> Account Created ──────────────────────
print("\n[7] Register via Phone -- Verify OTP")
if dev_otp_phone:
    r7 = client.post("/api/auth/register/verify-otp", json={
        "destination": unique_phone,
        "destination_type": "phone",
        "otp": dev_otp_phone,
    })
    test("Phone verify -> 200", r7.status_code == 200, str(r7.status_code))
    d7 = r7.json()
    test("Returns phone user token", bool(d7.get("access_token")))
    test("User has phone, no email", d7.get("user", {}).get("phone") == unique_phone and d7.get("user", {}).get("email") is None)
else:
    print("  [skip] Skipping -- no dev OTP captured")

# ── 8. Forgot Password via Email: Generic response for unknown account ────────
print("\n[8] Forgot Password — Generic response for unknown email")
r8 = client.post("/api/auth/forgot-password/request-otp", json={
    "destination": "doesnotexist@nowhere.com",
    "destination_type": "email",
})
test("Unknown email → 200 (anti-enumeration)", r8.status_code == 200, str(r8.status_code))
d8 = r8.json()
test("success=True even for unknown", d8.get("success") == True)

# ── 9. Forgot Password via Email: Known account sends OTP ────────────────────
print("\n[9] Forgot Password — Known account receives OTP")
r9 = client.post("/api/auth/forgot-password/request-otp", json={
    "destination": "patient@netra.ai",
    "destination_type": "email",
})
test("Known account → 200", r9.status_code == 200, str(r9.status_code))
msg9 = r9.json().get("message", "")
dev_otp_fp = ""
if "[DEV: OTP=" in msg9:
    dev_otp_fp = msg9.split("[DEV: OTP=")[1].split("]")[0]
print(f"  ℹ️  Forgot-password Dev OTP: {dev_otp_fp}")

# ── 10. Forgot Password: Wrong OTP ───────────────────────────────────────────
print("\n[10] Forgot Password — Wrong OTP")
r10 = client.post("/api/auth/forgot-password/reset", json={
    "destination": "patient@netra.ai",
    "destination_type": "email",
    "otp": "000000",
    "new_password": "newpass123",
})
test("Wrong OTP → 400", r10.status_code == 400, str(r10.status_code))

# ── 11. Forgot Password: Correct OTP → Password Reset ────────────────────────
print("\n[11] Forgot Password — Correct OTP resets password")
if dev_otp_fp:
    r11 = client.post("/api/auth/forgot-password/reset", json={
        "destination": "patient@netra.ai",
        "destination_type": "email",
        "otp": dev_otp_fp,
        "new_password": "newpatientpass123",
        "confirm_password": "newpatientpass123",
    })
    test("Correct OTP → 200", r11.status_code == 200, str(r11.status_code))
    test("success=True", r11.json().get("success") == True)
    
    # Verify new password works
    r11b = client.post("/api/auth/login", json={"email": "patient@netra.ai", "password": "newpatientpass123"})
    test("Login with new password works", r11b.status_code == 200, str(r11b.status_code))
    
    # Restore original password
    from app.core.database import db
    from app.core.security import hash_password
    pat_user = db.find_user_by_email("patient@netra.ai")
    if pat_user:
        pat_user["password_hash"] = hash_password("password123")
        db.save()
        print("  ℹ️  Restored original password (password123)")
else:
    print("  ⚠️  Skipping — no dev OTP captured")

# ── 12. Password mismatch in forgot password reset ────────────────────────────
print("\n[12] Forgot Password — Password mismatch validation")
# First, request a new OTP
r12_req = client.post("/api/auth/forgot-password/request-otp", json={
    "destination": "doctor@netra.ai",
    "destination_type": "email",
})
msg12 = r12_req.json().get("message", "")
dev_otp_12 = msg12.split("[DEV: OTP=")[1].split("]")[0] if "[DEV: OTP=" in msg12 else ""
if dev_otp_12:
    r12 = client.post("/api/auth/forgot-password/reset", json={
        "destination": "doctor@netra.ai",
        "destination_type": "email",
        "otp": dev_otp_12,
        "new_password": "newpass123",
        "confirm_password": "DIFFERENT456",
    })
    test("Mismatched passwords → 400", r12.status_code == 400, str(r12.status_code))
else:
    print("  ⚠️  Skipping — no dev OTP")

# ── 13. Existing login still works (backward compat) ─────────────────────────
print("\n[13] Backward Compatibility — Old login still works")
r13 = client.post("/api/auth/login", json={"email": "santrasudipta70@gmail.com", "password": "sudipta@70"})
test("santrasudipta70@gmail.com login → 200", r13.status_code == 200, str(r13.status_code))
d13 = r13.json()
test("Returns admin token", bool(d13.get("access_token")))
test("Role is admin", d13.get("user", {}).get("role") == "admin")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*64)
total = PASS_COUNT + FAIL_COUNT
print(f"  Results: {PASS_COUNT}/{total} tests passed")
if FAIL_COUNT > 0:
    print(f"  ❌ {FAIL_COUNT} test(s) FAILED")
    sys.exit(1)
else:
    print("  ✅ All tests PASSED")
    sys.exit(0)
