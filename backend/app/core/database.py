import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from app.core.security import hash_password
from app.core.config import settings

DB_FILE = settings.DATABASE_FILE
DB_FILE.parent.mkdir(parents=True, exist_ok=True)

SERVER_START_TIME = datetime.now()

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
            "admin_audit_logs": [],
            "system_errors": [],
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
                    self.data.setdefault("admin_audit_logs", [])
                    self.data.setdefault("system_errors", [])
                    
                    # Ensure all existing users have status, created_at and verification attributes
                    for u in self.data["users"]:
                        if not u.get("status"):
                            u["status"] = "active"
                        if not u.get("created_at"):
                            u["created_at"] = "2026-06-01T10:00:00"
                        if u.get("role") == "doctor":
                            if not u.get("verification_status"):
                                u["verification_status"] = "verified" if u.get("id") == "doc-01" else "pending"
                            if not u.get("medical_reg_no") and u.get("id") == "doc-01":
                                u["medical_reg_no"] = "WB-MC-2012-7890"
                            if not u.get("hospital") and u.get("id") == "doc-01":
                                u["hospital"] = "Sankara Nethralaya, Kolkata"
                            if not u.get("qualifications") and u.get("id") == "doc-01":
                                u["qualifications"] = "MBBS, MS (Ophthalmology), FICO"
            except Exception:
                pass

    def save(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving DB: {e}")

    def _ensure_bcrypt_seeds(self):
        """Ensure seed accounts have valid bcrypt hashes and enforce sole admin santrasudipta70@gmail.com."""
        from app.core.security import verify_password
        updated = False
        admin_found = False
        for u in self.data["users"]:
            if u.get("email") == "admin@netra.ai":
                u["email"] = "santrasudipta70@gmail.com"
                u["name"] = "Sudipta Santra"
                u["password_hash"] = hash_password("sudipta@70")
                u["role"] = "admin"
                u["status"] = "active"
                admin_found = True
                updated = True
            elif u.get("email") == "santrasudipta70@gmail.com":
                u["role"] = "admin"
                u["status"] = "active"
                if not u.get("name"):
                    u["name"] = "Sudipta Santra"
                if not verify_password("sudipta@70", u.get("password_hash", "")):
                    u["password_hash"] = hash_password("sudipta@70")
                    updated = True
                admin_found = True
            elif u.get("role") == "admin" and u.get("email") != "santrasudipta70@gmail.com":
                u["role"] = "doctor"
                updated = True
            else:
                p_hash = u.get("password_hash", "")
                if not p_hash.startswith("$2b$") and not p_hash.startswith("$2a$"):
                    u["password_hash"] = hash_password("password123")
                    updated = True

        if not admin_found:
            self.data["users"].append({
                "id": "admin-01",
                "email": "santrasudipta70@gmail.com",
                "password_hash": hash_password("sudipta@70"),
                "name": "Sudipta Santra",
                "role": "admin",
                "status": "active",
                "created_at": "2026-06-01T10:00:00",
                "age": 28,
                "gender": "Male",
                "phone": "+91 98765 43210",
                "city": "Kolkata",
                "specialization": "Lead Clinical AI Administrator"
            })
            updated = True

        if updated:
            self.save()

    def seed_defaults(self):
        # Default Seed Patient (New user baseline with unpopulated name)
        self.data["users"].append({
            "id": "pat-01",
            "email": "patient@netra.ai",
            "password_hash": hash_password("password123"),
            "name": "",
            "role": "patient",
            "status": "active",
            "created_at": "2026-06-01T10:00:00",
            "age": None,
            "gender": None,
            "phone": None,
            "city": None,
            "specialization": None
        })
        
        # Default Seed Doctor (Dr. Ananya Sengupta)
        self.data["users"].append({
            "id": "doc-01",
            "email": "doctor@netra.ai",
            "password_hash": hash_password("password123"),
            "name": "Dr. Ananya Sengupta",
            "role": "doctor",
            "status": "active",
            "verification_status": "verified",
            "medical_reg_no": "WB-MC-2012-7890",
            "qualifications": "MBBS, MS (Ophthalmology), FICO",
            "hospital": "Sankara Nethralaya, Kolkata",
            "created_at": "2026-06-01T10:00:00",
            "age": 44,
            "gender": "Female",
            "phone": "+91 98310 98765",
            "city": "Kolkata",
            "specialization": "Vitreo-Retinal Surgeon"
        })
        
        # Default Seed Admin (Sudipta Santra - sole authorized admin)
        self.data["users"].append({
            "id": "admin-01",
            "email": "santrasudipta70@gmail.com",
            "password_hash": hash_password("sudipta@70"),
            "name": "Sudipta Santra",
            "role": "admin",
            "status": "active",
            "created_at": "2026-06-01T10:00:00",
            "age": 28,
            "gender": "Male",
            "phone": "+91 98765 43210",
            "city": "Kolkata",
            "specialization": "Lead Clinical AI Administrator"
        })
        
        # Seed an initial screening so history & trends have baseline data
        self.data["screenings"].append({
            "screening_id": "scr-baseline-01",
            "patient_id": "pat-01",
            "patient_name": "",
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
            "patient_name": "",
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

    def get_user(self, user_id: str) -> Optional[dict]:
        """Find a user record by unique ID."""
        for u in self.data.get("users", []):
            if u.get("id") == user_id:
                return u
        return None

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
            "medical_reg_no": initial_data.get("medical_reg_no", ""),
            "qualifications": initial_data.get("qualifications", ""),
            "specialization": initial_data.get("specialization", ""),
            "hospital": initial_data.get("hospital", ""),
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

        # If full_name, gender, city, or doctor credentials were updated, sync to user entry in "users"
        for u in self.data.get("users", []):
            if u.get("id") == user_id:
                if "full_name" in updates and updates["full_name"]:
                    u["name"] = updates["full_name"]
                if "gender" in updates:
                    u["gender"] = updates["gender"]
                if "city" in updates:
                    u["city"] = updates["city"]
                if "specialization" in updates:
                    u["specialization"] = updates["specialization"]
                if "medical_reg_no" in updates:
                    u["medical_reg_no"] = updates["medical_reg_no"]
                if "qualifications" in updates:
                    u["qualifications"] = updates["qualifications"]
                if "hospital" in updates:
                    u["hospital"] = updates["hospital"]
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

    def get_user_notifications(self, user_id: str) -> List[dict]:
        return self.get_notifications(user_id)

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

    # ─── Doctor Portal Clinical Helpers ─────────────────────────────────────

    def get_doctor_assigned_patient_ids(self, doctor_id: str) -> List[str]:
        """Return unique patient IDs assigned to this doctor via appointments, screenings, or direct enrollments."""
        patient_ids = set()
        for apt in self.data.get("appointments", []):
            if apt.get("doctor_id") == doctor_id and apt.get("patient_id"):
                patient_ids.add(apt["patient_id"])
        for s in self.data.get("screenings", []):
            if (s.get("assigned_doctor_id") == doctor_id or s.get("doctor_id") == doctor_id) and s.get("patient_id"):
                patient_ids.add(s["patient_id"])
        for u in self.data.get("users", []):
            if u.get("enrolled_by_doctor_id") == doctor_id:
                patient_ids.add(u["id"])
        return sorted(list(patient_ids))

    def get_doctor_assigned_patients(self, doctor_id: str, query: str = "") -> List[dict]:
        """Return detailed patient summaries assigned to this doctor or matching search query."""
        assigned_ids = set(self.get_doctor_assigned_patient_ids(doctor_id))
        clean_q = query.strip().lower()

        # If searching, consider assigned patients plus registered patients matching the query
        candidate_ids = set(assigned_ids)
        if clean_q:
            for u in self.data.get("users", []):
                if u.get("role") == "patient" and u.get("id"):
                    candidate_ids.add(u["id"])

        results = []
        for pid in sorted(list(candidate_ids)):
            u = next((user for user in self.data.get("users", []) if user.get("id") == pid), None)
            prof = self.get_profile(pid)

            name = (prof.get("full_name") if prof else None) or (u.get("name") if u else None) or "Patient"
            email = (u.get("email") if u else "") or ""
            phone = (u.get("phone") if u else "") or ""
            city = (prof.get("city") if prof else None) or (u.get("city") if u else "") or ""
            age = (u.get("age") if u else None) or (prof.get("age") if prof else None)
            gender = (prof.get("gender") if prof else None) or (u.get("gender") if u else "") or ""

            # Check search filter
            if clean_q:
                match = (
                    clean_q in pid.lower() or 
                    clean_q in name.lower() or 
                    clean_q in email.lower() or 
                    clean_q in phone.lower() or
                    clean_q in city.lower()
                )
                if not match:
                    continue

            # Compute screening metrics
            patient_scans = [s for s in self.data.get("screenings", []) if s.get("patient_id") == pid]
            sorted_scans = sorted(patient_scans, key=lambda s: s.get("timestamp", ""), reverse=True)
            latest = sorted_scans[0] if sorted_scans else {}

            results.append({
                "patient_id": pid,
                "patient_name": name,
                "email": email,
                "phone": phone,
                "city": city,
                "age": age,
                "gender": gender,
                "total_screenings": len(patient_scans),
                "latest_screening_date": latest.get("date") or (latest.get("timestamp", "").split("T")[0] if "T" in latest.get("timestamp", "") else None),
                "latest_condition": latest.get("primary_condition"),
                "latest_risk_level": latest.get("risk_level"),
                "latest_review_status": latest.get("review_status") or "pending"
            })

        return results

    def get_doctor_screenings(self, doctor_id: str, status_filter: str = "all", query: str = "") -> List[dict]:
        """Return all screening records accessible to this doctor, with optional filtering."""
        assigned_patient_ids = set(self.get_doctor_assigned_patient_ids(doctor_id))
        clean_q = query.strip().lower()
        filter_status = status_filter.strip().lower()

        accessible_screenings = []
        for s in self.data.get("screenings", []):
            is_assigned_directly = (s.get("assigned_doctor_id") == doctor_id or s.get("doctor_id") == doctor_id)
            is_assigned_patient = (s.get("patient_id") in assigned_patient_ids)
            is_unassigned_request = (not s.get("assigned_doctor_id") and not s.get("doctor_id"))
            
            # If doc-01 and baseline screening
            if doctor_id == "doc-01" and s.get("screening_id") == "scr-baseline-01":
                is_assigned_directly = True

            if is_assigned_directly or is_assigned_patient or is_unassigned_request:
                accessible_screenings.append(s)

        # Sort newest first
        sorted_screenings = sorted(accessible_screenings, key=lambda s: s.get("timestamp", ""), reverse=True)

        results = []
        for s in sorted_screenings:
            rev_status = (s.get("review_status") or "pending").lower()
            risk_level = (s.get("risk_level") or "").lower()

            # Apply status filter
            if filter_status and filter_status != "all":
                if filter_status == "pending" and rev_status not in ["pending", ""]:
                    continue
                elif filter_status == "reviewed" and rev_status != "reviewed":
                    continue
                elif filter_status == "urgent" and "high" not in risk_level and "urgent" not in risk_level:
                    continue
                elif filter_status in ["needs_further_examination", "further_exam"] and rev_status != "needs_further_examination":
                    continue
                elif filter_status in ["recapture_required", "recapture"] and rev_status != "recapture_required":
                    continue
                elif filter_status in ["referred", "referral"] and rev_status != "referred":
                    continue

            # Apply search filter
            if clean_q:
                pat_name = (s.get("patient_name") or "").lower()
                scr_id = (s.get("screening_id") or "").lower()
                cond = (s.get("primary_condition") or "").lower()
                if clean_q not in pat_name and clean_q not in scr_id and clean_q not in cond:
                    continue

            results.append(s)

        return results

    def get_doctor_dashboard_stats(self, doctor_id: str) -> dict:
        """Compute real, dynamic statistics for the doctor's dashboard from actual DB records."""
        screenings = self.get_doctor_screenings(doctor_id, status_filter="all")
        patient_ids = self.get_doctor_assigned_patient_ids(doctor_id)

        total_patients = len(patient_ids)
        awaiting_review = sum(1 for s in screenings if (s.get("review_status") or "pending").lower() == "pending")
        reviewed = sum(1 for s in screenings if (s.get("review_status") or "").lower() == "reviewed")
        urgent = sum(1 for s in screenings if (s.get("risk_level") or "").lower() == "high risk" or s.get("risk_score", 0) >= 75.0)

        recent_activity = []
        for s in screenings[:8]:
            recent_activity.append({
                "screening_id": s.get("screening_id"),
                "patient_id": s.get("patient_id"),
                "patient_name": s.get("patient_name") or "Patient",
                "date": s.get("date") or (s.get("timestamp", "").split("T")[0] if "T" in s.get("timestamp", "") else ""),
                "timestamp": s.get("timestamp", ""),
                "primary_condition": s.get("primary_condition", "Unknown"),
                "risk_level": s.get("risk_level", "Low Risk"),
                "risk_score": float(s.get("risk_score", 0.0)),
                "review_status": s.get("review_status") or "pending",
                "image_url": s.get("image_url", "")
            })

        doctor_user = next((u for u in self.data.get("users", []) if u.get("id") == doctor_id), None)
        doctor_name = (doctor_user.get("name") if doctor_user else "") or "Doctor"

        return {
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "total_patients": total_patients,
            "reports_awaiting_review": awaiting_review,
            "reports_reviewed": reviewed,
            "reports_urgent": urgent,
            "recent_activity": recent_activity
        }

    def update_screening_review(self, screening_id: str, doctor_id: str, review_data: dict) -> Optional[dict]:
        """Update clinical review status, doctor notes, and trigger patient notifications."""
        screening = None
        for s in self.data.get("screenings", []):
            if s.get("screening_id") == screening_id:
                screening = s
                break
        if not screening:
            return None

        doctor_user = next((u for u in self.data.get("users", []) if u.get("id") == doctor_id), None)
        doctor_name = (doctor_user.get("name") if doctor_user else None) or "Reviewing Ophthalmologist"

        new_status = review_data.get("review_status", "reviewed")
        notes = review_data.get("clinical_notes", "")
        diag = review_data.get("diagnosis_confirmed")
        now_ts = datetime.now().isoformat()

        screening["review_status"] = new_status
        screening["clinical_notes"] = notes
        if diag:
            screening["diagnosis_confirmed"] = diag
        screening["reviewed_at"] = now_ts
        screening["reviewed_by"] = doctor_name
        screening["doctor_id"] = doctor_id
        screening["assigned_doctor_id"] = doctor_id
        if new_status == "reviewed":
            screening["status"] = "Report Available"
        elif new_status == "recapture_required":
            screening["status"] = "Image Requires Recapture"
        elif new_status == "needs_further_examination":
            screening["status"] = "Under Doctor Review"

        self.save()

        # Send patient notification if recapture or referral
        patient_id = screening.get("patient_id")
        if patient_id:
            if new_status == "recapture_required":
                self.add_notification(
                    user_id=patient_id,
                    title="Fundus Image Recapture Requested",
                    message=f"{doctor_name} reviewed your screening and requested a new retinal photograph. Reason: {notes or 'Image focus/aperture insufficient for definitive grading.'}",
                    type="recapture_required",
                    action_url="/reports"
                )
            elif new_status == "referred":
                self.add_notification(
                    user_id=patient_id,
                    title="Specialist Referral Recommended",
                    message=f"{doctor_name} has referred your retinal screening for in-person vitreo-retinal evaluation: {notes or 'Detailed diagnostic biomicroscopy recommended.'}",
                    type="referral",
                    action_url="/reports"
                )
            elif new_status == "needs_further_examination":
                self.add_notification(
                    user_id=patient_id,
                    title="Clinical Follow-Up Recommended",
                    message=f"{doctor_name} reviewed your screening report and recommended further diagnostic examination: {notes or 'Clinical consultation advised.'}",
                    type="examination_needed",
                    action_url="/reports"
                )
            elif new_status == "reviewed":
                self.add_notification(
                    user_id=patient_id,
                    title="Screening Report Available",
                    message="Your retinal screening report is now available.",
                    type="report_reviewed",
                    action_url="/reports"
                )

        return screening

    # Admin Portal Database Governance & Telemetry Methods
    def log_audit_event(self, admin_id: str, admin_name: str, action: str, resource_type: str, resource_id: str, details: str) -> dict:
        event = {
            "id": f"aud-{os.urandom(4).hex()}",
            "admin_id": admin_id,
            "admin_name": admin_name,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.data.setdefault("admin_audit_logs", []).insert(0, event)
        if len(self.data["admin_audit_logs"]) > 200:
            self.data["admin_audit_logs"] = self.data["admin_audit_logs"][:200]
        self.save()
        return event

    def get_audit_logs(self, limit: int = 50) -> List[dict]:
        return self.data.get("admin_audit_logs", [])[:limit]

    def log_system_error(self, error_type: str, message: str, details: Optional[str] = None) -> dict:
        err = {
            "id": f"err-{os.urandom(4).hex()}",
            "type": error_type,
            "message": message,
            "details": details or "",
            "timestamp": datetime.now().isoformat()
        }
        self.data.setdefault("system_errors", []).insert(0, err)
        if len(self.data["system_errors"]) > 100:
            self.data["system_errors"] = self.data["system_errors"][:100]
        self.save()
        return err

    def get_system_errors(self, limit: int = 20) -> List[dict]:
        return self.data.get("system_errors", [])[:limit]

    def _format_time_ago(self, dt_str: str) -> str:
        try:
            dt = datetime.fromisoformat(dt_str.replace("Z", ""))
            diff = datetime.now() - dt
            seconds = int(diff.total_seconds())
            if seconds < 60:
                return "just now"
            elif seconds < 3600:
                return f"{seconds // 60}m ago"
            elif seconds < 86400:
                return f"{seconds // 3600}h ago"
            else:
                return f"{seconds // 86400}d ago"
        except Exception:
            return "recently"

    def get_admin_dashboard_stats(self) -> dict:
        users = self.data.get("users", [])
        screenings = self.data.get("screenings", [])
        
        total_patients = sum(1 for u in users if u.get("role") == "patient")
        total_doctors = sum(1 for u in users if u.get("role") == "doctor")
        total_screenings = len(screenings)
        
        awaiting_review = sum(1 for s in screenings if (s.get("review_status") or "pending") == "pending")
        reviewed = sum(1 for s in screenings if s.get("review_status") == "reviewed")
        
        requiring_attention = 0
        for s in screenings:
            status = s.get("review_status") or "pending"
            quality = s.get("quality", {})
            if (
                status in ["recapture_required", "referred"] 
                or not quality.get("is_suitable", True)
                or quality.get("status_label") in ["Poor", "Ungradable", "Borderline"]
            ):
                requiring_attention += 1
                
        verified_doctors = sum(1 for u in users if u.get("role") == "doctor" and u.get("verification_status") == "verified")
        pending_doctors = sum(1 for u in users if u.get("role") == "doctor" and u.get("verification_status") != "verified")
        
        recent_activity = []
        
        # 1. From recent audit logs
        for a in self.data.get("admin_audit_logs", [])[:4]:
            recent_activity.append({
                "id": a["id"],
                "title": f"{a['admin_name']}: {a['action']} on {a['resource_type']} ({a['resource_id']})",
                "category": "Admin Governance",
                "timestamp": a["timestamp"],
                "time_ago": self._format_time_ago(a["timestamp"]),
                "type": "info"
            })
            
        # 2. From actual screenings
        for s in reversed(screenings[-6:]):
            pat_name = s.get("patient_name") or f"Patient ({s.get('patient_id', '')})"
            cond = s.get("primary_condition", "Fundus Evaluation")
            risk = s.get("risk_level", "Low Risk")
            ts = s.get("timestamp") or datetime.now().isoformat()
            recent_activity.append({
                "id": f"act-{s.get('screening_id')}",
                "title": f"Retinal scan: {cond} ({risk}) for {pat_name}",
                "category": "Screening",
                "timestamp": ts,
                "time_ago": self._format_time_ago(ts),
                "type": "danger" if "High" in risk else ("warning" if "Moderate" in risk else "success")
            })
            
        # 3. From registered doctors
        for d in users:
            if d.get("role") == "doctor":
                d_name = d.get("name") or "Specialist"
                v_stat = d.get("verification_status", "pending")
                ts = d.get("created_at") or "2026-06-01T10:00:00"
                recent_activity.append({
                    "id": f"act-doc-{d.get('id')}",
                    "title": f"{d_name} ({v_stat.title()}) registered in doctor directory",
                    "category": "Doctor Verification",
                    "timestamp": ts,
                    "time_ago": self._format_time_ago(ts),
                    "type": "success" if v_stat == "verified" else "warning"
                })

        recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_activity = recent_activity[:8]
        
        return {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_screenings": total_screenings,
            "reports_awaiting_review": awaiting_review,
            "reports_reviewed": reviewed,
            "reports_requiring_attention": requiring_attention,
            "verified_doctors_count": verified_doctors,
            "pending_doctors_count": pending_doctors,
            "recent_activity": recent_activity
        }

    def get_admin_patients(self, query: str = "") -> List[dict]:
        clean_q = query.strip().lower()
        patients = []
        screenings = self.data.get("screenings", [])
        
        for u in self.data.get("users", []):
            if u.get("role") != "patient":
                continue
            
            p_id = u.get("id", "")
            p_name = u.get("name", "")
            p_email = u.get("email") or ""
            p_phone = u.get("phone") or ""
            
            if clean_q:
                match = (
                    clean_q in p_id.lower() or
                    clean_q in p_name.lower() or
                    clean_q in p_email.lower() or
                    clean_q in p_phone.lower()
                )
                if not match:
                    continue
            
            p_screenings = [s for s in screenings if s.get("patient_id") == p_id]
            screening_count = len(p_screenings)
            last_date = p_screenings[-1].get("date") if p_screenings else None
            
            patients.append({
                "id": p_id,
                "name": p_name or "Complete Your Profile",
                "email": p_email or None,
                "phone": p_phone or None,
                "city": u.get("city") or None,
                "status": u.get("status", "active"),
                "created_at": u.get("created_at", "2026-06-01T10:00:00"),
                "screening_count": screening_count,
                "last_screening_date": last_date
            })
            
        return patients

    def set_user_status(self, user_id: str, status: str, admin_id: str, admin_name: str) -> Optional[dict]:
        user = next((u for u in self.data.get("users", []) if u.get("id") == user_id), None)
        if not user:
            return None
        user["status"] = status
        self.save()
        
        self.log_audit_event(
            admin_id=admin_id,
            admin_name=admin_name,
            action="UPDATE_USER_STATUS",
            resource_type="User",
            resource_id=user_id,
            details=f"Updated user account '{user.get('name') or user.get('email')}' status to {status}."
        )
        return user

    def get_admin_doctors(self, query: str = "") -> List[dict]:
        clean_q = query.strip().lower()
        doctors = []
        screenings = self.data.get("screenings", [])
        
        for u in self.data.get("users", []):
            if u.get("role") != "doctor":
                continue
            
            d_id = u.get("id", "")
            d_name = u.get("name", "")
            d_email = u.get("email") or ""
            d_phone = u.get("phone") or ""
            d_reg = u.get("medical_reg_no") or ""
            
            if clean_q:
                match = (
                    clean_q in d_id.lower() or
                    clean_q in d_name.lower() or
                    clean_q in d_email.lower() or
                    clean_q in d_phone.lower() or
                    clean_q in d_reg.lower()
                )
                if not match:
                    continue
            
            screening_count = sum(1 for s in screenings if s.get("assigned_doctor_id") == d_id or s.get("reviewed_by") == d_name)
            
            doctors.append({
                "id": d_id,
                "name": d_name or "Doctor",
                "email": d_email,
                "phone": d_phone or None,
                "medical_reg_no": d_reg or None,
                "qualifications": u.get("qualifications") or None,
                "specialization": u.get("specialization") or "Ophthalmologist",
                "hospital": u.get("hospital") or None,
                "city": u.get("city") or None,
                "verification_status": u.get("verification_status", "pending"),
                "status": u.get("status", "active"),
                "screening_count": screening_count,
                "created_at": u.get("created_at", "2026-06-01T10:00:00")
            })
            
        return doctors

    def verify_doctor(self, doctor_id: str, status: str, notes: Optional[str], admin_id: str, admin_name: str) -> Optional[dict]:
        user = next((u for u in self.data.get("users", []) if u.get("id") == doctor_id and u.get("role") == "doctor"), None)
        if not user:
            return None
            
        user["verification_status"] = status
        user["verification_notes"] = notes or ""
        user["verified_at"] = datetime.now().isoformat()
        user["verified_by"] = admin_name
        self.save()
        
        self.add_notification(
            user_id=doctor_id,
            title="Credential Verification Update",
            message=f"Your doctor credentials have been {status} by the Netra AI Medical Board. {notes or ''}",
            type="verification_update",
            action_url="/profile"
        )
        
        self.log_audit_event(
            admin_id=admin_id,
            admin_name=admin_name,
            action="VERIFY_DOCTOR",
            resource_type="Doctor",
            resource_id=doctor_id,
            details=f"Doctor '{user.get('name')}' verification set to {status}. Notes: {notes or 'None'}"
        )
        return user

    def get_admin_screenings(self, query: str = "", status_filter: str = "") -> List[dict]:
        clean_q = query.strip().lower()
        status_f = (status_filter or "").strip().lower()
        screenings = self.data.get("screenings", [])
        results = []
        
        for s in reversed(screenings):
            s_id = s.get("screening_id", "")
            p_id = s.get("patient_id", "")
            p_name = s.get("patient_name", "")
            d_id = s.get("assigned_doctor_id") or ""
            d_name = s.get("reviewed_by") or ""
            r_status = (s.get("review_status") or "pending").lower()
            quality = s.get("quality", {})
            is_suitable = quality.get("is_suitable", True)
            q_label = quality.get("status_label", "Good")
            
            if not is_suitable or q_label in ["Poor", "Ungradable"]:
                tech_status = "ungradable"
            elif q_label == "Borderline" or quality.get("composite_quality", 100) < 60:
                tech_status = "low_quality"
            elif not s.get("image_url"):
                tech_status = "failed_upload"
            else:
                tech_status = "normal"
                
            if status_f and status_f != "all":
                if status_f == "ungradable":
                    if tech_status not in ["ungradable", "low_quality", "failed_upload"]:
                        continue
                elif status_f != r_status:
                    continue
                    
            if clean_q:
                match = (
                    clean_q in s_id.lower() or
                    clean_q in p_id.lower() or
                    clean_q in p_name.lower() or
                    clean_q in d_id.lower() or
                    clean_q in d_name.lower() or
                    clean_q in s.get("primary_condition", "").lower()
                )
                if not match:
                    continue
                    
            results.append({
                "screening_id": s_id,
                "patient_id": p_id,
                "patient_name": p_name or f"Patient ({p_id})",
                "doctor_id": d_id or None,
                "doctor_name": d_name or None,
                "date": s.get("date") or "",
                "timestamp": s.get("timestamp") or "",
                "primary_condition": s.get("primary_condition", "Evaluation In Progress"),
                "risk_level": s.get("risk_level", "Unknown"),
                "risk_score": float(s.get("risk_score", 0.0)),
                "review_status": s.get("review_status") or "pending",
                "is_suitable": is_suitable,
                "composite_quality": float(quality.get("composite_quality", 0.0)),
                "technical_status": tech_status,
                "rejection_reasons": quality.get("rejection_reasons", []),
                "image_url": s.get("image_url", "")
            })
            
        return results

    def get_admin_screening_detail(self, screening_id: str, admin_id: str, admin_name: str) -> Optional[dict]:
        screening = next((s for s in self.data.get("screenings", []) if s.get("screening_id") == screening_id), None)
        if not screening:
            return None
            
        self.log_audit_event(
            admin_id=admin_id,
            admin_name=admin_name,
            action="INSPECT_REPORT",
            resource_type="Screening",
            resource_id=screening_id,
            details=f"Admin {admin_name} inspected technical diagnostics for screening {screening_id}."
        )
        return screening

    def get_system_health(self) -> dict:
        now = datetime.now()
        uptime_seconds = (now - SERVER_START_TIME).total_seconds()
        
        # Check AI model weights path
        backend_root = Path(__file__).resolve().parent.parent.parent
        checkpoint_path = backend_root / "models" / "netra_efficientnet_best.pt"
        ai_checkpoint_found = checkpoint_path.exists()
        ai_model_status = "Ready" if ai_checkpoint_found else "Active (PyTorch/OpenCV Clinical Engine)"
        
        db_status = "Connected"
        try:
            if not DB_FILE.exists():
                db_status = "Degraded (In-Memory)"
        except Exception as e:
            db_status = f"Error: {str(e)}"
            self.log_system_error("DATABASE_HEALTH", str(e))
            
        records_count = {
            "users": len(self.data.get("users", [])),
            "patients": sum(1 for u in self.data.get("users", []) if u.get("role") == "patient"),
            "doctors": sum(1 for u in self.data.get("users", []) if u.get("role") == "doctor"),
            "screenings": len(self.data.get("screenings", [])),
            "appointments": len(self.data.get("appointments", [])),
            "audit_logs": len(self.data.get("admin_audit_logs", [])),
            "notifications": len(self.data.get("notifications", []))
        }
        
        app_status = "Healthy" if db_status == "Connected" else "Degraded"
        
        return {
            "app_status": app_status,
            "ai_model_status": ai_model_status,
            "ai_model_name": "Netra-EfficientNet-v1.4-XAI",
            "ai_checkpoint_found": ai_checkpoint_found,
            "database_status": db_status,
            "database_records_count": records_count,
            "backend_uptime_seconds": round(uptime_seconds, 1),
            "timestamp": now.isoformat(),
            "recent_errors": self.get_system_errors(limit=10)
        }

    def get_admin_notifications(self) -> List[dict]:
        alerts = []
        
        for d in self.data.get("users", []):
            if d.get("role") == "doctor" and d.get("verification_status") == "pending":
                alerts.append({
                    "id": f"notif-doc-{d.get('id')}",
                    "title": "Doctor Verification Pending",
                    "message": f"Dr. {d.get('name', 'Specialist')} ({d.get('email')}) has submitted credentials for verification.",
                    "category": "doctor_verification",
                    "is_read": False,
                    "created_at": d.get("created_at", "2026-06-01T10:00:00"),
                    "action_url": "admin-doctors"
                })
                
        for s in self.data.get("screenings", []):
            q = s.get("quality", {})
            if not q.get("is_suitable", True) or s.get("review_status") == "recapture_required":
                alerts.append({
                    "id": f"notif-scr-{s.get('screening_id')}",
                    "title": "Retinal Scan Quality Alert",
                    "message": f"Scan #{s.get('screening_id')} for patient {s.get('patient_name') or s.get('patient_id')} flagged: {', '.join(q.get('rejection_reasons', ['Image focus below clinical threshold']))}.",
                    "category": "technical_alert",
                    "is_read": False,
                    "created_at": s.get("timestamp", datetime.now().isoformat()),
                    "action_url": "admin-reports"
                })
                
        alerts.append({
            "id": "notif-sys-01",
            "title": "Netra AI System Release v1.4-XAI",
            "message": "Clinical telemetry, Explainable AI Grad-CAM engine, and ABDM bridge active.",
            "category": "system_announcement",
            "is_read": True,
            "created_at": "2026-09-05T09:00:00",
            "action_url": "admin-monitoring"
        })
        
        return alerts

    def update_admin_profile(self, admin_id: str, data: dict) -> Optional[dict]:
        user = next((u for u in self.data.get("users", []) if u.get("id") == admin_id and u.get("role") == "admin"), None)
        if not user:
            return None
        if data.get("name"):
            user["name"] = data["name"].strip()
        if data.get("phone") is not None:
            user["phone"] = data["phone"].strip() if data["phone"] else None
        if data.get("city") is not None:
            user["city"] = data["city"].strip() if data["city"] else None
        self.save()
        self.log_audit_event(
            admin_id=admin_id,
            admin_name=user["name"],
            action="UPDATE_PROFILE",
            resource_type="Admin",
            resource_id=admin_id,
            details=f"Admin profile details updated for {user.get('email')}."
        )
        return user

    def change_admin_password(self, admin_id: str, current_password: str, new_password: str) -> bool:
        user = next((u for u in self.data.get("users", []) if u.get("id") == admin_id and u.get("role") == "admin"), None)
        if not user:
            return False
        from app.core.security import verify_password, hash_password
        if not verify_password(current_password, user.get("password_hash", "")):
            return False
        user["password_hash"] = hash_password(new_password)
        self.save()
        self.log_audit_event(
            admin_id=admin_id,
            admin_name=user["name"],
            action="CHANGE_PASSWORD",
            resource_type="Admin",
            resource_id=admin_id,
            details="Admin password updated successfully."
        )
        return True


db = NetraDatabase()

