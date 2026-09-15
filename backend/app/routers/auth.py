from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
import uuid
import re
from app.core.database import db
from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    decode_access_token,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_logins,
    generate_reset_code,
    generate_secure_otp,
    hash_otp,
)
from app.services.messaging_service import send_otp
from app.models.schema import (
    UserRegister, 
    UserLogin, 
    UserResponse, 
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    GenericAuthResponse,
    RegisterRequestOtpRequest,
    RegisterVerifyOtpRequest,
    RegisterResendOtpRequest,
    ForgotPasswordRequestOtpRequest,
    ForgotPasswordResetRequest,
    OtpResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    for u in db.data.get("users", []):
        if u["id"] == user_id:
            return u
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegister):
    raw_identifier = (req.identifier or req.email or req.phone or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Please enter your email address or phone number.")

    clean_email = None
    clean_phone = None

    # Support backwards compatibility if both email and phone are provided
    if req.email and req.phone and req.email.strip() and req.phone.strip():
        temp_email = req.email.strip().lower()
        if not EMAIL_REGEX.match(temp_email):
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        temp_phone = req.phone.strip()
        digits = db.normalize_phone_digits(temp_phone)
        if len(digits) < 7:
            raise HTTPException(status_code=400, detail="Please enter a valid phone number with country code.")
        clean_email = temp_email
        clean_phone = temp_phone
    else:
        # Detect whether the single identifier is an email or a phone number
        if EMAIL_REGEX.match(raw_identifier.lower()):
            clean_email = raw_identifier.lower()
        else:
            digits = db.normalize_phone_digits(raw_identifier)
            if len(digits) >= 7 and "@" not in raw_identifier:
                clean_phone = raw_identifier
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Please enter a valid email address or phone number."
                )

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    if req.confirm_password and req.confirm_password != req.password:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match.")

    # Duplicate checks
    if clean_email and db.find_user_by_email(clean_email):
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in or use forgot password.")
        
    if clean_phone and db.find_user_by_phone(clean_phone):
        raise HTTPException(status_code=400, detail="An account with this phone number already exists. Please log in or use forgot password.")
        
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    new_user = {
        "id": user_id,
        "email": clean_email,
        "password_hash": hash_password(req.password),
        "name": req.name.strip(),
        "role": req.role,
        "age": req.age,
        "gender": req.gender,
        "phone": clean_phone,
        "city": req.city,
        "specialization": req.specialization
    }
    db.data.setdefault("users", []).append(new_user)
    db.save()
    
    # Automatic user provisioning: Initialize profile & Welcome notification
    db.create_profile(user_id, {"full_name": req.name.strip()})
    db.add_notification(
        user_id=user_id,
        title="Complete Your Profile",
        message="Welcome! Please complete your profile details to get started.",
        type="profile_completion",
        action_url="/profile"
    )
    
    token = create_access_token({"sub": user_id, "role": req.role, "name": req.name})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=new_user["name"],
            email=new_user.get("email"),
            role=new_user["role"],
            age=new_user.get("age"),
            gender=new_user.get("gender"),
            phone=new_user.get("phone"),
            city=new_user.get("city"),
            specialization=new_user.get("specialization")
        )
    )


