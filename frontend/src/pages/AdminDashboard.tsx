import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  FileText, 
  Activity, 
  Bell, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Eye, 
  Search, 
  Filter, 
  Check, 
  X, 
  Lock, 
  Server, 
  Database, 
  Cpu, 
  ExternalLink, 
  ChevronRight, 
  Loader2, 
  EyeOff, 
  Award, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Info, 
  ShieldAlert,
  Sliders,
  CheckCircle
} from 'lucide-react';
import { api, getAssetUrl } from '../services/api';
import { 
  AdminDashboardStats, 
  AdminPatientItem, 
  AdminDoctorItem, 
  AdminScreeningItem, 
  AdminSystemHealth, 
  AdminAuditLogItem, 
  AdminNotificationItem,
  AdminProfileDetails
} from '../types';

export type AdminSection = 
  | 'dashboard' 
  | 'patients' 
  | 'doctors' 
  | 'reports' 
  | 'monitoring' 
  | 'notifications' 
  | 'profile' 
  | 'settings';

interface AdminDashboardProps {
  setActiveTab?: (tab: string) => void;
  initialSection?: AdminSection;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  setActiveTab, 
  initialSection = 'dashboard' 
}) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>(initialSection);

  // Synchronize section when prop updates (e.g. sidebar navigation)
  useEffect(() => {
    if (initialSection) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);

  const handleSectionSelect = (sec: AdminSection) => {
    setCurrentSection(sec);
    if (setActiveTab) {
      const tabMap: Record<AdminSection, string> = {
        dashboard: 'admin-dashboard',
        patients: 'admin-patients',
        doctors: 'admin-doctors',
        reports: 'admin-reports',
        monitoring: 'admin-monitoring',
        notifications: 'admin-notifications',
        profile: 'admin-profile',
        settings: 'admin-settings'
      };
      setActiveTab(tabMap[sec]);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // [1] DASHBOARD TELEMETRY STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await api.getAdminDashboardStats();
      setStats(data);
    } catch (err: any) {
      setStatsError(err.message || 'Failed to fetch dynamic dashboard metrics.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'dashboard') {
      fetchStats();
    }
  }, [currentSection]);

  // ══════════════════════════════════════════════════════════════════════════
  // [2] PATIENTS MANAGEMENT STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [patients, setPatients] = useState<AdminPatientItem[]>([]);
  const [patientsLoading, setPatientsLoading] = useState<boolean>(false);
  const [patientQuery, setPatientQuery] = useState<string>('');
  const [patientStatusUpdatingId, setPatientStatusUpdatingId] = useState<string | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<{ id: string; name: string; currentStatus: string; role: 'patient' | 'doctor' } | null>(null);

  const fetchPatients = async (query = patientQuery) => {
    setPatientsLoading(true);
    try {
      const data = await api.getAdminPatients(query);
      setPatients(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'patients') {
      fetchPatients();
    }
  }, [currentSection]);

  const handleConfirmToggleStatus = async () => {
    if (!statusModalUser) return;
    const targetStatus = statusModalUser.currentStatus === 'active' ? 'inactive' : 'active';
    const isDoc = statusModalUser.role === 'doctor';
    
    if (isDoc) setDoctorActionLoadingId(statusModalUser.id);
    else setPatientStatusUpdatingId(statusModalUser.id);

    try {
      if (isDoc) {
        await api.updateDoctorStatus(statusModalUser.id, targetStatus);
        setDoctors(prev => prev.map(d => d.id === statusModalUser.id ? { ...d, status: targetStatus } : d));
      } else {
        await api.updatePatientStatus(statusModalUser.id, targetStatus);
        setPatients(prev => prev.map(p => p.id === statusModalUser.id ? { ...p, status: targetStatus } : p));
      }
      setStatusModalUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update account status.');
    } finally {
      setDoctorActionLoadingId(null);
      setPatientStatusUpdatingId(null);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // [3] DOCTOR MANAGEMENT & VERIFICATION STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [doctors, setDoctors] = useState<AdminDoctorItem[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState<boolean>(false);
  const [doctorQuery, setDoctorQuery] = useState<string>('');
  const [doctorFilter, setDoctorFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [doctorActionLoadingId, setDoctorActionLoadingId] = useState<string | null>(null);
  
  // Verification Modal
  const [verifyModalDoctor, setVerifyModalDoctor] = useState<AdminDoctorItem | null>(null);
  const [verifyStatusChoice, setVerifyStatusChoice] = useState<'verified' | 'rejected'>('verified');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [verifySubmitting, setVerifySubmitting] = useState<boolean>(false);

  const fetchDoctors = async (query = doctorQuery) => {
    setDoctorsLoading(true);
    try {
      const data = await api.getAdminDoctors(query);
      setDoctors(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'doctors') {
      fetchDoctors();
    }
  }, [currentSection]);

  const handleOpenVerifyModal = (doc: AdminDoctorItem) => {
    setVerifyModalDoctor(doc);
    setVerifyStatusChoice(doc.verification_status === 'rejected' ? 'rejected' : 'verified');
    setVerifyNotes('');
  };

  const handleSubmitVerification = async () => {
    if (!verifyModalDoctor) return;
    setVerifySubmitting(true);
    try {
      await api.verifyDoctor(verifyModalDoctor.id, verifyStatusChoice, verifyNotes);
      setDoctors(prev => prev.map(d => d.id === verifyModalDoctor.id ? { ...d, verification_status: verifyStatusChoice } : d));
      setVerifyModalDoctor(null);
    } catch (err: any) {
      alert(err.message || 'Verification update failed.');
    } finally {
      setVerifySubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(d => {
    if (doctorFilter === 'all') return true;
    return d.verification_status === doctorFilter;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // [4] SCREENING REPORTS (TECHNICAL OVERSIGHT) STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [screenings, setScreenings] = useState<AdminScreeningItem[]>([]);
  const [screeningsLoading, setScreeningsLoading] = useState<boolean>(false);
  const [screeningQuery, setScreeningQuery] = useState<string>('');
  const [screeningStatusFilter, setScreeningStatusFilter] = useState<string>('all');
  const [inspectModalScreening, setInspectModalScreening] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  const fetchScreenings = async (status = screeningStatusFilter, query = screeningQuery) => {
    setScreeningsLoading(true);
    try {
      const data = await api.getAdminScreenings(status, query);
      setScreenings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setScreeningsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'reports') {
      fetchScreenings();
    }
  }, [currentSection, screeningStatusFilter]);

  const handleOpenTechnicalInspection = async (screeningId: string) => {
    setInspectLoading(true);
    try {
      const detail = await api.getAdminScreeningDetail(screeningId);
      setInspectModalScreening(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to inspect report technical data.');
    } finally {
      setInspectLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // [5] SYSTEM MONITORING STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const fetchSystemMonitoring = async () => {
    setHealthLoading(true);
    setAuditLoading(true);
    try {
      const [health, logs] = await Promise.all([
        api.getAdminSystemHealth(),
        api.getAdminAuditLogs(30)
      ]);
      setSystemHealth(health);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHealthLoading(false);
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'monitoring') {
      fetchSystemMonitoring();
    }
  }, [currentSection]);

  // ══════════════════════════════════════════════════════════════════════════
  // [6] NOTIFICATIONS STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [adminNotifs, setAdminNotifs] = useState<AdminNotificationItem[]>([]);
  const [notifsLoading, setNotifsLoading] = useState<boolean>(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<string>('all');

  const fetchAdminNotifications = async () => {
    setNotifsLoading(true);
    try {
      const data = await api.getAdminNotifications();
      setAdminNotifs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setNotifsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'notifications') {
      fetchAdminNotifications();
    }
  }, [currentSection]);

  const filteredNotifs = adminNotifs.filter(n => {
    if (notifCategoryFilter === 'all') return true;
    return n.category === notifCategoryFilter;
  });

  const handleToggleNotifRead = (id: string) => {
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
  };

  // ══════════════════════════════════════════════════════════════════════════
  // [7] MY PROFILE STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [adminProfile, setAdminProfile] = useState<AdminProfileDetails | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profName, setProfName] = useState<string>('');
  const [profPhone, setProfPhone] = useState<string>('');
  const [profCity, setProfCity] = useState<string>('');
  const [profSuccess, setProfSuccess] = useState<string | null>(null);
  const [profSaving, setProfSaving] = useState<boolean>(false);

  const fetchAdminProfile = async () => {
    setProfileLoading(true);
    try {
      const p = await api.getAdminProfile();
      setAdminProfile(p);
      setProfName(p.name);
      setProfPhone(p.phone || '');
      setProfCity(p.city || '');
    } catch (err: any) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'profile') {
      fetchAdminProfile();
    }
  }, [currentSection]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfSaving(true);
    setProfSuccess(null);
    try {
      await api.updateAdminProfile({ name: profName, phone: profPhone, city: profCity });
      setProfSuccess('Administrator profile details updated successfully.');
      if (adminProfile) {
        setAdminProfile({ ...adminProfile, name: profName, phone: profPhone, city: profCity });
      }
      setTimeout(() => setProfSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update admin profile.');
    } finally {
      setProfSaving(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // [8] SETTINGS & PASSWORD CHANGE STATE & LOGIC
  // ══════════════════════════════════════════════════════════════════════════
  const [currPw, setCurrPw] = useState<string>('');
  const [newPw, setNewPw] = useState<string>('');
  const [confirmPw, setConfirmPw] = useState<string>('');
  const [showCurrPw, setShowCurrPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [pwSaving, setPwSaving] = useState<boolean>(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await api.changeAdminPassword({
        current_password: currPw,
        new_password: newPw,
        confirm_password: confirmPw
      });
      setPwSuccess('Password changed securely. Use your new password on subsequent logins.');
      setCurrPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSuccess(null), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  // Top Section Selector Pill List
  const navTabs: { id: AdminSection; label: string; icon: any; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
    { id: 'patients', label: 'Patients', icon: Users, count: stats?.total_patients },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, count: stats?.total_doctors },
    { id: 'reports', label: 'Screening Reports', icon: FileText, count: stats?.total_screenings },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: adminNotifs.filter(n => !n.is_read).length || undefined },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-[#071426]">
      {/* ─── Top Horizontal Section Navigation Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-2xs overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSectionSelect(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#071426] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#19C7E8]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-[#0756B8] text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: DASHBOARD TELEMETRY                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Header & Quick Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0756B8]/10 text-[#0756B8] border border-[#0756B8]/20 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Executive Governance Telemetry</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#071426]">
                System Administrator Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Live platform statistics, clinical throughput, and diagnostic quality calculated from real database records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchStats}
                disabled={statsLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-60"
                title="Refresh Real-time Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-[#0756B8]' : ''}`} />
                <span>Refresh Telemetry</span>
              </button>
            </div>
          </div>

          {statsError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{statsError}</span>
            </div>
          )}

          {/* Quick Doctor Verification Notice Banner */}
          {stats && stats.pending_doctors_count > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950">
                    {stats.pending_doctors_count} Doctor Credential Request{stats.pending_doctors_count > 1 ? 's' : ''} Awaiting Approval
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Verify registered medical licenses to activate tele-ophthalmology sign-off privileges.
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSectionSelect('doctors')}
                className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                Review Doctors Queue →
              </button>
            </div>
          )}

          {/* 6 Real-time Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Total Patients */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</span>
                <div className="text-3xl font-black text-[#071426]">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.total_patients ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Registered in system database</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0756B8] border border-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Total Doctors */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Doctors</span>
                <div className="text-3xl font-black text-[#071426]">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.total_doctors ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">{stats?.verified_doctors_count ?? 0} verified</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">{stats?.pending_doctors_count ?? 0} pending</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Total Retinal Screenings */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Screenings</span>
                <div className="text-3xl font-black text-[#071426]">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.total_screenings ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Fundus images processed by AI
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0756B8] border border-cyan-100 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Awaiting Review */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Clinical Review</span>
                <div className="text-3xl font-black text-amber-700">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.reports_awaiting_review ?? 0}
                </div>
                <div className="text-[11px] text-amber-800 font-medium">
                  Pending ophthalmologist sign-off
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* 5. Reports Reviewed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports Evaluated</span>
                <div className="text-3xl font-black text-emerald-700">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.reports_reviewed ?? 0}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium">
                  Completed clinical triage & notes
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* 6. Technical Attention Needed */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requiring Technical Attention</span>
                <div className="text-3xl font-black text-rose-700">
                  {statsLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : stats?.reports_requiring_attention ?? 0}
                </div>
                <div className="text-[11px] text-rose-700 font-medium">
                  Ungradable, recaptures, or referrals
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick System Telemetry Summary Bar */}
          <div className="bg-[#071426] text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#19C7E8]">Live System Telemetry</span>
              </div>
              <div className="text-lg font-bold text-white">
                Platform Pipeline: <span className="text-emerald-400 font-extrabold">Healthy & Operational</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#19C7E8]" />
                  <span>AI Engine: EfficientNet-B4 (XAI Grad-CAM)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Store: JSON Persistence Layer</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>FastAPI Microservice (Port 8000)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleSectionSelect('monitoring')}
                className="px-4 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open System Monitoring</span>
              </button>
            </div>
          </div>

          {/* Dynamic Recent System Activity Stream */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#071426]">Live System Activity Stream</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real events dynamically streamed from database transactions</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Live Feed
              </span>
            </div>

            {statsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0756B8]" />
                <span className="text-xs text-slate-500">Loading audit events...</span>
              </div>
            ) : !stats?.recent_activity || stats.recent_activity.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_activity.map(act => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        act.type === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        act.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        act.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-blue-50 text-[#0756B8] border border-blue-100'
                      }`}>
                        {act.category === 'Screening' ? <Eye className="w-4 h-4" /> :
                         act.category === 'Doctor Verification' ? <Stethoscope className="w-4 h-4" /> :
                         act.category === 'Admin Governance' ? <ShieldCheck className="w-4 h-4" /> :
                         <Activity className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#071426] truncate">{act.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{act.category}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{act.time_ago}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: PATIENT MANAGEMENT                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'patients' && (
        <div className="space-y-6">
          {/* Header & Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0756B8]/10 text-[#0756B8] border border-[#0756B8]/20 mb-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Patient Governance Directory</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#071426]">Registered Patients</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Search patients, manage account access states, and view screening counts.
              </p>
            </div>
            
            <button
              onClick={() => fetchPatients()}
              disabled={patientsLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${patientsLoading ? 'animate-spin text-[#0756B8]' : ''}`} />
              <span>Refresh Patients</span>
            </button>
          </div>

          {/* Clinical Boundary Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-[#0756B8] shrink-0" />
            <span>
              <strong>Administrative Policy:</strong> System administrators cannot alter doctor clinical diagnoses or medical triage records. Patient account status modifications are tracked in the security audit log.
            </span>
          </div>

          {/* Search Controls */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={patientQuery}
                onChange={e => {
                  setPatientQuery(e.target.value);
                  fetchPatients(e.target.value);
                }}
                placeholder="Search patients by name, patient ID, email, or phone..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
              />
            </div>
          </div>

          {/* Patients Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-4 py-3.5">Patient ID</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Registered</th>
                    <th className="px-4 py-3.5">Screenings</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {patientsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0756B8]" />
                        <span>Loading patient directory...</span>
                      </td>
                    </tr>
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No registered patients matching query.
                      </td>
                    </tr>
                  ) : (
                    patients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#071426]">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.email || p.phone || 'No direct contact info'}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {p.id}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {p.city || 'Not specified'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {p.created_at?.split('T')[0] || '2026-06-01'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-[#0756B8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full text-[11px]">
                            {p.screening_count} scan{p.screening_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setStatusModalUser({ id: p.id, name: p.name, currentStatus: p.status, role: 'patient' })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              p.status === 'active'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: DOCTOR MANAGEMENT & VERIFICATION                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'doctors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Specialist Credential Board</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#071426]">Doctor Directory & Verification</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Inspect doctor credentials, verify state medical council numbers, and govern access status.
              </p>
            </div>

            <button
              onClick={() => fetchDoctors()}
              disabled={doctorsLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${doctorsLoading ? 'animate-spin text-[#0756B8]' : ''}`} />
              <span>Refresh Doctors</span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={doctorQuery}
                onChange={e => {
                  setDoctorQuery(e.target.value);
                  fetchDoctors(e.target.value);
                }}
                placeholder="Search doctors by name, email, or registration number..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              {(['all', 'verified', 'pending', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDoctorFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    doctorFilter === f
                      ? 'bg-[#071426] text-[#19C7E8] shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Doctor & Specialization</th>
                    <th className="px-4 py-3.5">Registration No</th>
                    <th className="px-4 py-3.5">Hospital / Clinic</th>
                    <th className="px-4 py-3.5">Screenings</th>
                    <th className="px-4 py-3.5">Verification</th>
                    <th className="px-4 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {doctorsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0756B8]" />
                        <span>Loading doctor records...</span>
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No doctors matching selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#071426]">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">{doc.qualifications || doc.specialization}</div>
                          <div className="text-[10px] text-slate-400">{doc.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {doc.medical_reg_no || 'Pending Submission'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {doc.hospital || 'Private Clinic'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full text-[11px]">
                            {doc.screening_count} reviewed
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {doc.verification_status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          ) : doc.verification_status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            doc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenVerifyModal(doc)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors"
                          >
                            Verify Credentials
                          </button>
                          <button
                            onClick={() => setStatusModalUser({ id: doc.id, name: doc.name, currentStatus: doc.status, role: 'doctor' })}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              doc.status === 'active'
                                ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {doc.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SCREENING REPORTS (TECHNICAL OVERSIGHT)                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-[#0756B8] border border-cyan-200 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Technical Optical Monitoring</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#071426]">Screening Reports Oversight</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Audit fundus scan gradability, optical quality scores, and ungradable scan logs. Read-only diagnostic access.
              </p>
            </div>

            <button
              onClick={() => fetchScreenings()}
              disabled={screeningsLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${screeningsLoading ? 'animate-spin text-[#0756B8]' : ''}`} />
              <span>Refresh Reports</span>
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={screeningQuery}
                onChange={e => {
                  setScreeningQuery(e.target.value);
                  fetchScreenings(screeningStatusFilter, e.target.value);
                }}
                placeholder="Search by Report ID, patient name, doctor, or condition..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Awaiting Review' },
                { id: 'reviewed', label: 'Reviewed' },
                { id: 'recapture_required', label: 'Recapture' },
                { id: 'referred', label: 'Referred' },
                { id: 'ungradable', label: 'Ungradable' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setScreeningStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    screeningStatusFilter === f.id
                      ? 'bg-[#071426] text-[#19C7E8] shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Screenings Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Report ID</th>
                    <th className="px-4 py-3.5">Patient</th>
                    <th className="px-4 py-3.5">Reviewer</th>
                    <th className="px-4 py-3.5">AI Condition & Risk</th>
                    <th className="px-4 py-3.5">Quality Metric</th>
                    <th className="px-4 py-3.5">Technical Flag</th>
                    <th className="px-4 py-3.5">Clinical Status</th>
                    <th className="px-5 py-3.5 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {screeningsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0756B8]" />
                        <span>Loading screening logs...</span>
                      </td>
                    </tr>
                  ) : screenings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No screening reports match the current query and filters.
                      </td>
                    </tr>
                  ) : (
                    screenings.map(s => (
                      <tr key={s.screening_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-[11px] font-bold text-[#0756B8] bg-blue-50 px-2 py-0.5 rounded-md">
                            {s.screening_id}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{s.date}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#071426]">{s.patient_name}</div>
                          <div className="text-[10px] text-slate-400">{s.patient_id}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {s.doctor_name || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{s.primary_condition}</div>
                          <span className={`text-[10px] font-bold ${
                            s.risk_level === 'High Risk' ? 'text-rose-600' :
                            s.risk_level === 'Moderate Risk' ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {s.risk_level} ({s.risk_score} pts)
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-700">{s.composite_quality.toFixed(1)}%</div>
                          <div className={`text-[10px] ${s.is_suitable ? 'text-emerald-600' : 'text-rose-600 font-bold'}`}>
                            {s.is_suitable ? 'Gradable' : 'Optical Issue'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.technical_status === 'normal' ? 'bg-emerald-50 text-emerald-700' :
                            s.technical_status === 'low_quality' ? 'bg-amber-50 text-amber-700' :
                            s.technical_status === 'ungradable' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {s.technical_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.review_status === 'reviewed' ? 'bg-emerald-50 text-emerald-700' :
                            s.review_status === 'recapture_required' ? 'bg-rose-50 text-rose-700' :
                            s.review_status === 'referred' ? 'bg-purple-50 text-purple-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {s.review_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenTechnicalInspection(s.screening_id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0756B8] hover:text-white text-[#071426] text-xs font-bold transition-all shadow-2xs"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: SYSTEM MONITORING                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnostic Telemetry & Health</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#071426]">System Health & Diagnostics</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time checks of microservices, PyTorch inference pipeline, and administrative audit logging.
              </p>
            </div>

            <button
              onClick={fetchSystemMonitoring}
              disabled={healthLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>Run Diagnostic Ping</span>
            </button>
          </div>

          {/* 4 Connected Services Diagnostics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* App Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Application State</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xl font-bold text-[#071426]">
                {systemHealth?.app_status || 'Healthy'}
              </div>
              <div className="text-[11px] text-slate-400">
                Core REST API & routing nominal
              </div>
            </div>

            {/* AI Model Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">AI Inference Engine</span>
                <Cpu className="w-4 h-4 text-[#0756B8]" />
              </div>
              <div className="text-base font-bold text-[#071426] truncate">
                {systemHealth?.ai_model_status || 'Active'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {systemHealth?.ai_model_name}
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Database Store</span>
                <Database className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-xl font-bold text-[#071426]">
                {systemHealth?.database_status || 'Connected'}
              </div>
              <div className="text-[11px] text-slate-400">
                {systemHealth?.database_records_count?.users ?? 0} users • {systemHealth?.database_records_count?.screenings ?? 0} screenings
              </div>
            </div>

            {/* Backend Uptime */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Service Uptime</span>
                <Server className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-[#071426]">
                {systemHealth ? `${Math.floor(systemHealth.backend_uptime_seconds / 60)}m ${Math.floor(systemHealth.backend_uptime_seconds % 60)}s` : '0m'}
              </div>
              <div className="text-[11px] text-slate-400">
                Continuous background daemon
              </div>
            </div>
          </div>

          {/* Database Breakdown & Security Protection Notice */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-[#071426]">Database Record Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {systemHealth?.database_records_count && Object.entries(systemHealth.database_records_count).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{key.replace('_', ' ')}</span>
                    <div className="text-lg font-black text-[#071426]">{val}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 flex items-center gap-2 border border-slate-200/60">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Confidential environment secrets, cryptographic salts, and raw storage paths are strictly masked from admin views.</span>
              </div>
            </div>

            {/* System Error Logs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-[#071426]">Recent System Errors</h3>
              {!systemHealth?.recent_errors || systemHealth.recent_errors.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
                  <div className="font-bold text-slate-700">Zero Critical Failures</div>
                  <p>All microservices and database read/write queries nominal.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {systemHealth.recent_errors.map(err => (
                    <div key={err.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                      <div className="font-bold">{err.type}</div>
                      <div className="text-[11px] text-rose-700">{err.message}</div>
                      <div className="text-[10px] text-rose-500 mt-1">{err.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#071426]">Administrative Audit Trail</h3>
                <p className="text-xs text-slate-400">Tamper-evident record of administrative inspections and state mutations</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Last 30 Events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Administrator</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Resource</th>
                    <th className="px-4 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {log.timestamp?.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[#071426] whitespace-nowrap">
                        {log.admin_name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px]">
                        {log.resource_type}: <span className="font-mono text-slate-500">{log.resource_id}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: ADMIN NOTIFICATIONS                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Administrative Alert Broadcasts</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#071426]">System Alerts & Verification Queues</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Actionable alerts regarding doctor verification, optical image capture defects, and system announcements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchAdminNotifications}
                disabled={notifsLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-60 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${notifsLoading ? 'animate-spin text-[#0756B8]' : ''}`} />
                <span>Refresh Alerts</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'doctor_verification', label: 'Doctor Verifications' },
              { id: 'technical_alert', label: 'Image Quality Alerts' },
              { id: 'system_announcement', label: 'System Announcements' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setNotifCategoryFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  notifCategoryFilter === tab.id
                    ? 'bg-[#071426] text-[#19C7E8] shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="space-y-3">
            {notifsLoading ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0756B8]" />
                <span>Checking system alerts...</span>
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-bold text-[#071426]">No Alerts in Selected Category</div>
                <p className="text-xs">All doctor verification queues and optical scans are handled.</p>
              </div>
            ) : (
              filteredNotifs.map(notif => (
                <div
                  key={notif.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex items-start justify-between gap-4 ${
                    notif.is_read ? 'border-slate-200/80 opacity-75' : 'border-[#0756B8]/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.category === 'doctor_verification' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      notif.category === 'technical_alert' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-blue-50 text-[#0756B8] border border-blue-200'
                    }`}>
                      {notif.category === 'doctor_verification' ? <Stethoscope className="w-4 h-4" /> :
                       notif.category === 'technical_alert' ? <AlertTriangle className="w-4 h-4" /> :
                       <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#071426]">{notif.title}</span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#19C7E8]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <div className="text-[10px] text-slate-400">{notif.created_at?.split('T')[0]}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notif.action_url === 'admin-doctors' && (
                      <button
                        onClick={() => handleSectionSelect('doctors')}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
                      >
                        Review Doctor
                      </button>
                    )}
                    {notif.action_url === 'admin-reports' && (
                      <button
                        onClick={() => handleSectionSelect('reports')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors"
                      >
                        View Scans
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleNotifRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title={notif.is_read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check className={`w-4 h-4 ${notif.is_read ? 'text-slate-300' : 'text-slate-600'}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: MY PROFILE                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0756B8] border border-blue-200 mb-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              <span>Executive Identity</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#071426]">Administrator Profile</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your personal administrative contact details and identity information.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-[#071426] text-[#19C7E8] flex items-center justify-center font-black text-xl shadow-md border border-slate-700">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-[#071426]">{adminProfile?.name || 'Sudipta Santra'}</div>
                <div className="text-xs text-slate-500">{adminProfile?.email || 'santrasudipta70@gmail.com'}</div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0756B8]/10 text-[#0756B8] border border-[#0756B8]/20">
                  Role: {adminProfile?.role || 'admin'}
                </span>
              </div>
            </div>

            {profSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#071426] mb-1">Full Name</label>
                <input
                  type="text"
                  value={profName}
                  onChange={e => setProfName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#071426] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={e => setProfPhone(e.target.value)}
                    placeholder="+91 99999 88888"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#071426] mb-1">Headquarters City</label>
                  <input
                    type="text"
                    value={profCity}
                    onChange={e => setProfCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profSaving}
                  className="px-6 py-2.5 bg-[#0756B8] hover:bg-[#054494] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {profSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 8: SETTINGS & PASSWORD MANAGEMENT                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentSection === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Security & Infrastructure</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#071426]">Settings & Credentials</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Change administrator password securely and review system deployment specifications.
            </p>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#071426] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0756B8]" />
                <span>Change Administrator Password</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Passwords must be at least 6 characters. Validated securely using bcrypt hashing.
              </p>
            </div>

            {pwError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#071426] mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrPw ? 'text' : 'password'}
                    value={currPw}
                    onChange={e => setCurrPw(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrPw(!showCurrPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#071426] mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#071426] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pwSaving}
                className="px-6 py-2.5 bg-[#071426] hover:bg-[#0c2240] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Administrator Password'}
              </button>
            </form>
          </div>

          {/* Platform Configuration Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#071426]">Platform Specifications & Environment</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">System Application</span>
                <span className="font-bold text-[#071426]">Netra AI Diabetic Retinopathy Screening</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Core Engine Version</span>
                <span className="font-mono font-bold text-[#0756B8]">v1.4-XAI (Grad-CAM Saliency)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Architecture Mode</span>
                <span className="font-bold text-[#071426]">Unified Hybrid (React Vite + FastAPI Microservice)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">ABDM Health ID Bridge</span>
                <span className="text-emerald-700 font-bold">Enabled (Ayushman Bharat Verification)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Maintenance Mode</span>
                <span className="text-emerald-700 font-bold">Disabled (Production Active)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: DOCTOR VERIFICATION REVIEW                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {verifyModalDoctor && (
        <div className="fixed inset-0 z-50 bg-[#071426]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <Award className="w-3.5 h-3.5" />
                  <span>Credential Verification</span>
                </div>
                <h3 className="text-lg font-bold text-[#071426]">Verify Doctor Credentials</h3>
              </div>
              <button onClick={() => setVerifyModalDoctor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="font-bold text-[#071426] text-sm">{verifyModalDoctor.name}</div>
              <div className="text-slate-600">{verifyModalDoctor.qualifications} • {verifyModalDoctor.specialization}</div>
              <div className="text-slate-500">Hospital: {verifyModalDoctor.hospital || 'Not specified'}</div>
              <div className="font-mono text-purple-700 font-bold">Reg No: {verifyModalDoctor.medical_reg_no || 'Pending'}</div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#071426]">Verification Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyStatusChoice('verified')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    verifyStatusChoice === 'verified'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve (Verified)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyStatusChoice('rejected')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    verifyStatusChoice === 'rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Credentials</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#071426]">Verification Remarks & Regulatory Notes</label>
              <textarea
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                placeholder="e.g. Cross-referenced with National Medical Commission (NMC) public registry. Qualifications verified."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#19C7E8] text-[#071426]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalDoctor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={verifySubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#071426] hover:bg-[#0c2240] text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {verifySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ACCOUNT STATUS TOGGLE CONFIRMATION (PATIENT OR DOCTOR)           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-[#071426]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#071426]">
                {statusModalUser.currentStatus === 'active' ? 'Deactivate Account?' : 'Reactivate Account?'}
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to {statusModalUser.currentStatus === 'active' ? 'deactivate' : 'reactivate'} the {statusModalUser.role} account for{' '}
                <span className="font-semibold text-slate-800">{statusModalUser.name}</span> ({statusModalUser.id})?{' '}
                {statusModalUser.currentStatus === 'active'
                  ? 'The user will be immediately blocked from signing into Netra AI.'
                  : 'The user will be granted access to sign in again.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={Boolean(patientStatusUpdatingId || doctorActionLoadingId)}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                  statusModalUser.currentStatus === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {(patientStatusUpdatingId || doctorActionLoadingId) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : statusModalUser.currentStatus === 'active' ? (
                  'Deactivate Account'
                ) : (
                  'Reactivate Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
