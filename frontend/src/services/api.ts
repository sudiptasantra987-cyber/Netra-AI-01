import { 
  User, 
  UserProfile,
  NotificationItem,
  AbdmCard,
  AbdmCardStatus,
  QualityMetrics, 
  ScreeningResult, 
  DoctorProfile, 
  DoctorSlot, 
  AppointmentRecord, 
  ChatResponse, 
  PatientTrendSummary,
  ResearchMetrics
} from '../types';

const API_BASE = '/api';

function getHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('netra_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/**
 * Bulletproof JSON response parser that never throws
 * "SyntaxError: Unexpected end of JSON input" on empty, HTML, or interrupted responses.
 */
async function safeJson<T = any>(res: Response, defaultVal: any = {}): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return defaultVal;
    }
    return JSON.parse(text);
  } catch {
    return defaultVal;
  }
}

/**
 * Parses HTTP error response safely without crashing on empty bodies.
 */
async function parseError(res: Response, fallback: string): Promise<Error> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return new Error(fallback || `Request failed (${res.status})`);
    }
    try {
      const err = JSON.parse(text);
      let message = fallback;
      if (typeof err.detail === 'string') {
        message = err.detail;
      } else if (Array.isArray(err.detail)) {
        message = err.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
      } else if (err.detail?.message) {
        message = err.detail.message;
      } else if (err.message) {
        message = err.message;
      }
      const errorObj: any = new Error(message || fallback);
      if (err.detail?.quality) errorObj.quality = err.detail.quality;
      return errorObj;
    } catch {
      return new Error(text.length > 200 ? fallback : text || fallback);
    }
  } catch {
    return new Error(fallback || `Request failed (${res.status})`);
  }
}

