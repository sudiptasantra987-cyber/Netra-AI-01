import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db

client = TestClient(app)

def test_user_isolation_and_notifications():
    print("--- Starting User Isolation & Notification Test Suite ---")
    
    # 1. Register User A (Alice)
    email_a = f"alice_{os.urandom(3).hex()}@netra.ai"
    phone_a = f"+91 91{os.urandom(4).hex()[:8]}"
    # make phone pure digits with +91
    digits_suffix = "".join(c for c in str(os.urandom(5).hex()) if c.isdigit())[:8].ljust(8, '0')
    phone_a = f"+91 91{digits_suffix}"
    
    res_a = client.post("/api/auth/register", json={
        "name": "Alice Wonderland",
        "email": email_a,
        "phone": phone_a,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    })
    assert res_a.status_code == 200, f"Alice registration failed: {res_a.text}"
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"? User A registered with ID: {user_a_id}")
    
    # Check Alice's initial profile
    prof_res_a = client.get("/api/profile/me", headers=headers_a)
    assert prof_res_a.status_code == 200
    prof_a = prof_res_a.json()
    assert prof_a["user_id"] == user_a_id
    assert prof_a["full_name"] == "Alice Wonderland"
    assert prof_a["address"] == ""
    assert prof_a["bio"] == ""
    print("? User A initial empty profile verified.")
    
    # Check Alice's initial welcome notification
    notif_res_a = client.get("/api/notifications", headers=headers_a)
    assert notif_res_a.status_code == 200
    notifs_a = notif_res_a.json()
    assert len(notifs_a) == 1, f"Expected 1 notification for Alice, got {len(notifs_a)}"
    assert notifs_a[0]["type"] == "profile_completion"
    assert notifs_a[0]["is_read"] is False
    assert "complete your profile" in notifs_a[0]["message"].lower()
    notif_a_id = notifs_a[0]["id"]
    print("? User A single welcome notification created with type profile_completion and is_read=False.")
    
    # 2. Register User B (Bob)
    digits_b = "".join(c for c in str(os.urandom(5).hex()) if c.isdigit())[:8].ljust(8, '1')
    email_b = f"bob_{os.urandom(3).hex()}@netra.ai"
    phone_b = f"+91 92{digits_b}"
    res_b = client.post("/api/auth/register", json={
        "name": "Bob Builder",
        "email": email_b,
        "phone": phone_b,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    })
    assert res_b.status_code == 200, f"Bob registration failed: {res_b.text}"
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"? User B registered with ID: {user_b_id}")
    assert user_a_id != user_b_id
    
    # Check Bob's initial profile
    prof_res_b = client.get("/api/profile/me", headers=headers_b)
    assert prof_res_b.status_code == 200
    prof_b = prof_res_b.json()
    assert prof_b["user_id"] == user_b_id
    assert prof_b["full_name"] == "Bob Builder"
    print("? User B separate profile verified.")
    
    # Check Bob's notifications
    notif_res_b = client.get("/api/notifications", headers=headers_b)
    assert notif_res_b.status_code == 200
    notifs_b = notif_res_b.json()
    assert len(notifs_b) == 1
    assert notifs_b[0]["user_id"] == user_b_id
    assert notifs_b[0]["is_read"] is False
    notif_b_id = notifs_b[0]["id"]
    assert notif_a_id != notif_b_id
    print("? User B separate welcome notification verified.")
    
    # 3. Test Cross-User Isolation (User A cannot tamper with User B's notification)
    tamper_res = client.patch(f"/api/notifications/{notif_b_id}/read", headers=headers_a)
    assert tamper_res.status_code == 404, "User A should not be able to mark User B's notification read"
    print("? Cross-user notification tampering properly blocked with HTTP 404.")
    
    # 4. User A Updates Profile
    update_res_a = client.put("/api/profile/me", headers=headers_a, json={
        "full_name": "Alice W. Carroll",
        "date_of_birth": "1992-05-14",
        "gender": "Female",
        "address": "42 Rabbit Hole Lane",
        "city": "Oxford",
        "state": "Oxfordshire",
        "pin_code": "OX1 1AA",
        "bio": "Researching ocular biomarkers and visual health."
    })
    assert update_res_a.status_code == 200
    updated_a = update_res_a.json()
    assert updated_a["full_name"] == "Alice W. Carroll"
    assert updated_a["city"] == "Oxford"
    assert updated_a["pin_code"] == "OX1 1AA"
    print("? User A profile updated successfully.")
    
    # Verify User A's profile completion notification is now automatically marked as read
    notifs_a_after = client.get("/api/notifications", headers=headers_a).json()
    assert notifs_a_after[0]["is_read"] is True, "Profile completion notification should be marked read automatically"
    print("? User A profile completion notification automatically marked as read upon profile save.")
    
    # 5. Verify User B is completely unaffected
    prof_b_after = client.get("/api/profile/me", headers=headers_b).json()
    assert prof_b_after["full_name"] == "Bob Builder"
    assert prof_b_after["address"] == ""
    assert prof_b_after["city"] != "Oxford"
    
    notifs_b_after = client.get("/api/notifications", headers=headers_b).json()
    assert notifs_b_after[0]["is_read"] is False, "Bob's notification must remain unread"
    print("? Strict data isolation verified: User B profile and notification untouched.")
    
    # 6. Verify Unauthorized Access without token is blocked
    no_auth_prof = client.get("/api/profile/me")
    assert no_auth_prof.status_code == 401
    no_auth_notif = client.get("/api/notifications")
    assert no_auth_notif.status_code == 401
    print("? Unauthenticated access strictly blocked with HTTP 401.")
    
    print("\n--- ALL USER ISOLATION & NOTIFICATION TESTS PASSED! ---")

if __name__ == "__main__":
    test_user_isolation_and_notifications()