@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLogin):
    identifier = (req.identifier or req.email or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your email address or phone number.")
    if not req.password:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    # Check brute-force rate limit
    locked_mins = check_login_rate_limit(identifier)
    if locked_mins is not None:
        raise HTTPException(
            status_code=429, 
            detail=f"Too many failed login attempts. Account is temporarily locked. Please wait {locked_mins} minute(s) or use 'Forgot password?'."
        )

    user = db.find_user_by_identifier(identifier)
    if not user:
        fail_info = record_failed_login(identifier)
        if fail_info.get("locked"):
            raise HTTPException(
                status_code=429, 
                detail=f"Too many failed attempts. Account locked for {fail_info['lock_minutes']} minutes."
            )
        raise HTTPException(
            status_code=401, 
            detail="No account found with this email or phone number. Please check your credentials or click 'Create New Account'."
        )

    if not verify_password(req.password, user.get("password_hash", "")):
        fail_info = record_failed_login(identifier)
        if fail_info.get("locked"):
            raise HTTPException(
                status_code=429, 
                detail=f"Too many failed attempts. Account locked for {fail_info['lock_minutes']} minutes. You may use 'Forgot password?' to recover access."
            )
        remaining = fail_info.get("remaining", 1)
        raise HTTPException(
            status_code=401, 
            detail=f"Incorrect password. Please try again ({remaining} attempt(s) remaining before lockout) or click 'Forgot password?'."
        )
        
    # Successful login: clear any recorded failed attempts
    clear_failed_logins(identifier)
    if user.get("email"):
        clear_failed_logins(user["email"])
    if user.get("phone"):
        clear_failed_logins(user["phone"])
        
    token = create_access_token({"sub": user["id"], "role": user["role"], "name": user["name"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            age=user.get("age"),
            gender=user.get("gender"),
            phone=user.get("phone"),
            city=user.get("city"),
            specialization=user.get("specialization")
        )
    )

@router.post("/forgot-password", response_model=GenericAuthResponse)
def forgot_password(req: ForgotPasswordRequest):
    identifier = req.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please provide your registered email address or phone number.")
        
    user = db.find_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email or phone number.")
        
    code = generate_reset_code()
    db.save_reset_code(user["id"], identifier, code, expires_minutes=15)
    
    # In production SMS/Email integration, send via provider (e.g. Twilio/Sendgrid/Fast2SMS)
    return GenericAuthResponse(
        success=True,
        message=f"Verification code sent to {identifier}. Please check and enter the 6-digit code to reset your password.",
        reset_code=code
    )

@router.post("/reset-password", response_model=GenericAuthResponse)
def reset_password(req: ResetPasswordRequest):
    identifier = req.identifier.strip()
    if not identifier or not req.code:
        raise HTTPException(status_code=400, detail="Identifier and 6-digit verification code are required.")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")
        
    if req.confirm_password and req.confirm_password != req.new_password:
        raise HTTPException(status_code=400, detail="New password and Confirm Password do not match.")
        
    reset_entry = db.get_valid_reset_code(identifier, req.code)
    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code. Please request a new code.")
        
    user_id = reset_entry["user_id"]
    new_hash = hash_password(req.new_password)
    updated = db.update_user_password(user_id, new_hash)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    db.mark_reset_code_used(reset_entry["reset_id"])
    clear_failed_logins(identifier)
    
    return GenericAuthResponse(
        success=True,
        message="Your password has been successfully reset! You can now log in with your new password."
    )

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user.get("email"),
        role=current_user["role"],
        age=current_user.get("age"),
        gender=current_user.get("gender"),
        phone=current_user.get("phone"),
        city=current_user.get("city"),
        specialization=current_user.get("specialization")
    )


# ══════════════════════════════════════════════════════════════════════════════
# OTP-Based Registration
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/register/request-otp", response_model=OtpResponse)
def register_request_otp(req: RegisterRequestOtpRequest):
    """Step 1: Validate input, check duplicates, send OTP (account not created yet)."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()

    if dest_type not in ("email", "phone"):
        raise HTTPException(status_code=400, detail="destination_type must be 'email' or 'phone'.")

    if dest_type == "email":
        dest = dest.lower()
        if not EMAIL_REGEX.match(dest):
            raise HTTPException(status_code=400, detail="Please enter a valid email address.")
        if db.find_user_by_email(dest):
            raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
    else:
        digits = db.normalize_phone_digits(dest)
        if len(digits) < 7:
            raise HTTPException(status_code=400, detail="Please enter a valid phone number with country code.")
        if db.find_user_by_phone(dest):
            raise HTTPException(status_code=400, detail="An account with this phone number already exists. Please log in.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if req.confirm_password and req.confirm_password != req.password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check resend cooldown
    cooldown = db.check_resend_cooldown(dest, "registration")
    if cooldown > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {cooldown} seconds before requesting a new OTP.")

    # Generate & store OTP
    plain_otp = generate_secure_otp()
    otp_hash_val = hash_otp(plain_otp)
    temp_payload = {
        "name": req.name.strip(),
        "password_hash": hash_password(req.password),
        "role": req.role,
        "destination_type": dest_type,
        "country_code": req.country_code or "+91",
    }
    db.create_otp_record(
        destination=dest,
        destination_type=dest_type,
        purpose="registration",
        otp_hash=otp_hash_val,
        temp_payload=temp_payload,
    )

    # Send OTP
    result = send_otp(dest, dest_type, plain_otp, "registration", req.name.strip())
    dev_note = ""
    if result.get("provider") == "console":
        dev_note = f" [DEV: OTP={plain_otp}]"

    masked = f"{dest[:3]}{'*'*(len(dest)-6)}{dest[-3:]}" if len(dest) > 6 else dest
    return OtpResponse(
        success=True,
        message=f"A 6-digit verification code has been sent to {masked}. Enter it below to create your account.{dev_note}",
        cooldown_seconds=60,
        expires_in_seconds=300,
    )


@router.post("/register/verify-otp", response_model=TokenResponse)
def register_verify_otp(req: RegisterVerifyOtpRequest):
    """Step 2: Verify OTP, create account, return JWT token."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()
    if dest_type == "email":
        dest = dest.lower()

    result = db.verify_otp_and_consume(dest, "registration", req.otp.strip())

    if result["status"] == "not_found":
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new verification code.")
    if result["status"] == "expired":
        raise HTTPException(status_code=400, detail="The verification code has expired. Please request a new one.")
    if result["status"] == "max_attempts":
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please request a new OTP.")
    if result["status"] == "invalid":
        remaining = result.get("remaining", 0)
        raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")

    record = result["record"]
    payload = record.get("temp_payload", {})

    # Final duplicate check (race condition safety)
    if dest_type == "email":
        if db.find_user_by_email(dest):
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
    else:
        if db.find_user_by_phone(dest):
            raise HTTPException(status_code=400, detail="An account with this phone number already exists.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    new_user = {
        "id": user_id,
        "email": dest if dest_type == "email" else None,
        "phone": dest if dest_type == "phone" else None,
        "password_hash": payload.get("password_hash"),
        "name": payload.get("name", "User"),
        "role": payload.get("role", "patient"),
        "age": None,
        "gender": None,
        "city": None,
        "specialization": None,
    }
    db.data.setdefault("users", []).append(new_user)
    db.save()

    # Provision profile + welcome notification
    db.create_profile(user_id, {"full_name": new_user["name"]})
    db.add_notification(
        user_id=user_id,
        title="Welcome to Netra AI!",
        message="Your account has been verified. Complete your profile to get the best experience.",
        type="profile_completion",
        action_url="/profile"
    )

    token = create_access_token({"sub": user_id, "role": new_user["role"], "name": new_user["name"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=new_user["name"],
            email=new_user.get("email"),
            role=new_user["role"],
            phone=new_user.get("phone"),
        )
    )


@router.post("/register/resend-otp", response_model=OtpResponse)
def register_resend_otp(req: RegisterResendOtpRequest):
    """Resend OTP for registration (respects 60s cooldown)."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()
    if dest_type == "email":
        dest = dest.lower()

    # Retrieve existing temp_payload to resend same user data context
    active = db.get_active_otp(dest, "registration")
    if not active:
        raise HTTPException(status_code=400, detail="No pending registration found. Please start registration again.")

    cooldown = db.check_resend_cooldown(dest, "registration")
    if cooldown > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {cooldown} seconds before resending.")

    payload = active.get("temp_payload", {})
    plain_otp = generate_secure_otp()
    otp_hash_val = hash_otp(plain_otp)
    db.create_otp_record(
        destination=dest,
        destination_type=dest_type,
        purpose="registration",
        otp_hash=otp_hash_val,
        temp_payload=payload,
    )

    result = send_otp(dest, dest_type, plain_otp, "registration", payload.get("name", "User"))
    dev_note = f" [DEV: OTP={plain_otp}]" if result.get("provider") == "console" else ""

    return OtpResponse(
        success=True,
        message=f"A new verification code has been sent.{dev_note}",
        cooldown_seconds=60,
        expires_in_seconds=300,
    )


# ══════════════════════════════════════════════════════════════════════════════
# OTP-Based Forgot Password
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/forgot-password/request-otp", response_model=OtpResponse)
def forgot_password_request_otp(req: ForgotPasswordRequestOtpRequest):
    """Step 1: Validate account exists, send OTP to registered email/phone."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()
    if dest_type not in ("email", "phone"):
        raise HTTPException(status_code=400, detail="destination_type must be 'email' or 'phone'.")
    if dest_type == "email":
        dest = dest.lower()

    # Generic message to prevent account enumeration
    generic_msg = "If an account with that email/phone exists, a 6-digit code has been sent."

    user = db.find_user_by_identifier(dest)
    if not user:
        return OtpResponse(success=True, message=generic_msg, cooldown_seconds=60, expires_in_seconds=300)

    cooldown = db.check_resend_cooldown(dest, "forgot_password")
    if cooldown > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {cooldown} seconds before requesting a new OTP.")

    plain_otp = generate_secure_otp()
    otp_hash_val = hash_otp(plain_otp)
    db.create_otp_record(
        destination=dest,
        destination_type=dest_type,
        purpose="forgot_password",
        otp_hash=otp_hash_val,
        user_id=user["id"],
    )

    result = send_otp(dest, dest_type, plain_otp, "forgot_password", user.get("name", "User"))
    dev_note = f" [DEV: OTP={plain_otp}]" if result.get("provider") == "console" else ""

    return OtpResponse(
        success=True,
        message=f"{generic_msg}{dev_note}",
        cooldown_seconds=60,
        expires_in_seconds=300,
    )


@router.post("/forgot-password/reset", response_model=GenericAuthResponse)
def forgot_password_reset(req: ForgotPasswordResetRequest):
    """Step 2: Verify OTP and reset password."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()
    if dest_type == "email":
        dest = dest.lower()

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    if req.confirm_password and req.confirm_password != req.new_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    result = db.verify_otp_and_consume(dest, "forgot_password", req.otp.strip())

    if result["status"] == "not_found":
        raise HTTPException(status_code=400, detail="No active password reset request found. Please start again.")
    if result["status"] == "expired":
        raise HTTPException(status_code=400, detail="The verification code has expired. Please request a new one.")
    if result["status"] == "max_attempts":
        raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please request a new OTP.")
    if result["status"] == "invalid":
        remaining = result.get("remaining", 0)
        raise HTTPException(status_code=400, detail=f"Invalid code. {remaining} attempt(s) remaining.")

    record = result["record"]
    user_id = record.get("user_id")
    if not user_id:
        user = db.find_user_by_identifier(dest)
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")
        user_id = user["id"]

    new_hash = hash_password(req.new_password)
    if not db.update_user_password(user_id, new_hash):
        raise HTTPException(status_code=404, detail="User account not found.")

    clear_failed_logins(dest)
    return GenericAuthResponse(
        success=True,
        message="Your password has been successfully reset! You can now log in with your new password."
    )


@router.post("/forgot-password/resend-otp", response_model=OtpResponse)
def forgot_password_resend_otp(req: RegisterResendOtpRequest):
    """Resend OTP for password reset (respects 60s cooldown)."""
    dest = req.destination.strip()
    dest_type = req.destination_type.strip().lower()
    if dest_type == "email":
        dest = dest.lower()

    active = db.get_active_otp(dest, "forgot_password")
    if not active:
        raise HTTPException(status_code=400, detail="No active password reset request. Please start forgot password again.")

    cooldown = db.check_resend_cooldown(dest, "forgot_password")
    if cooldown > 0:
        raise HTTPException(status_code=429, detail=f"Please wait {cooldown} seconds before resending.")

    user = db.find_user_by_identifier(dest)
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    plain_otp = generate_secure_otp()
    otp_hash_val = hash_otp(plain_otp)
    db.create_otp_record(
        destination=dest,
        destination_type=dest_type,
        purpose="forgot_password",
        otp_hash=otp_hash_val,
        user_id=user["id"],
    )

    result = send_otp(dest, dest_type, plain_otp, "forgot_password", user.get("name", "User"))
    dev_note = f" [DEV: OTP={plain_otp}]" if result.get("provider") == "console" else ""

    return OtpResponse(
        success=True,
        message=f"A new verification code has been sent.{dev_note}",
        cooldown_seconds=60,
        expires_in_seconds=300,
    )
