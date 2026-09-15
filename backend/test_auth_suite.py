"""
Netra AI - Automated Authentication & User Verification Suite
Uses built-in urllib.request and json to test all 9 required test cases against live FastAPI server:
1. New user can register successfully
2. Existing user can log in with email and password
3. Existing user can log in with phone number and password
4. Incorrect credentials are rejected (wrong password, non-existent account)
5. Duplicate registration is prevented (duplicate email & duplicate phone)
6. Logged-in user session verification (/api/auth/me)
7. Route protection (unauthenticated access blocked)
8. Password reset flow (forgot password -> 6-digit code -> new password -> login)
9. Rate limiting & brute-force lockout protection
"""

import sys
import uuid
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    req_data = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=req_data, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
        
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"detail": body}
        return e.code, parsed
    except Exception as ex:
        return 500, {"detail": str(ex)}

def run_tests():
    print("=" * 70)
    print("NETRA AI - COMPREHENSIVE AUTHENTICATION VERIFICATION SUITE")
    print("=" * 70)
    
    unique_id = uuid.uuid4().hex[:6]
    test_email = f"user_{unique_id}@testnetra.ai"
    test_phone = f"+91 9831{unique_id[:5]}"
    test_password = "SecurePassword123!"
    
    # -------------------------------------------------------------
    # Test 1: New user can register successfully
    # -------------------------------------------------------------
    print("\n[TEST 1] Registering a new user...")
    reg_payload = {
        "name": f"Test Patient {unique_id}",
        "email": test_email,
        "phone": test_phone,
        "password": test_password,
        "confirm_password": test_password,
        "role": "patient",
        "city": "Kolkata"
    }
    status, reg_data = make_request("POST", "/auth/register", reg_payload)
    assert status == 200, f"Registration failed with status {status}: {reg_data}"
    assert "access_token" in reg_data, "access_token not found in registration response"
    assert reg_data["user"]["email"] == test_email.lower(), "Returned email does not match"
    print(f" PASS: User registered successfully (ID: {reg_data['user']['id']}, Token generated)")
    
    # -------------------------------------------------------------
    # Test 2: Existing user can log in with email and password
    # -------------------------------------------------------------
    print("\n[TEST 2] Logging in with email and password...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    status, login_data = make_request("POST", "/auth/login", login_payload)
    assert status == 200, f"Login failed with status {status}: {login_data}"
    auth_token = login_data["access_token"]
    assert auth_token, "No access token received"
    print(" PASS: Successfully logged in using email and password")

    # -------------------------------------------------------------
    # Test 3: Existing user can log in with phone number and password
    # -------------------------------------------------------------
    print("\n[TEST 3] Logging in with phone number and password...")
    phone_login_payload = {
        "email": test_phone,
        "password": test_password
    }
    status, phone_login_data = make_request("POST", "/auth/login", phone_login_payload)
    assert status == 200, f"Phone login failed with status {status}: {phone_login_data}"
    print(" PASS: Successfully logged in using phone number and password")

    # -------------------------------------------------------------
    # Test 4: Incorrect credentials are rejected
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing rejection of incorrect credentials...")
    # 4a. Wrong password
    status, bad_pw_data = make_request("POST", "/auth/login", {"email": test_email, "password": "WrongPassword999"})
    assert status == 401, f"Expected 401, got {status}: {bad_pw_data}"
    print(f" PASS: Wrong password rejected: {bad_pw_data.get('detail')}")

    # 4b. Unregistered user
    status, no_user_data = make_request("POST", "/auth/login", {"email": "nonexistent_999@test.com", "password": "somepassword"})
    assert status == 401, f"Expected 401, got {status}: {no_user_data}"
    print(f" PASS: Non-existent account rejected: {no_user_data.get('detail')}")

    # -------------------------------------------------------------
    # Test 5: Duplicate registration is prevented
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing duplicate registration prevention...")
    # 5a. Duplicate Email
    dup_email_payload = {
        "name": "Another User",
        "email": test_email, # same email
        "phone": "+91 99999 11111",
        "password": "Password123!"
    }
    status, dup_email_data = make_request("POST", "/auth/register", dup_email_payload)
    assert status == 400, f"Expected 400 for duplicate email, got {status}: {dup_email_data}"
    print(f" PASS: Duplicate email rejected: {dup_email_data.get('detail')}")

    # 5b. Duplicate Phone
    dup_phone_payload = {
        "name": "Another User",
        "email": f"unique_{uuid.uuid4().hex[:6]}@test.com",
        "phone": test_phone, # same phone
        "password": "Password123!"
    }
    status, dup_phone_data = make_request("POST", "/auth/register", dup_phone_payload)
    assert status == 400, f"Expected 400 for duplicate phone, got {status}: {dup_phone_data}"
    print(f" PASS: Duplicate phone rejected: {dup_phone_data.get('detail')}")

    # -------------------------------------------------------------
    # Test 6: Logged-in user session verification (/api/auth/me)
    # -------------------------------------------------------------
    print("\n[TEST 6] Verifying user session persistence via /api/auth/me...")
    status, me_data = make_request("GET", "/auth/me", token=auth_token)
    assert status == 200, f"Expected 200, got {status}: {me_data}"
    assert me_data["email"] == test_email.lower()
    print(f" PASS: Session verified! User: {me_data['name']} ({me_data['email']}, role: {me_data['role']})")

    # -------------------------------------------------------------
    # Test 7: Route protection (unauthenticated access rejected)
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing protected route enforcement...")
    # 7a. No token
    status, unauth_data = make_request("GET", "/auth/me")
    assert status == 401, f"Expected 401 without token, got {status}: {unauth_data}"
    print(" PASS: Unauthenticated access blocked (HTTP 401)")

    # 7b. Invalid token
    status, bad_token_data = make_request("GET", "/auth/me", token="FakeInvalidToken12345")
    assert status == 401, f"Expected 401 with invalid token, got {status}: {bad_token_data}"
    print(" PASS: Forged/invalid token blocked (HTTP 401)")

    # -------------------------------------------------------------
    # Test 8: Password reset flow
    # -------------------------------------------------------------
    print("\n[TEST 8] Testing forgot password and reset flow...")
    # 8a. Request reset code
    status, forgot_resp = make_request("POST", "/auth/forgot-password", {"identifier": test_email})
    assert status == 200, f"Forgot password failed with status {status}: {forgot_resp}"
    reset_code = forgot_resp.get("reset_code")
    assert reset_code and len(reset_code) == 6, f"Invalid code: {reset_code}"
    print(f" PASS: Reset code generated and sent: {reset_code}")

    # 8b. Submit reset password with new password
    new_password = "BrandNewPassword2026!"
    status, reset_resp = make_request("POST", "/auth/reset-password", {
        "identifier": test_email,
        "code": reset_code,
        "new_password": new_password,
        "confirm_password": new_password
    })
    assert status == 200, f"Reset password failed with status {status}: {reset_resp}"
    print(f" PASS: Password reset successful: {reset_resp.get('message')}")

    # 8c. Verify login with new password
    status, new_login_data = make_request("POST", "/auth/login", {"email": test_email, "password": new_password})
    assert status == 200, f"Login with new password failed with status {status}: {new_login_data}"
    print(" PASS: Successfully authenticated with the new password!")

    # 8d. Verify old password no longer works
    status, old_login_data = make_request("POST", "/auth/login", {"email": test_email, "password": test_password})
    assert status == 401, f"Old password should not work, got status {status}: {old_login_data}"
    print(" PASS: Old password was correctly invalidated")

    # -------------------------------------------------------------
    # Test 9: Brute-force rate limiting / Lockout protection
    # -------------------------------------------------------------
    print("\n[TEST 9] Testing brute-force rate limiting & lockout...")
    attacker_target = f"target_{uuid.uuid4().hex[:6]}@test.com"
    # Register target account
    status, reg_target = make_request("POST", "/auth/register", {
        "name": "Target Account",
        "email": attacker_target,
        "phone": f"+91 9988{uuid.uuid4().hex[:5]}",
        "password": "CorrectPassword123!"
    })
    assert status == 200, f"Could not register target account: {reg_target}"
    
    # Intentionally trigger 5 failed attempts
    locked = False
    for attempt in range(1, 7):
        status, attack_data = make_request("POST", "/auth/login", {"email": attacker_target, "password": "WrongPassword"})
        if status == 429:
            locked = True
            print(f" PASS: Lockout successfully triggered at attempt {attempt}: {attack_data.get('detail')}")
            break
    assert locked, "Expected account lockout (HTTP 429) after 5 consecutive failed attempts"

    print("\n" + "=" * 70)
    print("ALL 9 AUTHENTICATION & SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
