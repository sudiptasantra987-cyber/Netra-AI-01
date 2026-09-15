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
