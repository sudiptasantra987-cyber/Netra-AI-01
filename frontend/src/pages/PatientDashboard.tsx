import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Bot, 
  Stethoscope, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Activity,
  Plus,
  ChevronRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';
import { api } from '../services/api';
import { AppointmentRecord, PatientTrendSummary } from '../types';

interface PatientDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { latestResult } = useScreening();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [trendRecord, setTrendRecord] = useState<PatientTrendSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const patientId = user?.id || 'pat-01';
      const [appts, trends] = await Promise.all([
        api.getPatientAppointments(patientId),
        api.getPatientTrend(patientId)
      ]);
      setAppointments(appts);
      setTrendRecord(trends);
    } catch (err) {
      console.error('Failed to fetch patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine current risk level & image
  const hasLatestResult = Boolean(latestResult);
  const riskLevel = latestResult?.risk_level || 'No Scans Yet';
  const isHighRisk = Boolean(latestResult && riskLevel.toLowerCase().includes('high'));
  const isMediumRisk = Boolean(latestResult && (riskLevel.toLowerCase().includes('medium') || riskLevel.toLowerCase().includes('moderate')));

  const riskBadgeClass = isHighRisk
    ? 'bg-red-50 text-red-700 border-red-200'
    : isMediumRisk
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : latestResult
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const previewImage = latestResult?.image_url;
  const lastScreeningDate = latestResult?.timestamp 
    ? new Date(latestResult.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const upcomingAppt = appointments.length > 0 ? appointments[0] : null;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Patient Profile Bar near Dashboard */}
      <div className="card-clean p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#0756B8] border-2 border-[#19C7E8] text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {(user?.name || 'User').charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#071426] text-sm">{user?.name || 'User'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#edf5ff] text-[#0756B8] border border-[#bcdbff] uppercase">
                {user?.role || 'Patient'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Account ID: <span className="font-mono text-slate-700 font-medium">{user?.id || 'Patient'}</span> • {user?.city || 'Location not set'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-semibold text-xs transition-all shadow-sm flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
          >
            <User className="w-3.5 h-3.5" />
            <span>View Profile & Health ID</span>
          </button>
        </div>
      </div>

      {/* Eye Health Risk Top Card matching Screen 3 */}
      <div className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 max-w-md">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Eye Health Risk Status
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${riskBadgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-amber-500' : latestResult ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{riskLevel}</span>
            </span>
            {lastScreeningDate && (
              <span className="text-xs text-slate-400 font-medium">
                Last Screening: {lastScreeningDate}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {hasLatestResult ? (
              isHighRisk
                ? 'Abnormal microvascular signals detected. Immediate specialist consultation strongly advised.'
                : isMediumRisk
                ? 'Early signs or mild vascular variation observed. Regular tracking and specialist checkup recommended.'
                : 'Retinal physiology within healthy parameters. Maintain regular annual checkups.'
            ) : (
              'You have not completed an AI eye screening yet. Upload or scan a fundus photograph to assess diabetic retinopathy, glaucoma, and cataract risks.'
            )}
          </p>

          <button
            onClick={() => setActiveTab(hasLatestResult ? 'result' : 'screening')}
            className="text-xs font-bold text-[#0756B8] hover:text-[#054494] flex items-center space-x-1 pt-1 group"
          >
            <span>{hasLatestResult ? 'View Detailed Report' : 'Take New Screening'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Right: Circular Eye Preview Thumbnail matching Screen 3 */}
        <div 
          onClick={() => setActiveTab(hasLatestResult ? 'result' : 'screening')}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-[#071426] shrink-0 cursor-pointer group flex items-center justify-center text-center"
          title={hasLatestResult ? 'Click to view full diagnosis' : 'Click to start new scan'}
        >
          {previewImage ? (
            <>
              <img 
                src={previewImage} 
                alt="Last Eye Scan" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                Latest Scan
              </div>
            </>
          ) : (
            <div className="p-2 text-slate-400 flex flex-col items-center space-y-1">
              <Eye className="w-8 h-8 text-[#19C7E8] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300">Start Scan</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Action Cards matching Screen 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Eye Screening */}
        <button
          onClick={() => setActiveTab('screening')}
          className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
              New Eye Screening
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload or capture eye image
            </p>
          </div>
        </button>

        {/* Card 2: AI Eye Assistant */}
        <button
          onClick={() => setActiveTab('chat')}
          className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#ecfeff] text-[#0eaac9] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#a5f3fc]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0eaac9] transition-colors">
              AI Eye Assistant
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ask your eye health questions
            </p>
          </div>
        </button>

        {/* Card 3: Find Ophthalmologist */}
        <button
          onClick={() => setActiveTab('doctors')}
          className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
              Find Ophthalmologist
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              View nearby specialists
            </p>
          </div>
        </button>

        {/* Card 4: My Reports */}
        <button
          onClick={() => setActiveTab('reports')}
          className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
        >
          <div className="w-10 h-10 rounded-xl bg-[#F1F6FC] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#cbdcf0]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
              My Reports
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              View your past reports
            </p>
          </div>
        </button>
      </div>

      {/* Appointments & Upcoming Appointment Cards matching Screen 3 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Appointments Quick Check */}
        <div className="md:col-span-5 card-clean p-6 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center border border-[#bcdbff]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#071426]">Appointments</h3>
              <p className="text-xs text-slate-500">Check your bookings</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            You have confirmed consultation records with registered eye clinics. Keep track of timings and slot receipts.
          </p>
          <button
            onClick={() => setActiveTab('doctors')}
            className="w-full py-2.5 rounded-xl bg-[#F1F6FC] hover:bg-[#edf5ff] text-[#0756B8] font-bold text-xs border border-slate-200 transition-colors text-center"
          >
            Book New Appointment
          </button>
        </div>

        {/* Upcoming Appointment Card matching Screen 3 */}
        <div className="md:col-span-7 card-clean p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#0756B8]" />
              <h3 className="text-sm font-bold text-[#071426]">Upcoming Appointment</h3>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-[#0756B8] hover:underline"
            >
              View All
            </button>
          </div>

          {upcomingAppt ? (
            <>
              <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-[#071426]">
                    {upcomingAppt.doctor_name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{upcomingAppt.hospital || 'Eye Clinic'}</span>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-[#0756B8] shrink-0">
                  {upcomingAppt.date} • {upcomingAppt.time_slot}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
                <span>Consultation confirmed via Netra AI</span>
                <span className="font-bold text-[#0756B8]">Ready for checkup</span>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 text-center space-y-2 py-6">
              <p className="text-xs font-semibold text-slate-600">No Upcoming Consultations Scheduled</p>
              <p className="text-[11px] text-slate-400">Locate specialist ophthalmologists and book in-person or tele-consultations.</p>
              <button
                type="button"
                onClick={() => setActiveTab('doctors')}
                className="mt-2 px-4 py-1.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-xs shadow-xs"
              >
                Find Eye Specialists
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
