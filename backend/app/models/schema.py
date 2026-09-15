from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, description="Full Name")
    identifier: Optional[str] = Field(None, description="Email address or phone number")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number with country code")
    password: str = Field(..., min_length=6, description="Password")
    confirm_password: Optional[str] = None
    role: str = "patient"  # "patient", "doctor", "admin"
    age: Optional[int] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

class UserLogin(BaseModel):
    email: Optional[str] = Field(None, description="Email address or phone number")
    identifier: Optional[str] = Field(None, description="Email address or phone number")
    password: str

class ForgotPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Registered email address or phone number")

class ResetPasswordRequest(BaseModel):
    identifier: str = Field(..., description="Registered email address or phone number")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    new_password: str = Field(..., min_length=6, description="New password")
    confirm_password: Optional[str] = None

class GenericAuthResponse(BaseModel):
    success: bool
    message: str
    reset_code: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    role: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    specialization: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Profile & Notification Schemas
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    bio: Optional[str] = None

class UserProfileResponse(BaseModel):
    user_id: str
    full_name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    role: str
    profile_picture: Optional[str] = ""
    date_of_birth: Optional[str] = ""
    gender: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pin_code: Optional[str] = ""
    bio: Optional[str] = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class NotificationItem(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str = "info"
    is_read: bool = False
    created_at: str
    action_url: Optional[str] = None

class NotificationStatusResponse(BaseModel):
    success: bool
    message: str
    unread_count: int = 0

# OTP / New Auth Schemas
class RegisterRequestOtpRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Full name")
    destination: str = Field(..., description="Email address or phone number")
    destination_type: str = Field(..., description="'email' or 'phone'")
    password: str = Field(..., min_length=6, description="Password")
    confirm_password: Optional[str] = None
    role: str = "patient"
    country_code: Optional[str] = "+91"

class RegisterVerifyOtpRequest(BaseModel):
    destination: str = Field(..., description="Email or phone used during request-otp")
    destination_type: str = Field(..., description="'email' or 'phone'")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")

class RegisterResendOtpRequest(BaseModel):
    destination: str
    destination_type: str

class ForgotPasswordRequestOtpRequest(BaseModel):
    destination: str = Field(..., description="Registered email or phone")
    destination_type: str = Field(..., description="'email' or 'phone'")

class ForgotPasswordResetRequest(BaseModel):
    destination: str
    destination_type: str
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None

class OtpResponse(BaseModel):
    success: bool
    message: str
    cooldown_seconds: int = 0
    expires_in_seconds: int = 300

# ABDM & Ayushman Card Schemas
class AbdmCardLinkRequest(BaseModel):
    abha_id: str = Field(..., description="14-digit ABHA Number or ABHA Address (@abdm)")
    pmjay_id: Optional[str] = Field(None, description="PM-JAY ID / Ayushman Beneficiary ID (alphanumeric)")
    consent_given: bool = Field(..., description="Explicit user consent to link credentials")
    demo_mode: bool = Field(default=True, description="Flag indicating demonstration simulation")

class AbdmCardResponse(BaseModel):
    card_id: str
    user_id: str
    abha_id_masked: str
    pmjay_id_masked: Optional[str] = None
    beneficiary_name: Optional[str] = None
    demo_mode: bool = True
    linked_at: str
    status: str = "linked"

class AbdmCardStatusResponse(BaseModel):
    linked: bool
    card: Optional[AbdmCardResponse] = None
    official_gateway_available: bool = False




# Image Quality Schemas
class QualityMetrics(BaseModel):
    sharpness_score: float = Field(..., description="Laplacian variance based sharpness (0-100)")
    brightness_score: float = Field(..., description="Mean luminance (0-100)")
    contrast_score: float = Field(..., description="RMS contrast normalized (0-100)")
    noise_level: float = Field(..., description="Estimated high frequency noise (0-100)")
    resolution_ok: bool
    width: int
    height: int
    composite_quality: float = Field(..., description="Overall calculated score (0-100)")
    is_suitable: bool
    status_label: str  # "Excellent", "Suitable", "Insufficient Quality"
    rejection_reasons: List[str] = []
    guidance: str

# Screening and AI Diagnostic Schemas
class DiseasePrediction(BaseModel):
    condition: str
    confidence: float
    description: str
    severity_level: str  # "None", "Mild", "Moderate", "Severe"

class ScreeningResponse(BaseModel):
    screening_id: str
    patient_id: str
    timestamp: str
    image_url: str
    quality: QualityMetrics
    primary_condition: str
    primary_confidence: float
    all_predictions: List[DiseasePrediction]
    risk_level: str  # "Low Risk", "Moderate Risk", "High Risk"
    risk_score: float  # 0 to 100
    clinical_recommendation: str
    gradcam_image_base64: Optional[str] = None
    affected_quadrants: List[str] = []
    model_version: str = "Netra-EfficientNet-v1.4-XAI"

# Doctor Schemas
class DoctorAvailabilitySlot(BaseModel):
    slot_id: str
    date: str
    time: str
    is_available: bool

class DoctorProfile(BaseModel):
    id: str
    name: str
    degrees: str
    specialization: str
    hospital: str
    city: str
    address: str
    latitude: float
    longitude: float
    experience_years: int
    consultation_fee: int
    rating: float
    review_count: int
    is_verified: bool
    image_avatar: str
    distance_km: Optional[float] = None
    match_score: Optional[float] = None
    available_slots: List[DoctorAvailabilitySlot] = []

# Appointment Schemas
class BookAppointmentRequest(BaseModel):
    doctor_id: str
    date: str
    time_slot: str
    reason: str
    screening_id: Optional[str] = None
    notes: Optional[str] = None

class AppointmentRecord(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: str
    hospital: str
    date: str
    time_slot: str
    status: str  # "Confirmed", "Completed", "Cancelled"
    screening_id: Optional[str] = None
    screening_summary: Optional[str] = None
    doctor_notes: Optional[str] = None
    created_at: str

class DoctorNotesUpdate(BaseModel):
    clinical_remarks: str
    diagnosis_confirmed: Optional[str] = None
    prescription: Optional[str] = None
    follow_up_recommended: bool = False
    follow_up_date: Optional[str] = None

# Chatbot Schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # "en", "hi", "bn"
    screening_context: Optional[Dict[str, Any]] = None
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    language: str
    is_emergency: bool = False
    emergency_warning: Optional[str] = None
    suggested_actions: List[str] = []

# Longitudinal Trend Tracking
class PatientTrendPoint(BaseModel):
    date: str
    risk_score: float
    risk_level: str
    primary_condition: str
    confidence: float
    screening_id: str

class PatientTrendSummary(BaseModel):
    patient_id: str
    patient_name: str
    total_screenings: int
    trend_direction: str  # "Stable", "Improving", "Deteriorating"
    trend_description: str
    history_points: List[PatientTrendPoint]
