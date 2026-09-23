export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'patient' | 'doctor' | 'admin';
  age?: number;
  gender?: string;
  phone?: string;
  city?: string;
  specialization?: string;
  verification_status?: 'verified' | 'pending' | 'rejected' | 'revoked' | string;
  verification_notes?: string;
  medical_reg_no?: string;
  hospital?: string;
  qualifications?: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  profile_picture?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  bio?: string;
  medical_reg_no?: string;
  qualifications?: string;
  specialization?: string;
  hospital?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface AbdmCard {
  card_id: string;
  user_id: string;
  abha_id_masked: string;
  pmjay_id_masked?: string;
  beneficiary_name?: string;
  demo_mode: boolean;
  linked_at: string;
  status: string;
}

export interface AbdmCardStatus {
  linked: boolean;
  card?: AbdmCard | null;
  official_gateway_available: boolean;
}

export interface QualityMetrics {
  sharpness_score: number;
  brightness_score: number;
  contrast_score: number;
  noise_level: number;
  resolution_ok: boolean;
  width: number;
  height: number;
  composite_quality: number;
  is_suitable: boolean;
  status_label: 'Excellent' | 'Suitable' | 'Insufficient Quality';
  rejection_reasons: string[];
  guidance: string;
}

export interface DiseasePrediction {
  condition: string;
  confidence: number;
  description: string;
  severity_level: 'None' | 'Mild' | 'Moderate' | 'Severe';
}

export interface ScreeningResult {
  screening_id: string;
  patient_id: string;
  patient_name?: string;
  timestamp: string;
  date?: string;
  image_url: string;
  quality: QualityMetrics;
  primary_condition: string;
  primary_confidence: number;
  all_predictions: DiseasePrediction[];
  risk_level: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  risk_score: number;
  clinical_recommendation: string;
  gradcam_image_base64?: string;
  affected_quadrants: string[];
  is_gradable?: boolean;
  status?: string;
  patient_notes?: string;
  review_status?: string;
  clinical_notes?: string;
  diagnosis_confirmed?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  model_version: string;
}

export interface DoctorSlot {
  slot_id: string;
  date: string;
  time: string;
  is_available: boolean;
}

export interface DoctorProfile {
  id: string;
  name: string;
  degrees: string;
  specialization: string;
  hospital: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  experience_years: number;
  consultation_fee: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  image_avatar: string;
  distance_km?: number;
  match_score?: number;
  available_slots: DoctorSlot[];
}

export interface AppointmentRecord {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  hospital: string;
  date: string;
  time_slot: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  reason?: string;
  screening_id?: string;
  screening_summary?: string;
  doctor_notes?: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  language: string;
  is_emergency: boolean;
  emergency_warning?: string;
  suggested_actions: string[];
}

export interface PatientTrendPoint {
  date: string;
  risk_score: number;
  risk_level: string;
  primary_condition: string;
  confidence: number;
  screening_id: string;
}

export interface PatientTrendSummary {
  patient_id: string;
  patient_name: string;
  total_screenings: number;
  trend_direction: 'Stable' | 'Improving' | 'Deteriorating';
  trend_description: string;
  history_points: PatientTrendPoint[];
}

export interface ResearchMetrics {
  model_name: string;
  dataset_name: string;
  dataset_split: string;
  overall_accuracy: number;
  sensitivity_recall: number;
  specificity: number;
  f1_score: number;
  roc_auc_macro: number;
  classes: string[];
  confusion_matrix: number[][];
  roc_curves: Record<string, { fpr: number; tpr: number }[]>;
  matlab_script_code: string;
}

export interface DoctorActivityItem {
  screening_id: string;
  patient_id: string;
  patient_name: string;
  date: string;
  timestamp: string;
  primary_condition: string;
  risk_level: string;
  risk_score: number;
  review_status: string;
  image_url: string;
}

export interface DoctorDashboardStats {
  doctor_id: string;
  doctor_name: string;
  total_patients: number;
  reports_awaiting_review: number;
  reports_reviewed: number;
  reports_urgent: number;
  recent_activity: DoctorActivityItem[];
}

export interface DoctorPatientSummary {
  patient_id: string;
  patient_name: string;
  email?: string;
  phone?: string;
  city?: string;
  age?: number;
  gender?: string;
  total_screenings: number;
  latest_screening_date?: string;
  latest_condition?: string;
  latest_risk_level?: string;
  latest_review_status?: string;
}

export interface RetinalFinding {
  name: string;
  category: string;
  present: boolean;
  description: string;
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface DoctorScreeningDetail {
  screening_id: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  patient_city?: string;
  patient_phone?: string;
  timestamp: string;
  date: string;
  image_url: string;
  quality: QualityMetrics;
  is_gradable: boolean;
  primary_condition: string;
  primary_confidence: number;
  all_predictions: DiseasePrediction[];
  risk_level: string;
  risk_score: number;
  clinical_recommendation: string;
  gradcam_image_base64?: string;
  affected_quadrants: string[];
  retinal_findings: RetinalFinding[];
  review_status: 'pending' | 'reviewed' | 'needs_further_examination' | 'recapture_required' | 'referred';
  clinical_notes?: string;
  diagnosis_confirmed?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  model_version: string;
}

export interface ScreeningReviewUpdateRequest {
  review_status: 'reviewed' | 'needs_further_examination' | 'recapture_required' | 'referred';
  clinical_notes: string;
  diagnosis_confirmed?: string;
}

export interface DoctorProfileDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  medical_reg_no?: string;
  qualifications?: string;
  specialization?: string;
  hospital?: string;
  city?: string;
  address?: string;
  profile_picture?: string;
  bio?: string;
}

// Admin Portal Types
export interface AdminActivityItem {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  time_ago: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface AdminDashboardStats {
  total_patients: number;
  total_doctors: number;
  total_screenings: number;
  reports_awaiting_review: number;
  reports_reviewed: number;
  reports_requiring_attention: number;
  verified_doctors_count: number;
  pending_doctors_count: number;
  recent_activity: AdminActivityItem[];
}

export interface AdminPatientItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  status: 'active' | 'inactive';
  created_at: string;
  screening_count: number;
  last_screening_date?: string;
}

export interface AdminDoctorItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  medical_reg_no?: string;
  qualifications?: string;
  specialization?: string;
  hospital?: string;
  city?: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  status: 'active' | 'inactive';
  screening_count: number;
  created_at: string;
}

export interface AdminScreeningItem {
  screening_id: string;
  patient_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name?: string;
  date: string;
  timestamp: string;
  primary_condition: string;
  risk_level: string;
  risk_score: number;
  review_status: string;
  is_suitable: boolean;
  composite_quality: number;
  technical_status: 'normal' | 'ungradable' | 'low_quality' | 'failed_upload';
  rejection_reasons: string[];
  image_url: string;
}

export interface AdminSystemHealth {
  app_status: 'Healthy' | 'Degraded' | 'Offline';
  ai_model_status: string;
  ai_model_name: string;
  ai_checkpoint_found: boolean;
  database_status: string;
  database_records_count: Record<string, number>;
  backend_uptime_seconds: number;
  timestamp: string;
  recent_errors: Array<{
    id: string;
    type: string;
    message: string;
    details: string;
    timestamp: string;
  }>;
}

export interface AdminAuditLogItem {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  details: string;
}

export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'doctor_verification' | 'technical_alert' | 'system_announcement';
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface AdminProfileDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role: string;
  created_at: string;
}


