import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home as HomeIcon,
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldCheck, 
  Activity, 
  FileCheck, 
  Save, 
  Edit3, 
  Loader2, 
  Building, 
  Award, 
  Phone, 
  Mail, 
  MapPin, 
  Sliders,
  ZoomIn,
  Layers,
  ArrowUpRight,
  Info,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getAssetUrl } from '../services/api';
import { 
  DoctorDashboardStats, 
  DoctorPatientSummary, 
  DoctorScreeningDetail, 
  DoctorProfileDetails,
  NotificationItem,
  ScreeningResult
} from '../types';

export type DoctorPortalSection = 
  | 'dashboard' 
  | 'patients' 
  | 'reports' 
  | 'notifications' 
  | 'profile' 
  | 'settings';

interface DoctorPortalProps {
  setActiveTab?: (tab: string) => void;
  initialSection?: DoctorPortalSection;
  onStartScreening?: (patient: { id: string; name: string; age?: number; gender?: string; city?: string }) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ 
  setActiveTab, 
  initialSection = 'dashboard',
  onStartScreening
}) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<DoctorPortalSection>(initialSection);

  // Synchronize section if prop changes
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Telemetry & Stats State
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Patients State
  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any | null>(null);
  const [loadingPatientDetail, setLoadingPatientDetail] = useState<boolean>(false);

  // Screening Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState<string>('');
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);
  const [activeReportDetail, setActiveReportDetail] = useState<DoctorScreeningDetail | null>(null);
  const [loadingReportDetail, setLoadingReportDetail] = useState<boolean>(false);

  // Clinical Review Form State
  const [reviewStatusInput, setReviewStatusInput] = useState<string>('reviewed');
  const [clinicalNotesInput, setClinicalNotesInput] = useState<string>('');
  const [diagnosisConfirmedInput, setDiagnosisConfirmedInput] = useState<string>('');
  const [savingReview, setSavingReview] = useState<boolean>(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewErrorMessage, setReviewErrorMessage] = useState<string | null>(null);

  // Heatmap View Mode: 'original' | 'heatmap' | 'side-by-side'
  const [viewMode, setViewMode] = useState<'original' | 'heatmap' | 'side-by-side'>('side-by-side');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Doctor Profile State
  const [profile, setProfile] = useState<DoctorProfileDetails | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState<Partial<DoctorProfileDetails>>({});
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Settings State
  const [clinicName, setClinicName] = useState<string>(() => localStorage.getItem('netra_clinic_name') || 'Rural Vision Center Hub #4 (Purulia)');
  const [alertThreshold, setAlertThreshold] = useState<number>(75);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Walk-in Patient Enrollment State
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [enrollingPatient, setEnrollingPatient] = useState<boolean>(false);
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    city: '',
    email: ''
  });
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const handleEnrollPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.name.trim()) {
      setEnrollError('Patient name is required.');
      return;
    }
    setEnrollingPatient(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    try {
      const res = await api.enrollPatient({
        name: enrollForm.name.trim(),
        age: enrollForm.age ? parseInt(enrollForm.age, 10) : undefined,
        gender: enrollForm.gender,
        phone: enrollForm.phone.trim() || undefined,
        city: enrollForm.city.trim() || undefined,
        email: enrollForm.email.trim() || undefined
      });
      setEnrollSuccess(res.message || 'Patient enrolled successfully.');
      setEnrollForm({ name: '', age: '', gender: 'Male', phone: '', city: '', email: '' });
      await loadPatients();
      if (res.patient?.patient_id) {
        loadPatientDetail(res.patient.patient_id);
      }
      setTimeout(() => {
        setShowEnrollModal(false);
        setEnrollSuccess(null);
      }, 1500);
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll patient.');
    } finally {
      setEnrollingPatient(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Load section-specific data when activeSection changes
  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboardStats();
    } else if (activeSection === 'patients') {
      loadPatients();
    } else if (activeSection === 'reports') {
      loadReports();
    } else if (activeSection === 'notifications') {
      loadNotifications();
    } else if (activeSection === 'profile') {
      loadProfile();
    }
  }, [activeSection]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getDoctorDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching doctor dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPatients = async (query = patientSearch) => {
    try {
      setLoadingPatients(true);
      const data = await api.getDoctorPatients(query);
      setPatients(data);
    } catch (err) {
      console.error('Error fetching assigned patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPatientDetail = async (patientId: string) => {
    try {
      setSelectedPatientId(patientId);
      setLoadingPatientDetail(true);
      const data = await api.getDoctorPatientDetails(patientId);
      setSelectedPatientDetail(data);
    } catch (err) {
      console.error('Error fetching patient details:', err);
    } finally {
      setLoadingPatientDetail(false);
    }
  };

  const loadReports = async (status = reportStatusFilter, query = reportSearch) => {
    try {
      setLoadingReports(true);
      const data = await api.getDoctorReports(status, query);
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports queue:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const openReportDetail = async (screeningId: string) => {
    try {
      setActiveScreeningId(screeningId);
      setLoadingReportDetail(true);
      setReviewSuccessMessage(null);
      setReviewErrorMessage(null);
      const detail = await api.getDoctorReportDetails(screeningId);
      setActiveReportDetail(detail);
      setReviewStatusInput(detail.review_status && detail.review_status !== 'pending' ? detail.review_status : 'reviewed');
      setClinicalNotesInput(detail.clinical_notes || '');
      setDiagnosisConfirmedInput(detail.diagnosis_confirmed || detail.primary_condition || '');
    } catch (err) {
      console.error('Error loading report detail:', err);
    } finally {
      setLoadingReportDetail(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScreeningId) return;
    try {
      setSavingReview(true);
      setReviewSuccessMessage(null);
      setReviewErrorMessage(null);

      const res = await api.updateDoctorReportReview(activeScreeningId, {
        review_status: reviewStatusInput as any,
        clinical_notes: clinicalNotesInput,
        diagnosis_confirmed: diagnosisConfirmedInput
      });

      setReviewSuccessMessage(res.message || 'Clinical evaluation recorded successfully.');
      // Refresh report detail and stats
      openReportDetail(activeScreeningId);
      loadReports();
      loadDashboardStats();
    } catch (err: any) {
      setReviewErrorMessage(err.message || 'Failed to submit clinical review.');
    } finally {
      setSavingReview(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching doctor notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await api.getDoctorProfile();
      setProfile(data);
      setProfileForm({
        name: data.name,
        medical_reg_no: data.medical_reg_no,
        qualifications: data.qualifications,
        specialization: data.specialization,
        hospital: data.hospital,
        phone: data.phone,
        city: data.city,
        address: data.address,
        bio: data.bio
      });
    } catch (err) {
      console.error('Error loading doctor profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccessMsg(null);
      const updated = await api.updateDoctorProfile(profileForm);
      setProfile(updated);
      setIsEditingProfile(false);
      setProfileSuccessMsg('Doctor profile credentials saved successfully.');
    } catch (err: any) {
      console.error('Error updating doctor profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (setActiveTab) setActiveTab('login');
  };

  // Nav item definitions strictly matching user requirement order:
  // 1. Home, 2. Patients, 3. Screening Reports, 4. Settings, 5. Logout
  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, isHome: true },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'reports', label: 'Screening Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row gap-6 text-[#071426]">
      {/* ── Left Sidebar (Doctor Portal 5-section navigation) ───────────────── */}
      <aside className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between shrink-0 h-fit lg:sticky lg:top-20">
        <div>
          {/* Doctor Info Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0756B8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'DR'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#071426] truncate">
                {user?.name || 'Doctor'}
              </div>
              <div className="text-[10px] text-slate-500 truncate flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-[#0756B8]" />
                <span>Verified Ophthalmologist</span>
              </div>
            </div>
          </div>

          {/* Navigation Items (1-4) */}
          <nav className="space-y-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive = !item.isHome && activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isHome) {
                      if (setActiveTab) setActiveTab('home');
                      return;
                    }
                    setActiveSection(item.id as DoctorPortalSection);
                    if (setActiveTab) {
                      if (item.id === 'patients') setActiveTab('doctor-patients');
                      else if (item.id === 'reports') setActiveTab('doctor-reports');
                      else if (item.id === 'settings') setActiveTab('doctor-settings');
                    }
                    // Clear drill-downs
                    if (item.id === 'reports') setActiveScreeningId(null);
                    if (item.id === 'patients') setSelectedPatientId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0756B8] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0756B8] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#0756B8]' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 7. Logout Item */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Doctor Verification Status Warning Banner */}
        {user?.role === 'doctor' && user?.verification_status !== 'verified' && (
          <div className={`p-4 rounded-2xl border mb-6 flex items-start space-x-3 shadow-xs ${
            user?.verification_status === 'rejected' || user?.verification_status === 'revoked'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
              user?.verification_status === 'rejected' || user?.verification_status === 'revoked' ? 'text-rose-600' : 'text-amber-600'
            }`} />
            <div className="flex-1 text-xs">
              <div className="font-bold text-sm">
                {user?.verification_status === 'rejected'
                  ? 'Doctor Verification Rejected'
                  : user?.verification_status === 'revoked'
                  ? 'Clinical Privileges Revoked'
                  : 'Account Verification Pending'}
              </div>
              <p className="mt-1 leading-relaxed">
                {user?.verification_status === 'rejected'
                  ? `Your doctor credentials were rejected by Netra AI Administration. Reason: ${user?.verification_notes || 'Credentials could not be verified.'}. Retinal screening and clinical reporting remain disabled.`
                  : user?.verification_status === 'revoked'
                  ? `Your clinical privileges have been revoked by Netra AI Administration. Reason: ${user?.verification_notes || 'Privileges revoked.'}. You cannot perform screenings or finalize reports.`
                  : 'Your account is currently under review by the Netra AI Administration team. Retinal screening and clinical reporting will be enabled once your credentials and medical registration are confirmed.'}
              </p>
              {user?.verification_status === 'pending' && (
                <div className="mt-2 text-[11px] font-medium text-amber-700">
                  Medical Registration No: <span className="font-mono">{user?.medical_reg_no || 'Submitted'}</span> • Expected administrative review within 24 hours.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 1: DASHBOARD
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#071426] to-[#0a2344] text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#19C7E8]/10 text-[#19C7E8] text-[11px] font-bold tracking-wide uppercase border border-[#19C7E8]/30 mb-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Clinical Tele-Screening Portal</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Welcome, {user?.name || 'Dr. Sengupta'}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {clinicName} • Review retinal fundus screenings, evaluate Explainable AI heatmaps, and issue clinical decisions for rural communities.
                </p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <button
                  onClick={() => {
                    setActiveSection('reports');
                    setReportStatusFilter('pending');
                    loadReports('pending');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review Pending Scans</span>
                </button>
              </div>
            </div>

            {/* 4 Dynamic Statistics Cards (Actual Database Calculation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Patients */}
              <div 
                onClick={() => {
                  setActiveSection('patients');
                  setSelectedPatientId(null);
                  if (setActiveTab) setActiveTab('doctor-patients');
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-[#0756B8]/40 hover:shadow-sm transition-all cursor-pointer group"
                title="Click to view Patients Directory"
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#0756B8]">
                    Total Assigned Patients
                  </div>
                  <div className="text-2xl font-black text-[#071426] mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.total_patients ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Under active care & screening
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0756B8] flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Awaiting Review */}
              <div 
                onClick={() => {
                  setActiveSection('reports');
                  setReportStatusFilter('pending');
                  loadReports('pending');
                  if (setActiveTab) setActiveTab('doctor-reports');
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group"
                title="Click to view Pending Reports"
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700">
                    Awaiting Review
                  </div>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.reports_awaiting_review ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Requires clinical sign-off
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Reports Reviewed */}
              <div 
                onClick={() => {
                  setActiveSection('reports');
                  setReportStatusFilter('reviewed');
                  loadReports('reviewed');
                  if (setActiveTab) setActiveTab('doctor-reports');
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
                title="Click to view Reviewed Reports"
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700">
                    Reports Reviewed
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.reports_reviewed ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Evaluated by ophthalmologist
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Urgent Clinical Flags */}
              <div 
                onClick={() => {
                  setActiveSection('reports');
                  setReportStatusFilter('urgent');
                  loadReports('urgent');
                  if (setActiveTab) setActiveTab('doctor-reports');
                }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer group"
                title="Click to view Urgent High-Risk Reports"
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-rose-700">
                    Urgent / High Risk
                  </div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {loadingStats ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (stats?.reports_urgent ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Proliferative DR / High Score
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recent Patient Screening Activity */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#0756B8]" />
                  <h3 className="text-sm font-bold text-[#071426]">Recent Patient Screening Activity</h3>
                </div>
                <button
                  onClick={() => {
                    setActiveSection('reports');
                    setReportStatusFilter('all');
                    loadReports('all');
                    if (setActiveTab) setActiveTab('doctor-reports');
                  }}
                  className="text-xs font-semibold text-[#0756B8] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View Full Reports Queue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loadingStats ? (
                <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                  <span>Loading recent clinical activity...</span>
                </div>
              ) : !stats?.recent_activity || stats.recent_activity.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-700">No Patient Screening Records Yet</div>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When fundus photographs are uploaded and assigned to your care, screening activity and risk indicators will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Screening Date</th>
                        <th className="py-3 px-4">AI Finding</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4">Clinical Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recent_activity.map((act) => (
                        <tr key={act.screening_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setActiveSection('patients');
                                setSelectedPatientId(act.patient_id);
                                loadPatientDetail(act.patient_id);
                                if (setActiveTab) setActiveTab('doctor-patients');
                              }}
                              className="text-left font-bold text-[#071426] hover:text-[#0756B8] hover:underline cursor-pointer block"
                              title="View patient history"
                            >
                              {act.patient_name || 'Patient'}
                            </button>
                            <div className="text-[10px] text-slate-400 font-mono">{act.patient_id}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {act.date || act.timestamp.split('T')[0]}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {act.primary_condition}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              act.risk_level === 'High Risk'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : act.risk_level === 'Moderate Risk'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {act.risk_level} ({act.risk_score}%)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              act.review_status === 'reviewed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : act.review_status === 'recapture_required'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : act.review_status === 'referred'
                                ? 'bg-blue-50 text-[#0756B8] border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {act.review_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setActiveSection('reports');
                                openReportDetail(act.screening_id);
                                if (setActiveTab) setActiveTab('doctor-reports');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0756B8] hover:bg-[#064696] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                            >
                              <span>Review</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 2: PATIENTS (PATIENT MANAGEMENT)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'patients' && (
          <div className="space-y-6">
            {/* Search & Header */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                  <Users className="w-5 h-5 text-[#0756B8]" />
                  <span>Assigned Patients Directory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View patients assigned to your ophthalmic care, search medical history, and access screening records.
                </p>
              </div>

              {/* Search input and Enroll button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or phone..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      loadPatients(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#0756B8] focus:border-[#0756B8] outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#19C7E8]" />
                  <span>Enroll Patient</span>
                </button>
              </div>
            </div>

            {/* Patients List & Selected Patient Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Patients Table / Cards (7 cols) */}
              <div className={`${selectedPatientDetail ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  {loadingPatients ? (
                    <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                      <span>Loading assigned patients...</span>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-700">No Patients Found</div>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        {patientSearch ? 'No patients matching your search criteria.' : 'No patients currently assigned to your doctor account in the database.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Patient Name & ID</th>
                            <th className="py-3 px-4">Demographics</th>
                            <th className="py-3 px-4">Total Scans</th>
                            <th className="py-3 px-4">Latest Condition</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patients.map((pat) => {
                            const isSelected = selectedPatientId === pat.patient_id;
                            return (
                              <tr 
                                key={pat.patient_id}
                                className={`transition-colors cursor-pointer ${
                                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'
                                }`}
                                onClick={() => loadPatientDetail(pat.patient_id)}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#071426]">{pat.patient_name || 'Patient'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{pat.patient_id}</div>
                                  {pat.phone && <div className="text-[10px] text-slate-500">{pat.phone}</div>}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  <div>{pat.age ? `${pat.age} yrs` : 'Age N/A'} • {pat.gender || 'N/A'}</div>
                                  <div className="text-[10px] text-slate-400">{pat.city || 'Location N/A'}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                    {pat.total_screenings} screening(s)
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-medium text-slate-800 truncate max-w-[150px]">
                                    {pat.latest_condition || 'Normal Eye Anatomy'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {pat.latest_screening_date || 'No recent scan'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onStartScreening) {
                                          onStartScreening({
                                            id: pat.patient_id,
                                            name: pat.patient_name,
                                            age: pat.age,
                                            gender: pat.gender,
                                            city: pat.city
                                          });
                                        } else if (setActiveTab) {
                                          setActiveTab('screening');
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#0756B8] hover:bg-[#064696] text-white text-[11px] font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                                      title="Start Screening"
                                    >
                                      <Eye className="w-3 h-3 text-[#19C7E8]" />
                                      <span>Screen</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        loadPatientDetail(pat.patient_id);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      History
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Selected Patient Profile & Chronological Screening History (5 cols) */}
              {selectedPatientDetail && (
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 sticky top-20">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Patient Profile</div>
                        <h3 className="text-base font-bold text-[#071426]">{selectedPatientDetail.patient.name}</h3>
                        <div className="text-xs text-slate-500 font-mono">{selectedPatientDetail.patient.id}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPatientId(null);
                          setSelectedPatientDetail(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Demographics details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Age / Gender</div>
                        <div className="font-bold text-slate-700">
                          {selectedPatientDetail.patient.age ? `${selectedPatientDetail.patient.age} yrs` : 'Not provided'} • {selectedPatientDetail.patient.gender || 'Not provided'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Location</div>
                        <div className="font-bold text-slate-700 truncate">
                          {selectedPatientDetail.patient.city || 'Not provided'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                        <div className="text-[10px] text-slate-400 font-semibold">Contact</div>
                        <div className="font-medium text-slate-700 truncate">
                          {selectedPatientDetail.patient.phone || 'No phone'} • {selectedPatientDetail.patient.email || 'No email'}
                        </div>
                      </div>
                    </div>

                    {/* Action: Start Screening for selected patient */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (onStartScreening) {
                            onStartScreening({
                              id: selectedPatientDetail.patient.id,
                              name: selectedPatientDetail.patient.name,
                              age: selectedPatientDetail.patient.age,
                              gender: selectedPatientDetail.patient.gender,
                              city: selectedPatientDetail.patient.city
                            });
                          } else if (setActiveTab) {
                            setActiveTab('screening');
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
                      >
                        <Eye className="w-4 h-4 text-[#19C7E8]" />
                        <span>Start Retinal Screening for {selectedPatientDetail.patient.name.split(' ')[0]}</span>
                      </button>
                    </div>

                    {/* Screening History Timeline */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-xs font-bold text-[#071426] flex items-center justify-between">
                        <span>Retinal Screening History</span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {selectedPatientDetail.total_screenings} total
                        </span>
                      </div>

                      {selectedPatientDetail.screenings.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center">
                          No screening records for this patient.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {selectedPatientDetail.screenings.map((sc: any) => (
                            <div 
                              key={sc.screening_id}
                              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-[#0756B8] transition-all flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1 mr-2">
                                <div className="font-bold text-[#071426] truncate">{sc.primary_condition}</div>
                                <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                  <span>{sc.date || sc.timestamp.split('T')[0]}</span>
                                  <span>•</span>
                                  <span className={`font-semibold ${
                                    sc.risk_level === 'High Risk' ? 'text-rose-600' : 'text-slate-600'
                                  }`}>{sc.risk_level}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveSection('reports');
                                  openReportDetail(sc.screening_id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#0756B8] hover:bg-[#064696] text-white text-[10px] font-bold shrink-0 shadow-xs cursor-pointer"
                              >
                                View Report
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 3: AI SCREENING REPORT REVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'reports' && (
          <div className="space-y-6">
            {/* If no report is selected, show Reports Queue */}
            {!activeScreeningId ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-[#0756B8]" />
                      <span>AI Screening Reports Queue</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review fundus photographs, assess AI predictions and Grad-CAM saliency heatmaps, and record official clinical evaluations.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient, scan ID..."
                      value={reportSearch}
                      onChange={(e) => {
                        setReportSearch(e.target.value);
                        loadReports(reportStatusFilter, e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#0756B8] outline-none"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'All Reports' },
                    { id: 'pending', label: 'Awaiting Review' },
                    { id: 'reviewed', label: 'Reviewed' },
                    { id: 'urgent', label: 'Urgent / High Risk' },
                    { id: 'needs_further_examination', label: 'Needs Further Exam' },
                    { id: 'recapture_required', label: 'Recapture Required' },
                    { id: 'referred', label: 'Referred' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setReportStatusFilter(tab.id);
                        loadReports(tab.id, reportSearch);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        reportStatusFilter === tab.id
                          ? 'bg-[#0756B8] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Reports List Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  {loadingReports ? (
                    <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                      <span>Loading screening reports...</span>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-700">No Reports in this Queue</div>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        No screening reports match the selected status filter.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-4">Report ID & Date</th>
                            <th className="py-3 px-4">Patient</th>
                            <th className="py-3 px-4">AI Prediction</th>
                            <th className="py-3 px-4">Quality & Gradability</th>
                            <th className="py-3 px-4">Review Status</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reports.map((r) => {
                            const isGradable = r.quality?.is_suitable !== false;
                            const status = r.review_status || 'pending';
                            return (
                              <tr key={r.screening_id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#071426] font-mono">{r.screening_id}</div>
                                  <div className="text-[10px] text-slate-500">{r.date || r.timestamp?.split('T')[0]}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{r.patient_name || 'Patient'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{r.patient_id}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{r.primary_condition}</div>
                                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                                    <span>Conf: {r.primary_confidence}%</span>
                                    <span>•</span>
                                    <span className={r.risk_level === 'High Risk' ? 'text-rose-600 font-bold' : ''}>
                                      {r.risk_level}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isGradable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {isGradable ? 'Gradable' : 'Ungradable'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    status === 'reviewed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : status === 'recapture_required'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : status === 'referred'
                                      ? 'bg-blue-50 text-[#0756B8] border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => openReportDetail(r.screening_id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#0756B8] hover:bg-[#064696] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1"
                                  >
                                    <span>Inspect & Review</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Dedicated Diagnostic Review Studio for Selected Report */
              <div className="space-y-6">
                {/* Back to Queue Bar */}
                <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-slate-200/80 shadow-xs">
                  <button
                    onClick={() => {
                      setActiveScreeningId(null);
                      setActiveReportDetail(null);
                      loadReports();
                    }}
                    className="text-xs font-bold text-[#0756B8] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Screening Reports Queue</span>
                  </button>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Report Reference:</span>
                    <span className="font-mono font-bold text-[#071426]">{activeScreeningId}</span>
                  </div>
                </div>

                {loadingReportDetail || !activeReportDetail ? (
                  <div className="bg-white rounded-2xl p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2 border border-slate-200/80 shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0756B8]" />
                    <span>Loading retinal scan data & Grad-CAM tensors...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Fundus Imagery, Quality, & AI Saliency (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Fundus Image Viewer with Explainable Heatmap */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-[#0756B8]" />
                            <h3 className="text-sm font-bold text-[#071426]">Fundus Photography & Explainable AI (XAI)</h3>
                          </div>

                          {/* View Mode Toggle */}
                          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => setViewMode('original')}
                              className={`px-2.5 py-1 rounded-lg transition-all ${
                                viewMode === 'original' ? 'bg-white text-[#0756B8] shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              Original
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('heatmap')}
                              className={`px-2.5 py-1 rounded-lg transition-all ${
                                viewMode === 'heatmap' ? 'bg-white text-[#0756B8] shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              Grad-CAM
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('side-by-side')}
                              className={`px-2.5 py-1 rounded-lg transition-all ${
                                viewMode === 'side-by-side' ? 'bg-white text-[#0756B8] shadow-xs' : 'text-slate-600'
                              }`}
                            >
                              Side-by-Side
                            </button>
                          </div>
                        </div>

                        {/* Image Display */}
                        <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-center min-h-[320px] overflow-hidden">
                          {viewMode === 'side-by-side' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                              <div className="space-y-1.5 text-center">
                                <div className="text-[10px] uppercase font-bold text-slate-400">Original Fundus Image</div>
                                <img
                                  src={getAssetUrl(activeReportDetail.image_url)}
                                  alt="Original Fundus"
                                  className="w-full h-64 object-contain rounded-xl bg-black border border-slate-800"
                                />
                              </div>
                              <div className="space-y-1.5 text-center">
                                <div className="text-[10px] uppercase font-bold text-[#19C7E8]">Grad-CAM Attention Heatmap</div>
                                {activeReportDetail.gradcam_image_base64 ? (
                                  <img
                                    src={`data:image/jpeg;base64,${activeReportDetail.gradcam_image_base64}`}
                                    alt="Grad-CAM Heatmap"
                                    className="w-full h-64 object-contain rounded-xl bg-black border border-slate-800"
                                  />
                                ) : (
                                  <div className="w-full h-64 flex items-center justify-center text-xs text-slate-500 rounded-xl bg-black border border-slate-800">
                                    Heatmap calculation pending
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : viewMode === 'original' ? (
                            <img
                              src={getAssetUrl(activeReportDetail.image_url)}
                              alt="Original Fundus"
                              className="max-h-96 object-contain rounded-xl"
                            />
                          ) : (
                            activeReportDetail.gradcam_image_base64 ? (
                              <img
                                src={`data:image/jpeg;base64,${activeReportDetail.gradcam_image_base64}`}
                                alt="Grad-CAM Heatmap"
                                className="max-h-96 object-contain rounded-xl"
                              />
                            ) : (
                              <div className="text-xs text-slate-400">No Grad-CAM overlay available</div>
                            )
                          )}
                        </div>

                        {/* Affected Quadrants */}
                        {activeReportDetail.affected_quadrants && activeReportDetail.affected_quadrants.length > 0 && (
                          <div className="space-y-1.5 text-xs">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              AI Salient Anatomical Quadrants
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {activeReportDetail.affected_quadrants.map((quad, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0756B8] border border-blue-200 text-[11px] font-semibold">
                                  {quad}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Image Quality Assessment & Gradability */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#071426] flex items-center space-x-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#0756B8]" />
                            <span>Image Quality Assessment & Gradability</span>
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeReportDetail.is_gradable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {activeReportDetail.is_gradable ? 'Image is Gradable' : 'Image is Ungradable (Recapture Advised)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 font-semibold">Sharpness</div>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">
                              {activeReportDetail.quality.sharpness_score.toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 font-semibold">Brightness</div>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">
                              {activeReportDetail.quality.brightness_score.toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 font-semibold">Contrast</div>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">
                              {activeReportDetail.quality.contrast_score.toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <div className="text-[10px] text-slate-400 font-semibold">Composite Quality</div>
                            <div className="font-bold text-slate-800 text-sm mt-0.5">
                              {activeReportDetail.quality.composite_quality.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {activeReportDetail.quality.guidance && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <strong>Guidance:</strong> {activeReportDetail.quality.guidance}
                          </div>
                        )}
                      </div>

                      {/* Detected Retinal Findings (Morphological Feature Extraction) */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#071426] flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#0756B8]" />
                            <span>Detected Retinal Findings (AI Feature Extraction)</span>
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Assisted Diagnostic Biomarkers
                          </span>
                        </div>

                        <div className="space-y-2">
                          {activeReportDetail.retinal_findings.map((finding, idx) => (
                            <div 
                              key={idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                  <span>{finding.name}</span>
                                  <span className="text-[10px] font-normal text-slate-400">({finding.category})</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  {finding.description}
                                </p>
                              </div>
                              <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                finding.severity === 'Severe'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : finding.severity === 'Moderate'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {finding.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: AI Severity, Patient Info, Clinical Assessment (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Patient & Screening Meta Card */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Overview</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-[#071426]">{activeReportDetail.patient_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{activeReportDetail.patient_id}</div>
                          </div>
                          <div className="text-right text-slate-500">
                            <div>{activeReportDetail.patient_age ? `${activeReportDetail.patient_age} yrs` : 'Age N/A'} • {activeReportDetail.patient_gender || 'Gender N/A'}</div>
                            <div className="text-[10px]">{activeReportDetail.patient_city || 'Location N/A'}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Captured: {activeReportDetail.date}</span>
                          <span className="font-mono text-[10px]">{activeReportDetail.model_version}</span>
                        </div>
                      </div>

                      {/* AI Prediction & Severity Card */}
                      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl p-5 border border-blue-100 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-900">
                            AI Diagnostic Screening
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeReportDetail.risk_level === 'High Risk'
                              ? 'bg-rose-100 text-rose-800'
                              : activeReportDetail.risk_level === 'Moderate Risk'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {activeReportDetail.risk_level} (Score: {activeReportDetail.risk_score}%)
                          </span>
                        </div>

                        <div>
                          <div className="text-lg font-black text-[#071426]">
                            {activeReportDetail.primary_condition}
                          </div>
                          <div className="text-xs font-semibold text-[#0756B8] mt-0.5">
                            AI Confidence: {activeReportDetail.primary_confidence.toFixed(1)}%
                          </div>
                        </div>

                        {activeReportDetail.clinical_recommendation && (
                          <div className="p-3 rounded-xl bg-white/80 border border-blue-100 text-xs text-slate-700 leading-relaxed">
                            <strong>AI Triage Guidance:</strong> {activeReportDetail.clinical_recommendation}
                          </div>
                        )}
                      </div>

                      {/* Doctor Clinical Assessment & Sign-off Form */}
                      <form onSubmit={handleSaveReview} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                          <FileCheck className="w-4 h-4 text-[#0756B8]" />
                          <h3 className="text-sm font-bold text-[#071426]">Doctor Clinical Assessment</h3>
                        </div>

                        {reviewSuccessMessage && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{reviewSuccessMessage}</span>
                          </div>
                        )}

                        {reviewErrorMessage && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>{reviewErrorMessage}</span>
                          </div>
                        )}

                        {/* Status Radio Selector */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Clinical Evaluation Status</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {[
                              { id: 'reviewed', label: '1. Reviewed (Confirmed)', desc: 'Valid screening' },
                              { id: 'needs_further_examination', label: '2. Needs Further Exam', desc: 'Slit-lamp/OCT recommended' },
                              { id: 'recapture_required', label: '3. Image Recapture', desc: 'Blurry or poor aperture' },
                              { id: 'referred', label: '4. Specialist Referral', desc: 'Tertiary retina referral' }
                            ].map((opt) => (
                              <label
                                key={opt.id}
                                className={`p-2.5 rounded-xl border flex flex-col cursor-pointer transition-all ${
                                  reviewStatusInput === opt.id
                                    ? 'bg-blue-50 border-[#0756B8] ring-1 ring-[#0756B8]'
                                    : 'border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name="review_status"
                                    value={opt.id}
                                    checked={reviewStatusInput === opt.id}
                                    onChange={(e) => setReviewStatusInput(e.target.value)}
                                    className="text-[#0756B8] focus:ring-[#0756B8]"
                                  />
                                  <span className="font-bold text-slate-800 text-xs">{opt.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 pl-5 mt-0.5">{opt.desc}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Confirmed Diagnosis */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Confirmed Clinical Diagnosis
                          </label>
                          <input
                            type="text"
                            value={diagnosisConfirmedInput}
                            onChange={(e) => setDiagnosisConfirmedInput(e.target.value)}
                            placeholder="e.g. Mild Non-Proliferative Diabetic Retinopathy (NPDR)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                          />
                        </div>

                        {/* Clinical Remarks & Notes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Clinical Remarks & Ophthalmic Notes
                          </label>
                          <textarea
                            rows={4}
                            value={clinicalNotesInput}
                            onChange={(e) => setClinicalNotesInput(e.target.value)}
                            placeholder="Record slit-lamp correlation, vascular remarks, intraocular pressure notes, or prescription..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8] resize-none"
                          />
                        </div>

                        {/* Reviewer Meta if previously evaluated */}
                        {activeReportDetail.reviewed_by && (
                          <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                            <span>Last Reviewed by: <strong>{activeReportDetail.reviewed_by}</strong></span>
                            <span>{activeReportDetail.reviewed_at ? activeReportDetail.reviewed_at.split('T')[0] : ''}</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={savingReview}
                          className="w-full py-2.5 px-4 rounded-xl bg-[#0756B8] hover:bg-[#064696] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          {savingReview ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Review to Medical Record...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save & Sign-off Clinical Review</span>
                            </>
                          )}
                        </button>
                      </form>

                      {/* Explicit Medical Legal Disclaimer */}
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start space-x-2">
                        <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                        <div>
                          <strong>Medical Disclaimers:</strong> Netra AI predictions and Grad-CAM saliency overlays are computer-assisted triage indications and do not constitute a confirmed diagnostic finding. Clinical confirmation by the consulting ophthalmologist is strictly required before therapeutic intervention.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 4: NOTIFICATIONS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-[#0756B8]" />
                  <span>Doctor Clinical Notifications</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Screening assignments, urgent high-risk alerts, and image recapture requests.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllNotifsRead}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {loadingNotifs ? (
                <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                  <span>Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-slate-700">No Notifications</div>
                  <p className="text-[11px] text-slate-400">
                    You have no new clinical alerts or assigned screening notifications.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`p-4 transition-colors flex items-start justify-between gap-3 ${
                      !n.is_read ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'recapture_required' ? 'bg-purple-100 text-purple-700' :
                        n.type === 'referral' ? 'bg-blue-100 text-[#0756B8]' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#071426] flex items-center space-x-2">
                          <span>{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#0756B8]" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {n.created_at ? n.created_at.split('T')[0] : 'Just now'}
                        </div>
                      </div>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkNotifRead(n.id)}
                        className="text-[11px] font-bold text-[#0756B8] hover:underline shrink-0 cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 5: MY PROFILE (DOCTOR PROFILE)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                  <UserIcon className="w-5 h-5 text-[#0756B8]" />
                  <span>Doctor Profile & Credentials</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage medical license credentials, qualifications, affiliated hospital, and clinic information.
                </p>
              </div>

              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {loadingProfile ? (
              <div className="p-16 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                <span>Loading doctor credentials...</span>
              </div>
            ) : !isEditingProfile ? (
              /* Read-only View */
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                {/* Identity Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-2xl bg-[#0756B8] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                    {profile?.name ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'DR'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#071426]">{profile?.name || user?.name || 'Doctor'}</h3>
                    <div className="text-xs font-semibold text-[#0756B8]">
                      {profile?.specialization || 'Vitreo-Retinal Surgeon'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile?.hospital || 'Hospital affiliation not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Credentials Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Medical Registration No.</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.medical_reg_no || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Qualifications & Degrees</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.qualifications || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hospital / Clinic Affiliation</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.hospital || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.email || user?.email || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone Number</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.phone || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>City / Practice Location</span>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {profile?.city || <span className="text-slate-400 font-normal italic">Not provided</span>}
                    </div>
                  </div>
                </div>

                {/* Bio / Practice summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Clinical Biography & Specializations</div>
                  <p className="text-slate-700 leading-relaxed">
                    {profile?.bio || <span className="text-slate-400 italic">No clinical biography provided. Click 'Edit Profile' to add your ophthalmic background.</span>}
                  </p>
                </div>
              </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Doctor Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="e.g. Dr. Ananya Sengupta"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Medical Registration Number</label>
                    <input
                      type="text"
                      value={profileForm.medical_reg_no || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, medical_reg_no: e.target.value })}
                      placeholder="e.g. WBMC-68421"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Qualifications & Degrees</label>
                    <input
                      type="text"
                      value={profileForm.qualifications || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                      placeholder="e.g. MBBS, MS (Ophthalmology), FVRF"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Specialization</label>
                    <input
                      type="text"
                      value={profileForm.specialization || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      placeholder="e.g. Vitreo-Retinal Surgeon"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Hospital / Clinic Affiliation</label>
                    <input
                      type="text"
                      value={profileForm.hospital || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                      placeholder="e.g. Sankara Nethralaya, Kolkata"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98310 98765"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Practice City / Clinic Address</label>
                    <input
                      type="text"
                      value={profileForm.city || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Clinical Biography</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Clinical background, retinal subspecialty experience..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8] resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile Information</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SECTION 6: SETTINGS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h2 className="text-base font-bold text-[#071426] flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-[#0756B8]" />
                <span>Doctor Portal Clinical Settings</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure tele-ophthalmology outreach hubs, AI triage alert thresholds, and clinical notification preferences.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Outreach and notification preferences saved.</span>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Primary Tele-Screening Outreach Hub</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                />
                <p className="text-[11px] text-slate-400">
                  Displayed on screening sign-offs and patient diagnostic summaries.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="block text-slate-700 font-bold">
                  Urgent High-Risk Alert Threshold: {alertThreshold}%
                </label>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-full max-w-lg accent-[#0756B8]"
                />
                <p className="text-[11px] text-slate-400">
                  Screenings with AI risk scores equal to or exceeding this value will be flagged with high priority for immediate specialist review.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('netra_clinic_name', clinicName);
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 3000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center space-x-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Clinical Preferences</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Enroll Walk-In Patient Modal ────────────────────────────────────── */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center border border-[#bcdbff]">
                  <Plus className="w-5 h-5 text-[#0756B8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#071426]">Enroll Walk-In Patient</h3>
                  <p className="text-xs text-slate-500">Register patient for clinical retinal screening</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollError(null);
                  setEnrollSuccess(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enrollError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            {enrollSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{enrollSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEnrollPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={enrollForm.name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 52"
                    value={enrollForm.age}
                    onChange={(e) => setEnrollForm({ ...enrollForm, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={enrollForm.gender}
                    onChange={(e) => setEnrollForm({ ...enrollForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Village</label>
                  <input
                    type="text"
                    placeholder="e.g. Purulia"
                    value={enrollForm.city}
                    onChange={(e) => setEnrollForm({ ...enrollForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="Leave empty for auto-generated ID"
                  value={enrollForm.email}
                  onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#0756B8]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollingPatient}
                  className="px-5 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {enrollingPatient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#19C7E8]" />
                      <span>Register Patient</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
