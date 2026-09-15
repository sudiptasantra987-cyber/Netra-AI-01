import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from app.core.security import hash_password

DB_FILE = Path(__file__).resolve().parent.parent.parent / "database" / "netra_store.json"
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

class NetraDatabase:
    def __init__(self):
        self.data: Dict[str, List[dict]] = {
            "users": [],
            "screenings": [],
            "appointments": [],
            "reports": [],
            "password_resets": [],
            "profiles": [],
            "notifications": [],
            "abdm_cards": [],
        }
        self.load()
        if not self.data["users"]:
            self.seed_defaults()
        else:
            self._ensure_bcrypt_seeds()

    def load(self):
        if DB_FILE.exists():
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    self.data.setdefault("users", [])
                    self.data.setdefault("screenings", [])
                    self.data.setdefault("appointments", [])
                    self.data.setdefault("reports", [])
                    self.data.setdefault("password_resets", [])
                    self.data.setdefault("profiles", [])
                    self.data.setdefault("notifications", [])
                    self.data.setdefault("abdm_cards", [])
                    self.data.setdefault("otp_records", [])
            except Exception:
                pass

    def save(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving DB: {e}")

    def _ensure_bcrypt_seeds(self):
        """Ensure seed accounts have valid bcrypt hashes."""
        updated = False
        for u in self.data["users"]:
            p_hash = u.get("password_hash", "")
            if not p_hash.startswith("$2b$") and not p_hash.startswith("$2a$"):
                if u.get("email") == "admin@netra.ai":
                    u["password_hash"] = hash_password("admin123")
                    updated = True
                else:
                    u["password_hash"] = hash_password("password123")
                    updated = True
        if updated:
            self.save()

    def seed_defaults(self):
        # Default Seed Patient
        self.data["users"].append({
            "id": "pat-01",
            "email": "patient@netra.ai",
            "password_hash": hash_password("password123"),
            "name": "Sunita Roy",
            "role": "patient",
            "age": 48,
            "gender": "Female",
            "phone": "+91 98301 23456",
            "city": "Kolkata",
            "specialization": None
        })
        
        # Default Seed Doctor (Dr. Ananya Sengupta)
        self.data["users"].append({
            "id": "doc-01",
            "email": "doctor@netra.ai",
            "password_hash": hash_password("password123"),
            "name": "Dr. Ananya Sengupta",
            "role": "doctor",
            "age": 44,
            "gender": "Female",
            "phone": "+91 98310 98765",
            "city": "Kolkata",
            "specialization": "Vitreo-Retinal Surgeon"
        })
        
        # Default Seed Admin
        self.data["users"].append({
            "id": "admin-01",
            "email": "admin@netra.ai",
            "password_hash": hash_password("admin123"),
            "name": "Netra Admin",
            "role": "admin",
            "age": 35,
            "gender": "Other",
            "phone": "+91 99999 88888",
            "city": "New Delhi",
            "specialization": "Clinical AI Governance"
        })
        
        # Seed an initial screening for Sunita Roy so history & trends have baseline data
        self.data["screenings"].append({
            "screening_id": "scr-baseline-01",
            "patient_id": "pat-01",
            "patient_name": "Sunita Roy",
            "timestamp": "2026-06-15T10:30:00",
            "date": "2026-06-15",
            "image_url": "/sample_images/normal_retina.jpg",
            "primary_condition": "Normal Eye Anatomy",
            "primary_confidence": 91.5,
            "risk_level": "Low Risk",
            "risk_score": 12.0,
            "clinical_recommendation": "Baseline fundus examination normal. Annual follow-up advised.",
            "quality": {
                "sharpness_score": 92.0,
                "brightness_score": 58.0,
                "contrast_score": 68.0,
                "noise_level": 8.0,
                "resolution_ok": True,
                "width": 1024,
                "height": 1024,
                "composite_quality": 89.5,
                "is_suitable": True,
                "status_label": "Excellent",
                "rejection_reasons": [],
                "guidance": "High quality baseline image."
            },
            "gradcam_image_base64": None,
            "affected_quadrants": ["Uniform Physiological Distribution"]
        })
        
        # Seed an initial appointment
        self.data["appointments"].append({
            "appointment_id": "apt-seed-101",
            "patient_id": "pat-01",
            "patient_name": "Sunita Roy",
            "doctor_id": "doc-01",
            "doctor_name": "Dr. Ananya Sengupta",
            "doctor_specialization": "Vitreo-Retinal Surgeon",
            "hospital": "Sankara Nethralaya",
            "date": "2026-09-15",
            "time_slot": "10:15 AM",
            "status": "Confirmed",
            "reason": "Preventative diabetic retinal evaluation",
            "screening_id": "scr-baseline-01",
            "screening_summary": "Normal Eye Anatomy (Low Risk, 12.0 Score)",
            "doctor_notes": "Initial consultation booked. Dilated fundoscopy planned.",
            "created_at": datetime.now().isoformat()
        })
        
        self.save()

    @staticmethod
    def normalize_phone_digits(phone: Optional[str]) -> str:
        if not phone:
            return ""
        return "".join(c for c in phone if c.isdigit())

    def find_user_by_email(self, email: str) -> Optional[dict]:
        clean_email = email.strip().lower()
        for u in self.data["users"]:
            user_email = (u.get("email") or "").strip().lower()
            if user_email and user_email == clean_email:
                return u
        return None

    def find_user_by_phone(self, phone: str) -> Optional[dict]:
        digits = self.normalize_phone_digits(phone)
        if not digits:
            return None
        for u in self.data["users"]:
            u_digits = self.normalize_phone_digits(u.get("phone"))
            if not u_digits:
                continue
            if digits == u_digits or (len(digits) >= 10 and len(u_digits) >= 10 and digits[-10:] == u_digits[-10:]):
                return u
        return None

    def find_user_by_identifier(self, identifier: str) -> Optional[dict]:
        clean_id = identifier.strip().lower()
        user = self.find_user_by_email(clean_id)
        if user:
            return user
        return self.find_user_by_phone(clean_id)

    def save_reset_code(self, user_id: str, identifier: str, code: str, expires_minutes: int = 15) -> dict:
        now = datetime.now()
        expires_at = now.timestamp() + (expires_minutes * 60)
        reset_entry = {
            "reset_id": f"rst-{os.urandom(4).hex()}",
            "user_id": user_id,
            "identifier": identifier.strip().lower(),
            "code": code.strip(),
            "expires_at": expires_at,
            "used": False,
            "created_at": now.isoformat()
        }
        self.data.setdefault("password_resets", []).append(reset_entry)
        self.save()
        return reset_entry

    def get_valid_reset_code(self, identifier: str, code: str) -> Optional[dict]:
        clean_id = identifier.strip().lower()
        clean_code = code.strip()
        now_ts = datetime.now().timestamp()
        
        for entry in reversed(self.data.get("password_resets", [])):
            if not entry.get("used") and entry.get("code") == clean_code:
                entry_id = entry.get("identifier", "").lower()
                if entry_id == clean_id or (
                    self.normalize_phone_digits(entry_id) and 
                    self.normalize_phone_digits(entry_id) == self.normalize_phone_digits(clean_id)
                ):
                    if entry.get("expires_at", 0) >= now_ts:
                        return entry
        return None

    def mark_reset_code_used(self, reset_id: str):
        for entry in self.data.get("password_resets", []):
            if entry.get("reset_id") == reset_id:
                entry["used"] = True
                break
        self.save()

    def update_user_password(self, user_id: str, new_password_hash: str) -> bool:
        for u in self.data["users"]:
            if u.get("id") == user_id:
                u["password_hash"] = new_password_hash
                self.save()
                return True
        return False

    # Profile Management
    def get_profile(self, user_id: str) -> Optional[dict]:
        for p in self.data.get("profiles", []):
            if p.get("user_id") == user_id:
                return p
        return None

    def create_profile(self, user_id: str, initial_data: Optional[dict] = None) -> dict:
        existing = self.get_profile(user_id)
        if existing:
            return existing
        initial_data = initial_data or {}
        profile_entry = {
            "profile_id": f"prf-{os.urandom(4).hex()}",
            "user_id": user_id,
            "full_name": initial_data.get("full_name", ""),
            "profile_picture": initial_data.get("profile_picture", ""),
            "date_of_birth": initial_data.get("date_of_birth", ""),
            "gender": initial_data.get("gender", ""),
            "address": initial_data.get("address", ""),
            "city": initial_data.get("city", ""),
            "state": initial_data.get("state", ""),
            "pin_code": initial_data.get("pin_code", ""),
            "bio": initial_data.get("bio", ""),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self.data.setdefault("profiles", []).append(profile_entry)
        self.save()
        return profile_entry

    def update_profile(self, user_id: str, updates: dict) -> Optional[dict]:
        profile = self.get_profile(user_id)
        if not profile:
            profile = self.create_profile(user_id)
        
        for key, value in updates.items():
            if value is not None:
                profile[key] = value
        profile["updated_at"] = datetime.now().isoformat()

        # If full_name, gender, or city was updated, sync to user entry in "users"
        for u in self.data.get("users", []):
            if u.get("id") == user_id:
                if "full_name" in updates and updates["full_name"]:
                    u["name"] = updates["full_name"]
                if "gender" in updates:
                    u["gender"] = updates["gender"]
                if "city" in updates:
                    u["city"] = updates["city"]
                break

        self.save()
        return profile

    # Notification Management
    def get_notifications(self, user_id: str) -> List[dict]:
        user_notifs = [
            n for n in self.data.get("notifications", []) 
            if n.get("user_id") == user_id
        ]
        return sorted(user_notifs, key=lambda x: x.get("created_at", ""), reverse=True)

    def add_notification(
        self, 
        user_id: str, 
        title: str, 
        message: str, 
        type: str = "info", 
        action_url: Optional[str] = None
    ) -> dict:
        notif = {
            "id": f"notif-{os.urandom(4).hex()}",
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "is_read": False,
            "created_at": datetime.now().isoformat(),
            "action_url": action_url
        }
        self.data.setdefault("notifications", []).append(notif)
        self.save()
        return notif

    def mark_notification_read(self, user_id: str, notification_id: str) -> bool:
        found = False
        for n in self.data.get("notifications", []):
            if n.get("id") == notification_id and n.get("user_id") == user_id:
                n["is_read"] = True
                found = True
                break
        if found:
            self.save()
        return found

    def mark_profile_completion_read(self, user_id: str) -> int:
        count = 0
        for n in self.data.get("notifications", []):
            if n.get("user_id") == user_id and n.get("type") == "profile_completion" and not n.get("is_read"):
                n["is_read"] = True
                count += 1
        if count > 0:
            self.save()
        return count

    def mark_all_notifications_read(self, user_id: str) -> int:
        count = 0
        for n in self.data.get("notifications", []):
            if n.get("user_id") == user_id and not n.get("is_read"):
                n["is_read"] = True
                count += 1
        if count > 0:
            self.save()
        return count

    # ─── ABDM Card Management ────────────────────────────────────────────────

    def get_abdm_card(self, user_id: str) -> Optional[dict]:
        """Return the active ABDM card record for a user, or None."""
        for card in self.data.get("abdm_cards", []):
            if card.get("user_id") == user_id and not card.get("removed"):
                return card
        return None

    def link_abdm_card(
        self,
        user_id: str,
        abha_id: str,
        pmjay_id: Optional[str],
        beneficiary_name: Optional[str],
        demo_mode: bool = True,
    ) -> dict:
        """
        Save ABDM/PM-JAY card details for a user.
        IDs are stored; full IDs are never logged in plain.
        Only 4 digits of each ID are stored for display masking.
        """
        # Remove any existing active card first
        for card in self.data.get("abdm_cards", []):
            if card.get("user_id") == user_id and not card.get("removed"):
                card["removed"] = True

        card = {
            "card_id": f"abdm-{os.urandom(5).hex()}",
            "user_id": user_id,
            # Store last 4 chars only for display — never log/display full IDs
            "abha_id_masked": self._mask_id(abha_id),
            "pmjay_id_masked": self._mask_id(pmjay_id) if pmjay_id else None,
            # Hashed for integrity check but never returned to client in full
            "abha_id_hash": __import__("hashlib").sha256(abha_id.strip().encode()).hexdigest()[:16],
            "beneficiary_name": beneficiary_name or None,
            "demo_mode": demo_mode,
            "linked_at": datetime.now().isoformat(),
            "removed": False,
        }
        self.data.setdefault("abdm_cards", []).append(card)
        self.save()
        return card

    def remove_abdm_card(self, user_id: str) -> bool:
        """Soft-delete the user's ABDM card record."""
        changed = False
        for card in self.data.get("abdm_cards", []):
            if card.get("user_id") == user_id and not card.get("removed"):
                card["removed"] = True
                card["removed_at"] = datetime.now().isoformat()
                changed = True
        if changed:
            self.save()
        return changed

    @staticmethod
    def _mask_id(raw: str) -> str:
        """Return a display-safe masked version e.g. ••••-••••-1234."""
        if not raw:
            return ""
        clean = raw.replace("-", "").replace(" ", "")
        visible = clean[-4:] if len(clean) >= 4 else clean
        return f"••••-••••-{visible}"

    # ─── OTP Records ─────────────────────────────────────────────────────────


    def create_otp_record(
        self,
        destination: str,
        destination_type: str,   # "email" or "phone"
        purpose: str,             # "registration" or "forgot_password"
        otp_hash: str,
        temp_payload: dict = None,
        user_id: str = None
    ) -> dict:
        """Create a new OTP record, invalidating any previous active OTPs for the same destination+purpose."""
        import uuid
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        # Invalidate previous OTPs for same destination+purpose
        self.invalidate_otps_for(destination, purpose)
        record = {
            "otp_id": f"otp-{uuid.uuid4().hex[:12]}",
            "destination": destination.strip().lower(),
            "destination_type": destination_type,
            "purpose": purpose,
            "otp_hash": otp_hash,
            "temp_payload": temp_payload or {},
            "user_id": user_id,
            "created_at": now.isoformat(),
            "expires_at": (now.timestamp() + 300),   # 5 minutes
            "resend_cooldown_until": (now.timestamp() + 60),  # 60s cooldown
            "attempts": 0,
            "max_attempts": 5,
            "is_used": False,
        }
        self.data.setdefault("otp_records", []).append(record)
        self.save()
        return record

    def get_active_otp(self, destination: str, purpose: str):
        """Return the latest valid (not used, not expired) OTP for destination+purpose."""
        import time
        now = time.time()
        dest = destination.strip().lower()
        candidates = [
            r for r in self.data.get("otp_records", [])
            if r.get("destination") == dest
            and r.get("purpose") == purpose
            and not r.get("is_used")
            and r.get("expires_at", 0) > now
        ]
        if not candidates:
            return None
        return sorted(candidates, key=lambda x: x.get("created_at", ""), reverse=True)[0]

    def verify_otp_and_consume(self, destination: str, purpose: str, plain_otp: str) -> dict:
        """
        Verify the OTP.
        Returns dict with 'status': 'ok' | 'invalid' | 'expired' | 'max_attempts' | 'not_found'
        On 'ok', marks the record as used.
        """
        from app.core.security import verify_otp_hash
        import time
        now = time.time()
        dest = destination.strip().lower()
        record = self.get_active_otp(dest, purpose)
        if not record:
            # Check if expired record exists
            expired = [
                r for r in self.data.get("otp_records", [])
                if r.get("destination") == dest and r.get("purpose") == purpose
            ]
            if expired:
                return {"status": "expired"}
            return {"status": "not_found"}

        if record.get("attempts", 0) >= record.get("max_attempts", 5):
            return {"status": "max_attempts"}

        # Increment attempt
        record["attempts"] = record.get("attempts", 0) + 1
        self.save()

        if not verify_otp_hash(plain_otp, record["otp_hash"]):
            remaining = record.get("max_attempts", 5) - record["attempts"]
            return {"status": "invalid", "remaining": remaining}

        # Mark as used
        record["is_used"] = True
        self.save()
        return {"status": "ok", "record": record}

    def invalidate_otps_for(self, destination: str, purpose: str):
        """Mark all matching active OTPs as used (call before creating a new OTP)."""
        dest = destination.strip().lower()
        changed = False
        for r in self.data.get("otp_records", []):
            if r.get("destination") == dest and r.get("purpose") == purpose and not r.get("is_used"):
                r["is_used"] = True
                changed = True
        if changed:
            self.save()

    def check_resend_cooldown(self, destination: str, purpose: str) -> int:
        """Return seconds remaining in the 60s resend cooldown. 0 means user can resend."""
        import time
        now = time.time()
        dest = destination.strip().lower()
        candidates = [
            r for r in self.data.get("otp_records", [])
            if r.get("destination") == dest and r.get("purpose") == purpose
        ]
        if not candidates:
            return 0
        latest = sorted(candidates, key=lambda x: x.get("created_at", ""), reverse=True)[0]
        cooldown_until = latest.get("resend_cooldown_until", 0)
        remaining = int(cooldown_until - now)
        return max(0, remaining)

    def get_user_screenings(self, user_id: str) -> List[dict]:
        """Return all scans belonging strictly to user_id, newest first."""
        user_scans = [s for s in self.data.get("screenings", []) if s.get("patient_id") == user_id]
        return sorted(user_scans, key=lambda s: s.get("timestamp", ""), reverse=True)

    def get_screening(self, screening_id: str) -> Optional[dict]:
        """Find a screening record by unique ID."""
        for s in self.data.get("screenings", []):
            if s.get("screening_id") == screening_id:
                return s
        return None

    def delete_screening(self, screening_id: str, requesting_user_id: str, is_admin: bool = False) -> bool:
        """Delete a screening record with strict ownership check."""
        target = None
        for s in self.data.get("screenings", []):
            if s.get("screening_id") == screening_id:
                target = s
                break
        if not target:
            return False

        if target.get("patient_id") != requesting_user_id and not is_admin:
            raise PermissionError("Access denied: You do not have permission to delete this screening record.")

        self.data["screenings"].remove(target)
        self.save()
        return True


db = NetraDatabase()