export const api = {
  // Auth
  async login(id: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id, identifier: id, password })
      });
      if (!res.ok) {
        throw await parseError(res, 'Login failed');
      }
      const data = await safeJson(res);
      if (data?.access_token) {
        localStorage.setItem('netra_token', data.access_token);
      }
      return data;
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please verify the backend service is running.');
      }
      throw err;
    }
  },

  async register(userData: any): Promise<{ access_token: string; user: User }> {
    try {
      const rawId = (userData.identifier || userData.email || userData.phone || '').trim();
      const payload = {
        ...userData,
        identifier: rawId,
        email: userData.email || (rawId.includes('@') ? rawId : undefined),
        phone: userData.phone || (!rawId.includes('@') ? rawId : undefined)
      };
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw await parseError(res, 'Registration failed');
      }
      const data = await safeJson(res);
      if (data?.access_token) {
        localStorage.setItem('netra_token', data.access_token);
      }
      return data;
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please verify the backend service is running.');
      }
      throw err;
    }
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch user profile');
    return safeJson(res);
  },

  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; reset_code?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to request password reset');
    }
    return safeJson(res);
  },

  async resetPassword(data: { identifier: string; code: string; new_password: string; confirm_password?: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Password reset failed');
    }
    return safeJson(res);
  },

  // OTP Registration (optional/legacy)
  async registerRequestOtp(data: {
    name: string;
    destination: string;
    destination_type: 'email' | 'phone';
    password: string;
    confirm_password?: string;
    role?: string;
    country_code?: string;
  }): Promise<{ success: boolean; message: string; cooldown_seconds: number; expires_in_seconds: number }> {
    const res = await fetch(`${API_BASE}/auth/register/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to send OTP');
    }
    return safeJson(res);
  },

  async registerVerifyOtp(data: {
    destination: string;
    destination_type: 'email' | 'phone';
    otp: string;
  }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'OTP verification failed');
    }
    const result = await safeJson(res);
    if (result?.access_token) {
      localStorage.setItem('netra_token', result.access_token);
    }
    return result;
  },

  async registerResendOtp(data: {
    destination: string;
    destination_type: 'email' | 'phone';
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to resend OTP');
    }
    return safeJson(res);
  },

  // OTP Forgot Password
  async forgotPasswordRequestOtp(data: {
    destination: string;
    destination_type: 'email' | 'phone';
  }): Promise<{ success: boolean; message: string; cooldown_seconds: number }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to send OTP');
    }
    return safeJson(res);
  },

  async forgotPasswordReset(data: {
    destination: string;
    destination_type: 'email' | 'phone';
    otp: string;
    new_password: string;
    confirm_password?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Password reset failed');
    }
    return safeJson(res);
  },

  async forgotPasswordResendOtp(data: {
    destination: string;
    destination_type: 'email' | 'phone';
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to resend OTP');
    }
    return safeJson(res);
  },

  // Profile API
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to fetch user profile');
    }
    return safeJson(res);
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to update profile');
    }
    return safeJson(res);
  },

  // Notifications API
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to fetch notifications');
    }
    return safeJson(res, []);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean; unread_count: number }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to mark notification as read');
    }
    return safeJson(res, { success: true, unread_count: 0 });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean; unread_count: number }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to mark all notifications as read');
    }
    return safeJson(res, { success: true, unread_count: 0 });
  },

  // ABDM & Ayushman Card API
  async getAbdmCard(): Promise<AbdmCardStatus> {
    const res = await fetch(`${API_BASE}/abdm/card`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to fetch ABDM card status');
    }
    return safeJson(res, { linked: false, official_gateway_available: false });
  },

  async linkAbdmCard(data: {
    abha_id: string;
    pmjay_id?: string;
    consent_given: boolean;
    demo_mode?: boolean;
  }): Promise<AbdmCard> {
    const res = await fetch(`${API_BASE}/abdm/card/link`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to link Ayushman / ABHA details');
    }
    return safeJson(res);
  },

  async removeAbdmCard(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/abdm/card`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      throw await parseError(res, 'Failed to remove Ayushman Card');
    }
    return safeJson(res, { success: true, message: 'Card removed' });
  },

  // Screening
  async checkQuality(file: File): Promise<QualityMetrics> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/screening/quality-check`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      throw await parseError(res, 'Quality check failed');
    }
    return safeJson(res);
  },

  async analyzeScreening(
    file?: File, 
    sampleKey?: string, 
    patientId?: string, 
    patientName?: string,
    bypassQuality = false
  ): Promise<ScreeningResult> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (sampleKey) formData.append('sample_key', sampleKey);
    if (patientId) formData.append('patient_id', patientId);
    if (patientName) formData.append('patient_name', patientName);
    formData.append('bypass_quality_check', String(bypassQuality));

    const res = await fetch(`${API_BASE}/screening/analyze`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      throw await parseError(res, 'AI Screening failed');
    }
    return safeJson(res);
  },

  async getMyScreeningHistory(): Promise<ScreeningResult[]> {
    const res = await fetch(`${API_BASE}/screening/history`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch screening history');
    return safeJson(res, []);
  },

  async getPatientScreeningHistory(patientId: string): Promise<ScreeningResult[]> {
    const res = await fetch(`${API_BASE}/screening/history/${patientId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch screening history');
    return safeJson(res, []);
  },

  async getSampleImages(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/screening/samples`);
    if (!res.ok) throw await parseError(res, 'Failed to fetch samples');
    return safeJson(res, []);
  },

  // Doctors
  async searchDoctors(params: {
    lat?: number;
    lng?: number;
    city?: string;
    condition?: string;
    date?: string;
  }): Promise<DoctorProfile[]> {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', String(params.lat));
    if (params.lng !== undefined) query.set('lng', String(params.lng));
    if (params.city) query.set('city', params.city);
    if (params.condition) query.set('condition', params.condition);
    if (params.date) query.set('date', params.date);

    const res = await fetch(`${API_BASE}/doctors/search?${query.toString()}`);
    if (!res.ok) throw await parseError(res, 'Failed to search doctors');
    return safeJson(res, []);
  },

  async getDoctorSlots(docId: string, date: string): Promise<DoctorSlot[]> {
    const res = await fetch(`${API_BASE}/doctors/${docId}/slots?date=${date}`);
    if (!res.ok) throw await parseError(res, 'Failed to fetch doctor slots');
    return safeJson(res, []);
  },

  // Appointments
  async bookAppointment(data: {
    doctor_id: string;
    date: string;
    time_slot: string;
    reason: string;
    screening_id?: string;
    notes?: string;
  }, patientId = 'pat-01', patientName = 'Sunita Roy'): Promise<AppointmentRecord> {
    const res = await fetch(`${API_BASE}/appointments/book?patient_id=${patientId}&patient_name=${encodeURIComponent(patientName)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw await parseError(res, 'Appointment booking failed');
    }
    return safeJson(res);
  },

  async getPatientAppointments(patientId: string): Promise<AppointmentRecord[]> {
    const res = await fetch(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch patient appointments');
    return safeJson(res, []);
  },

  async getDoctorAppointments(doctorId: string): Promise<AppointmentRecord[]> {
    const res = await fetch(`${API_BASE}/appointments/doctor/${doctorId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch doctor appointments');
    return safeJson(res, []);
  },

  async updateDoctorNotes(appointmentId: string, notes: { clinical_remarks: string; diagnosis_confirmed?: string }): Promise<AppointmentRecord> {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}/notes`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(notes)
    });
    if (!res.ok) throw await parseError(res, 'Failed to update doctor notes');
    return safeJson(res);
  },

  // AI Chatbot
  async sendChatMessage(message: string, language = 'en', screeningContext?: any): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        language,
        screening_context: screeningContext
      })
    });
    if (!res.ok) throw await parseError(res, 'Chatbot response error');
    return safeJson(res);
  },

  // Longitudinal Trends
  async getMyTrend(): Promise<PatientTrendSummary> {
    const res = await fetch(`${API_BASE}/trends/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch trend data');
    return safeJson(res);
  },

  async getPatientTrend(patientId: string): Promise<PatientTrendSummary> {
    const res = await fetch(`${API_BASE}/trends/patient/${patientId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch trend data');
    return safeJson(res);
  },

  // Reports
  async getClinicalReport(screeningId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${screeningId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch report');
    return safeJson(res);
  },

  async deleteClinicalReport(screeningId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/reports/${screeningId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to delete clinical report');
    return safeJson(res, { success: true, message: 'Report deleted successfully' });
  },

  // Admin & Research Analytics
  async getSystemStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/system-stats`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch system stats');
    return safeJson(res);
  },

  async getResearchMetrics(): Promise<ResearchMetrics> {
    const res = await fetch(`${API_BASE}/admin/research-metrics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch research metrics');
    return safeJson(res);
  },

  async getModelVersions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/model-versions`, {
      headers: getHeaders()
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch model versions');
    return safeJson(res, []);
  }
};
