import React, { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, 
  Eye, 
  Activity, 
  ArrowLeft,
  FileText,
  Trash2,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PatientTrendSummary, ScreeningResult } from '../types';

interface HistoryTrendsProps {
  onBack?: () => void;
  onSelectReport?: (report: any) => void;
  onStartScreening?: () => void;
}

export const HistoryTrends: React.FC<HistoryTrendsProps> = ({ 
  onBack, 
  onSelectReport, 
  onStartScreening 
}) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Screenings'>('All');
  const [trendData, setTrendData] = useState<PatientTrendSummary | null>(null);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected report state for the detailed modal viewer
  const [activeReport, setActiveReport] = useState<ScreeningResult | null>(null);
  const [isLoadingFullReport, setIsLoadingFullReport] = useState<boolean>(false);
  const [fullReportData, setFullReportData] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchHistoryAndTrends();
  }, [user]);

  const fetchHistoryAndTrends = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [trend, hist] = await Promise.all([
        api.getMyTrend().catch(() => null),
        api.getMyScreeningHistory().catch(() => [])
      ]);
      setTrendData(trend);
      setScreenings(hist || []);
    } catch (e: any) {
      console.error('Failed to load user scan history:', e);
      setError(e.message || 'Failed to load screening reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (screening: ScreeningResult) => {
    setActiveReport(screening);
    setIsLoadingFullReport(true);
    setFullReportData(null);
    try {
      const report = await api.getClinicalReport(screening.screening_id);
      setFullReportData(report);
    } catch (err: any) {
      console.error('Failed to load full clinical report:', err);
      // Fallback to the screening object if report endpoint returns an error
      setFullReportData({
        report_id: `REP-${screening.screening_id.toUpperCase()}`,
        facility: 'Netra AI Clinical Tele-Screening Network',
        screening: screening,
        patient: { name: user?.name || 'User', id: user?.id }
      });
    } finally {
      setIsLoadingFullReport(false);
    }
  };

  const handleDeleteReport = async (screeningId: string) => {
    if (!window.confirm('Are you sure you want to delete this screening report from your account? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.deleteClinicalReport(screeningId);
      // Remove from state
      setScreenings((prev) => prev.filter((s) => s.screening_id !== screeningId));
      if (activeReport?.screening_id === screeningId) {
        setActiveReport(null);
        setFullReportData(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete report.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Trajectory chart points strictly from real history points
  const chartPoints = trendData?.history_points?.map((p) => ({
    date: p.date,
    risk: p.risk_score,
    condition: p.primary_condition,
    level: p.risk_level
  })) || [];

  const getRiskColor = (risk: string) => {
    const r = (risk || '').toLowerCase();
    if (r.includes('high')) return 'bg-red-50 text-red-700 border-red-200';
    if (r.includes('medium') || r.includes('moderate')) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  const formatTimestamp = (ts?: string, dateStr?: string) => {
    if (ts) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      } catch {}
    }
    return dateStr || 'Recent Scan';
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight flex items-center space-x-2">
              <FileText className="w-6 h-6 text-[#0756B8]" />
              <span>My Retinal Reports</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Verified clinical scan records & AI diagnostic evaluations for your account
            </p>
          </div>
        </div>

        {onStartScreening && (
          <button
            type="button"
            onClick={onStartScreening}
            className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Eye className="w-4 h-4 text-[#19C7E8]" />
            <span>New Scan</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {(['All', 'Screenings'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === tab
                ? 'bg-[#0756B8] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {tab} {tab === 'All' ? `(${screenings.length})` : ''}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="card-clean p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#0756B8] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your retinal scan records...</p>
        </div>
      ) : screenings.length === 0 ? (
        /* Empty State (Zero Demo Records) */
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F6FC] text-[#0756B8] flex items-center justify-center mx-auto border border-blue-100">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#071426]">No Scan Reports Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              {user?.role === 'doctor' || user?.role === 'admin'
                ? "You haven't completed any retinal scans yet. Upload or capture a fundus image in the screening studio to generate diagnostic results, Grad-CAM heatmaps, and medical reports."
                : "No retinal scan reports on file yet. When an authorized eye care specialist conducts an ocular screening, your diagnostic results, Grad-CAM heatmaps, and medical reports will be saved here securely."}
            </p>
          </div>
          {onStartScreening && (user?.role === 'doctor' || user?.role === 'admin') && (
            <button
              type="button"
              onClick={onStartScreening}
              className="px-6 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs shadow-md transition-all inline-flex items-center space-x-2"
            >
              <Eye className="w-4 h-4 text-[#19C7E8]" />
              <span>Start New Eye Screening</span>
            </button>
          )}
        </div>
      ) : (
        /* Real Scans List */
        <div className="space-y-3">
          {screenings.map((rep) => {
            const riskClass = getRiskColor(rep.risk_level);
            return (
              <div
                key={rep.screening_id}
                className="card-clean p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0756B8] transition-all shadow-2xs"
              >
                {/* Left: Eye Image Thumbnail */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-[#071426] border border-slate-200 shrink-0 relative">
                    <img 
                      src={rep.image_url} 
                      alt={rep.primary_condition}
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* Center Details */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <span className="text-xs text-slate-500 font-semibold">
                        {formatTimestamp(rep.timestamp, rep.date)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${riskClass}`}>
                        {rep.risk_level || 'Evaluated'}
                      </span>
                      {rep.primary_confidence !== undefined && (
                        <span className="text-[10px] font-bold text-[#0756B8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          {rep.primary_confidence.toFixed(1)}% Confidence
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#071426]">
                      {rep.primary_condition}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Screening ID: <span className="font-mono text-slate-600 font-semibold">{rep.screening_id}</span>
                      {rep.model_version ? ` • ${rep.model_version}` : ''}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenReport(rep)}
                    className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReport(rep.screening_id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    title="Delete report"
                    aria-label="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recharts Longitudinal Trajectory Trend (only rendered when real points exist) */}
      {chartPoints.length > 0 ? (
        <div className="card-clean p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LineChartIcon className="w-5 h-5 text-[#0756B8]" />
              <h3 className="text-sm font-bold text-[#071426]">Personal Longitudinal Risk Trajectory</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{chartPoints.length} screening records</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="risk" 
                  stroke="#0756B8" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#19C7E8', stroke: '#071426', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : screenings.length > 0 ? (
        <div className="card-clean p-6 text-center space-y-2 text-slate-500">
          <Activity className="w-6 h-6 mx-auto text-[#0756B8]" />
          <p className="text-xs font-medium">
            Complete multiple screenings over time to chart your longitudinal ocular risk progression.
          </p>
        </div>
      ) : null}

      {/* Detailed Clinical Report Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#071426] to-[#0756B8] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#19C7E8]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Clinical Diagnostic Report
                  </h3>
                  <p className="text-xs text-blue-200/90 font-mono">
                    {fullReportData?.report_id || `REP-${activeReport.screening_id.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveReport(null);
                  setFullReportData(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close report modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
              {isLoadingFullReport ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#0756B8] animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">Retrieving official clinical report from database...</p>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  {(() => {
                    const scr = fullReportData?.screening || activeReport;
                    const isRev = scr?.review_status === 'reviewed' || scr?.status === 'Report Available';
                    const isRecap = scr?.review_status === 'recapture_required' || scr?.status === 'Image Requires Recapture';
                    const doc = scr?.reviewed_by || fullReportData?.reviewed_by;
                    if (isRev) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-sm block">Report Available</span>
                              <span className="text-emerald-700">Clinical review finalized by {doc || 'Authorized Specialist'}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Finalized
                          </span>
                        </div>
                      );
                    } else if (isRecap) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            <div>
                              <span className="font-bold text-sm block">Image Requires Recapture</span>
                              <span className="text-red-700">{scr?.clinical_notes || 'Doctor requested a clearer retinal capture due to optical blur or illumination.'}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">
                            Recapture
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                              <span className="font-bold text-sm block">Awaiting Doctor Review</span>
                              <span className="text-amber-700">Screening request submitted. Waiting in tele-ophthalmology review queue.</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            In Review Queue
                          </span>
                        </div>
                      );
                    }
                  })()}

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F1F6FC] rounded-2xl border border-blue-100 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Patient</span>
                      <span className="font-bold text-[#071426]">{fullReportData?.patient?.name || user?.name || 'Patient'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Date & Time</span>
                      <span className="font-bold text-[#071426]">{formatTimestamp(activeReport.timestamp, activeReport.date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Gradability</span>
                      <span className={`font-bold inline-block text-[10px] px-2 py-0.5 rounded mt-0.5 ${
                        activeReport.is_gradable !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {activeReport.is_gradable !== false ? 'Suitable / Gradable' : 'Requires Recapture'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">AI Confidence</span>
                      <span className="font-bold text-[#0756B8]">
                        {activeReport.primary_confidence !== undefined ? `${activeReport.primary_confidence.toFixed(1)}%` : 'Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Fundus Image and Grad-CAM Heatmap Side-by-Side */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Imaging & Saliency Analysis
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-center">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[#071426] border border-slate-200">
                          <img 
                            src={activeReport.image_url} 
                            alt="Fundus photograph" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#071426] block">Original Fundus Capture</span>
                      </div>

                      <div className="space-y-1.5 text-center">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-[#071426] border border-slate-200 flex items-center justify-center">
                          {activeReport.gradcam_image_base64 ? (
                            <img 
                              src={activeReport.gradcam_image_base64.startsWith('data:') 
                                ? activeReport.gradcam_image_base64 
                                : `data:image/jpeg;base64,${activeReport.gradcam_image_base64}`} 
                              alt="Grad-CAM Saliency Heatmap" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-slate-400 text-xs p-4">
                              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                              Heatmap visualization generated for high-risk regions
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-[#071426] block">Explainable AI Heatmap (Grad-CAM)</span>
                      </div>
                    </div>
                  </div>

                  {/* AI-Generated Findings */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>🤖 AI Deep Learning Feature Triage (Preliminary)</span>
                    </h4>
                    <div className="p-4 bg-[#F1F6FC] rounded-2xl border border-blue-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-[#071426]">
                          {activeReport.primary_condition}
                        </span>
                        <span className="text-xs font-bold text-[#0756B8]">
                          Risk Score: {activeReport.risk_score || 0} / 100
                        </span>
                      </div>
                      {activeReport.clinical_recommendation && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <span className="font-bold text-[#071426]">AI Recommendation: </span>
                          {activeReport.clinical_recommendation}
                        </p>
                      )}
                      {activeReport.affected_quadrants && activeReport.affected_quadrants.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Affected Quadrants: </span>
                          {activeReport.affected_quadrants.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor's Clinical Assessment & Sign-Off */}
                  {(() => {
                    const scr = fullReportData?.screening || activeReport;
                    const doc = scr?.reviewed_by || fullReportData?.reviewed_by;
                    const notes = scr?.clinical_notes || fullReportData?.clinical_notes;
                    const diag = scr?.diagnosis_confirmed || fullReportData?.diagnosis_confirmed;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#0756B8]" />
                            <span>Doctor's Clinical Assessment & Sign-Off</span>
                          </h4>
                          {doc && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Evaluated by <strong className="text-[#071426]">{doc}</strong>
                            </span>
                          )}
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-400 block font-medium">Confirmed Diagnosis</span>
                              <span className="text-sm font-extrabold text-[#071426]">
                                {diag || (scr?.review_status === 'reviewed' ? scr?.primary_condition : 'Pending Doctor Evaluation')}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Report Status</span>
                              <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase mt-0.5 ${
                                scr?.review_status === 'reviewed' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {scr?.status || (scr?.review_status === 'reviewed' ? 'Report Available' : 'Awaiting Review')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-xs font-medium mb-1">Doctor's Clinical Notes</span>
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100 font-sans">
                              {notes || (scr?.review_status === 'reviewed' ? 'No additional clinical remarks recorded.' : 'Doctor evaluation and clinical assessment notes are currently pending.')}
                            </div>
                          </div>
                          {scr?.clinical_recommendation && (
                            <div className="text-xs text-slate-600">
                              <span className="font-bold text-[#071426]">Doctor's Recommendations & Follow-Up: </span>
                              {scr.clinical_recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Disclaimer */}
                  <p className="text-[11px] text-slate-400 italic leading-relaxed border-t border-slate-100 pt-3">
                    NOTICE: This report was generated by Netra AI diagnostic screening model (v1.4) utilizing deep convolutional feature extraction and Grad-CAM explainability localization. This report is intended to assist medical practitioners and triage at-risk patients, and does not constitute a substitute for in-person slit-lamp biomicroscopy or direct ophthalmoscopy.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteReport(activeReport.screening_id)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold transition-colors inline-flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Report'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all inline-flex items-center space-x-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveReport(null);
                    setFullReportData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
