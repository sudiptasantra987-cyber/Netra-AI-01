import hashlib
import os
import hmac
import secrets
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings

# In-memory rate limiting store: identifier -> { "attempts": int, "locked_until": Optional[datetime] }
_login_attempts: Dict[str, Dict[str, Any]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

def hash_password(password: str) -> str:
    """Hash password securely using bcrypt with cryptographic salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash or fallback to legacy salted sha256."""
    if not plain_password or not hashed_password:
        return False
    try:
        # Standard bcrypt hash starts with $2b$ or $2a$
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        
        # Legacy fallback for salt$sha256
        if "$" in hashed_password:
            salt, h_val = hashed_password.split("$", 1)
            computed = hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest()
            return hmac.compare_digest(h_val, computed)
            
        return False
    except Exception:
        return False

def check_login_rate_limit(identifier: str) -> Optional[int]:
    """Check if identifier is currently locked out. Returns remaining minutes if locked, None if allowed."""
    key = identifier.strip().lower()
    record = _login_attempts.get(key)
    if not record:
        return None
    
    locked_until = record.get("locked_until")
    if locked_until:
        now = datetime.now(timezone.utc)
        if now < locked_until:
            remaining_secs = int((locked_until - now).total_seconds())
            remaining_mins = max(1, (remaining_secs + 59) // 60)
            return remaining_mins
        else:
            # Lockout expired, reset attempts
            _login_attempts.pop(key, None)
            return None
            
    return None

def record_failed_login(identifier: str) -> Dict[str, Any]:
    """Record a failed login attempt and lock account if limit exceeded."""
    key = identifier.strip().lower()
    now = datetime.now(timezone.utc)
    record = _login_attempts.setdefault(key, {"attempts": 0, "locked_until": None})
    
    record["attempts"] += 1
    if record["attempts"] >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        return {"locked": True, "attempts": record["attempts"], "lock_minutes": LOCKOUT_DURATION_MINUTES}
    
    remaining = MAX_FAILED_ATTEMPTS - record["attempts"]
    return {"locked": False, "attempts": record["attempts"], "remaining": remaining}

def clear_failed_logins(identifier: str):
    """Clear failed login attempts upon successful login."""
    key = identifier.strip().lower()
    _login_attempts.pop(key, None)

def generate_reset_code() -> str:
    """Generate a secure 6-digit numeric reset code."""
    return f"{secrets.randbelow(1000000):06d}"

def generate_secure_otp() -> str:
    """Generate a cryptographically secure 6-digit random numeric OTP."""
    return f"{secrets.randbelow(1000000):06d}"

def hash_otp(otp: str) -> str:
    """Hash OTP securely with SHA-256 and application secret salt."""
    return hashlib.sha256((otp.strip() + ":" + settings.SECRET_KEY).encode('utf-8')).hexdigest()

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Verify plain OTP against stored hash using constant-time comparison."""
    if not plain_otp or not hashed_otp:
        return False
    computed = hash_otp(plain_otp)
    return hmac.compare_digest(computed, hashed_otp)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

