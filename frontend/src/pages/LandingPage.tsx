import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  Stethoscope, 
  Calendar, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Activity, 
  Camera, 
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppointmentRecord } from '../types';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      try {
        setLoadingData(true);
        const [apptsResult, requestsResult] = await Promise.allSettled([
          api.getPatientAppointments(user?.id || 'pat-01'),
          api.getMyScreeningRequests()
        ]);

        if (isMounted) {
          if (apptsResult.status === 'fulfilled' && Array.isArray(apptsResult.value)) {
            setAppointments(apptsResult.value);
          }
          if (requestsResult.status === 'fulfilled' && Array.isArray(requestsResult.value) && requestsResult.value.length > 0) {
            // Sort by latest created_at
            const sorted = [...requestsResult.value].sort((a, b) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            setRecentActivity(sorted[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadHomeData();
    return () => { isMounted = false; };
  }, [user]);

  const upcomingAppt = appointments.length > 0 ? appointments[0] : null;

  return (
    <div className="space-y-8 py-2 animate-fade-in text-left max-w-6xl mx-auto">
      {/* ── 1. Welcome to NETRA AI Section ── */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        {/* Soft background decorative gradients */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#19C7E8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-48 h-48 bg-[#0756B8]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#edf5ff] border border-[#bcdbff] text-[#0756B8] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#19C7E8]" />
              <span>AI-Powered Tele-Ophthalmology</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#071426] tracking-tight">
              Welcome to <span className="text-[#0756B8]">NETRA AI</span>
              {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              NETRA AI is an intelligent clinical screening system designed for early detection of diabetic retinopathy and proactive eye health management.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('screening')}
                className="px-7 py-3.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-sm shadow-md shadow-[#0756B8]/25 hover:scale-[1.02] transition-all flex items-center space-x-2 focus:outline-none focus:ring-4 focus:ring-[#19C7E8]/40 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#19C7E8]" />
                <span>Start Screening</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-[#F1F6FC] text-[#071426] font-bold text-sm border border-slate-200 transition-all flex items-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>

          {/* Live Retinal Eye Logo with Scanning Reticle & Clinical DR Triage */}
          <div className="flex flex-col items-center justify-center shrink-0 self-center">
            {/* Background Soft Glow */}
            <div className="absolute w-56 h-56 sm:w-64 sm:h-64 bg-[#19C7E8]/15 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Circular Eye Graphic with Reticle */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 aspect-square rounded-full p-2 bg-gradient-to-tr from-[#0756B8] via-[#19C7E8] to-[#bcdbff] shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#071426] border-4 border-[#071426]">
                <img 
                  src="/sample_images/normal_retina.jpg" 
                  alt="Live AI Retinal Eye Scan"
                  className="w-full h-full object-cover scale-105"
                />
                {/* AI Reticle Targeting Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/4 rounded-full border border-[#19C7E8]/60 animate-ping opacity-30" />
                  <div className="w-2/3 h-2/3 rounded-full border-2 border-[#19C7E8]/80 border-dashed animate-spin" style={{ animationDuration: '24s' }} />
                  <div className="w-1/3 h-1/3 rounded-full border border-[#bcdbff]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#19C7E8] shadow-lg shadow-[#19C7E8]" />
                </div>
              </div>
            </div>

            {/* Clinical Tag matching screenshot */}
            <div className="mt-3.5 flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2 text-[#0756B8] font-bold text-xs sm:text-sm bg-[#edf5ff] px-4 py-1.5 rounded-full border border-[#bcdbff] shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#0756B8]" />
                <span>Healthy Eyes, Healthy Lives</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical DR Triage
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick-Access Cards ── */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#071426] flex items-center space-x-2">
          <span>Quick Access</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Start Screening */}
          <button
            onClick={() => setActiveTab('screening')}
            className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
              <Eye className="w-5 h-5 text-[#0756B8]" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
                  Start Screening
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0756B8] transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload retinal fundus images for automated AI analysis & specialist review.
              </p>
            </div>
          </button>

          {/* Card 2: View Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
              <FileText className="w-5 h-5 text-[#0756B8]" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
                  View Reports
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0756B8] transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Access specialist signed reports with Grad-CAM explainability heatmaps.
              </p>
            </div>
          </button>

          {/* Card 3: Find a Doctor */}
          <button
            onClick={() => setActiveTab('doctors')}
            className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
              <Stethoscope className="w-5 h-5 text-[#0756B8]" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
                  Find a Doctor
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0756B8] transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Search verified ophthalmologists and retinal specialists in your city.
              </p>
            </div>
          </button>

          {/* Card 4: My Appointments */}
          <button
            onClick={() => setActiveTab('appointments')}
            className="card-clean-hover p-5 text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-[#bcdbff]">
              <Calendar className="w-5 h-5 text-[#0756B8]" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#071426] group-hover:text-[#0756B8] transition-colors">
                  My Appointments
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0756B8] transition-colors" />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Check upcoming clinical visits, appointment timings, and slot receipts.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ── 3. Eye Health Journey ── */}
      <section className="card-clean p-6 text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#071426]">
              Your Eye Health Journey
            </h2>
            <p className="text-xs text-slate-500">
              A simple 5-step guided process for early detection and comprehensive eye care
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 rounded-full bg-[#edf5ff] text-[#0756B8] border border-[#bcdbff]">
            5 Simple Steps
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Step 1: Capture/Upload Image */}
          <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col justify-between space-y-3 group hover:border-[#19C7E8] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <Camera className="w-4 h-4 text-[#0756B8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#071426]">Capture / Upload Image</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Take a fundus photograph or upload an existing retinal scan image.
              </p>
            </div>
          </div>

          {/* Step 2: Image Quality Check */}
          <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col justify-between space-y-3 group hover:border-[#19C7E8] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#0756B8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#071426]">Image Quality Check</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Automated optical quality & sharpness check ensures gradability.
              </p>
            </div>
          </div>

          {/* Step 3: AI Analysis */}
          <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col justify-between space-y-3 group hover:border-[#19C7E8] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                3
              </span>
              <Sparkles className="w-4 h-4 text-[#19C7E8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#071426]">AI Analysis</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Deep learning model detects signs of diabetic retinopathy.
              </p>
            </div>
          </div>

          {/* Step 4: View Results */}
          <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col justify-between space-y-3 group hover:border-[#19C7E8] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                4
              </span>
              <FileText className="w-4 h-4 text-[#0756B8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#071426]">View Results</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Inspect Grad-CAM saliency heatmaps & doctor-confirmed reports.
              </p>
            </div>
          </div>

          {/* Step 5: Follow-up */}
          <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 flex flex-col justify-between space-y-3 group hover:border-[#19C7E8] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0756B8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                5
              </span>
              <Stethoscope className="w-4 h-4 text-[#0756B8]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#071426]">Follow-up</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Connect with verified eye specialists for clinical care & guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Upcoming Appointment & Recent Activity Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Appointment */}
        <div className="card-clean p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center border border-[#bcdbff]">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#071426]">Upcoming Appointment</h3>
            </div>
            <button
              onClick={() => setActiveTab('appointments')}
              className="text-xs font-bold text-[#0756B8] hover:underline"
            >
              View All
            </button>
          </div>

          {upcomingAppt ? (
            <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[#071426]">{upcomingAppt.doctor_name}</h4>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{upcomingAppt.hospital || 'Specialist Eye Clinic'}</span>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0756B8] shadow-2xs shrink-0">
                  {upcomingAppt.date}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Slot: <strong className="text-slate-700">{upcomingAppt.time_slot}</strong></span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confirmed
                </span>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">No upcoming appointments scheduled</p>
              <button
                onClick={() => setActiveTab('doctors')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#edf5ff] text-[#0756B8] font-bold text-xs border border-slate-200 transition-colors shadow-2xs"
              >
                Book a Consultation
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Consultation records are synced with your patient health profile.
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-clean p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center border border-[#bcdbff]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#071426]">Recent Activity</h3>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-[#0756B8] hover:underline"
            >
              All Records
            </button>
          </div>

          {recentActivity ? (
            <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#071426]">
                    Retinal Screening ({recentActivity.request_id || 'Scan'})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {recentActivity.created_at ? new Date(recentActivity.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently submitted'}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  recentActivity.status === 'Report Available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {recentActivity.status || 'In Review'}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-[#0756B8] hover:underline flex items-center space-x-1 pt-1"
              >
                <span>View screening findings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#F1F6FC] border border-slate-200/80 text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">No recent screening activity recorded</p>
              <button
                onClick={() => setActiveTab('screening')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-[#edf5ff] text-[#0756B8] font-bold text-xs border border-slate-200 transition-colors shadow-2xs"
              >
                Start Your First Screening
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Automated notifications notify you as soon as reports are signed off.
          </div>
        </div>
      </section>

      {/* ── 5. Need Help? / AI Assistant Card ── */}
      <section className="card-clean p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left border-l-4 border-l-[#19C7E8]">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ecfeff] text-[#0eaac9] flex items-center justify-center shrink-0 border border-[#a5f3fc]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#071426]">
              Need Help? Chat with Netra AI Assistant
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
              Have questions about diabetic retinopathy symptoms, screening steps, or your eye health? Our conversational assistant is available 24/7 to guide you.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('chat')}
          className="px-5 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Assistant</span>
        </button>
      </section>
    </div>
  );
};
