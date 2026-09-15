"""
Netra AI -- Simplified Registration Test Suite
Verifies single Email/Phone identifier registration without OTP.
Run: python test_simplified_registration.py
"""

import os
import sys
import io
import uuid

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
print("  Netra AI -- Simplified Registration Test Suite")
print("="*64)

# 1. Register with Email identifier
print("\n[1] Register with Email Identifier")
uid1 = uuid.uuid4().hex[:6]
email1 = f"patient_{uid1}@netra.ai"
r1 = client.post("/api/auth/register", json={
    "name": f"Patient {uid1}",
    "identifier": email1,
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "patient"
})
test("Email registration succeeds -> 200", r1.status_code == 200, str(r1.status_code))
d1 = r1.json()
test("Returns access_token", bool(d1.get("access_token")))
test("User email is set correctly", d1.get("user", {}).get("email") == email1.lower())
test("User role is patient", d1.get("user", {}).get("role") == "patient")
token1 = d1.get("access_token")

# Check profile & welcome notification created automatically
prof1 = client.get("/api/profile/me", headers={"Authorization": f"Bearer {token1}"})
test("Profile created automatically", prof1.status_code == 200 and prof1.json().get("full_name") == f"Patient {uid1}")
notif1 = client.get("/api/notifications", headers={"Authorization": f"Bearer {token1}"})
test("Welcome notification created automatically", notif1.status_code == 200 and len(notif1.json()) >= 1)

# 2. Register with Phone identifier
print("\n[2] Register with Phone Identifier")
uid2 = uuid.uuid4().hex[:6]
phone2 = f"+9198{uid2[:8].ljust(8, '0')}"
# Ensure digits
phone_digits = "".join(c for c in uid2 if c.isdigit())[:6].ljust(6, '9')
phone2 = f"+919812{phone_digits}"
r2 = client.post("/api/auth/register", json={
    "name": f"Phone User {uid2}",
    "identifier": phone2,
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "patient"
})
test("Phone registration succeeds -> 200", r2.status_code == 200, str(r2.status_code))
d2 = r2.json()
test("User phone is set correctly", d2.get("user", {}).get("phone") == phone2)
test("User email is None", d2.get("user", {}).get("email") is None)

# 3. Register as Doctor role
print("\n[3] Register as Doctor Role")
uid3 = uuid.uuid4().hex[:6]
email3 = f"doctor_{uid3}@netra.ai"
r3 = client.post("/api/auth/register", json={
    "name": f"Dr. Specialist {uid3}",
    "identifier": email3,
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "doctor"
})
test("Doctor registration succeeds -> 200", r3.status_code == 200, str(r3.status_code))
d3 = r3.json()
test("User role is doctor", d3.get("user", {}).get("role") == "doctor")

# 4. Invalid identifier format
print("\n[4] Invalid Identifier Format Check")
r4 = client.post("/api/auth/register", json={
    "name": "Invalid Contact",
    "identifier": "not_an_email_or_phone",
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "patient"
})
test("Invalid identifier rejected -> 400", r4.status_code == 400, str(r4.status_code))
test("Clear validation error message", "valid email address or phone number" in r4.json().get("detail", ""))

# 5. Duplicate Email check
print("\n[5] Duplicate Email Rejection")
r5 = client.post("/api/auth/register", json={
    "name": "Duplicate User",
    "identifier": email1,
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "patient"
})
test("Duplicate email rejected -> 400", r5.status_code == 400, str(r5.status_code))
test("Duplicate email error detail", "already exists" in r5.json().get("detail", "").lower())

# 6. Duplicate Phone check
print("\n[6] Duplicate Phone Rejection")
r6 = client.post("/api/auth/register", json={
    "name": "Duplicate Phone User",
    "identifier": phone2,
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "patient"
})
test("Duplicate phone rejected -> 400", r6.status_code == 400, str(r6.status_code))
test("Duplicate phone error detail", "already exists" in r6.json().get("detail", "").lower())

# 7. Password mismatch check
print("\n[7] Password Mismatch Check")
r7 = client.post("/api/auth/register", json={
    "name": "Mismatch User",
    "identifier": f"mismatch_{uuid.uuid4().hex[:4]}@netra.ai",
    "password": "Password123!",
    "confirm_password": "DifferentPassword456!",
    "role": "patient"
})
test("Password mismatch rejected -> 400", r7.status_code == 400, str(r7.status_code))
test("Mismatch error detail", "do not match" in r7.json().get("detail", "").lower())

# 8. Password length check (< 6 chars)
print("\n[8] Short Password Check")
r8 = client.post("/api/auth/register", json={
    "name": "Short Pw User",
    "identifier": f"short_{uuid.uuid4().hex[:4]}@netra.ai",
    "password": "123",
    "confirm_password": "123",
    "role": "patient"
})
test("Short password rejected (400 or 422)", r8.status_code in (400, 422), str(r8.status_code))

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*64)
total = PASS_COUNT + FAIL_COUNT
print(f"  Results: {PASS_COUNT}/{total} tests passed")
if FAIL_COUNT > 0:
    print(f"  ❌ {FAIL_COUNT} test(s) FAILED")
    sys.exit(1)
else:
    print("  ✅ All simplified registration tests PASSED")
    sys.exit(0)
