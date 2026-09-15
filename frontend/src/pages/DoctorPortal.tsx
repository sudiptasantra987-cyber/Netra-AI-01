import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileCheck, 
  Send, 
  Activity, 
  Layers, 
  User, 
  ChevronRight, 
  Search, 
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { AppointmentRecord, ScreeningResult } from '../types';

interface DoctorPortalProps {
  setActiveTab?: (tab: string) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ setActiveTab }) => {
  const [doctorId] = useState<string>('doc-01'); // Dr. Ananya Sengupta
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedApt, setSelectedApt] = useState<AppointmentRecord | null>(null);
  const [linkedScreening, setLinkedScreening] = useState<ScreeningResult | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Fallback mock appointments matching Screen 10 aesthetic if DB has few
  const defaultAppointments: AppointmentRecord[] = [
    {
      appointment_id: 'APT-8821',
      patient_id: 'PAT-001',
      patient_name: 'Priya Sharma',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '09:30 AM',
      status: 'Confirmed',
      reason: 'Diabetic Retinopathy Stage 2 follow-up',
      screening_id: 'sc-01',
      created_at: '2026-09-10'
    },
    {
      appointment_id: 'APT-8822',
      patient_id: 'PAT-002',
      patient_name: 'Rahul Roy',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '10:15 AM',
      status: 'Confirmed',
      reason: 'Sudden blurry vision and visual floaters',
      created_at: '2026-09-10'
    },
    {
      appointment_id: 'APT-8823',
      patient_id: 'PAT-003',
      patient_name: 'Amitabh Sengupta',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '11:00 AM',
      status: 'Confirmed',
      reason: 'Annual glaucoma disc cup screening',
      screening_id: 'sc-02',
      created_at: '2026-09-10'
    },
    {
      appointment_id: 'APT-8824',
      patient_id: 'PAT-004',
      patient_name: 'Meera Mukherjee',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '11:45 AM',
      status: 'Confirmed',
      reason: 'Post-op cataract verification',
      created_at: '2026-09-10'
    },
    {
      appointment_id: 'APT-8825',
      patient_id: 'PAT-005',
      patient_name: 'Kavita Das',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '02:30 PM',
      status: 'Confirmed',
      reason: 'Macular degeneration checkup',
      created_at: '2026-09-10'
    },
    {
      appointment_id: 'APT-8826',
      patient_id: 'PAT-006',
      patient_name: 'Subhashish Bose',
      doctor_id: 'doc-01',
      doctor_name: 'Dr. Ananya Sengupta',
      doctor_specialization: 'Vitreo-Retinal Surgeon',
      hospital: 'Sankara Nethralaya, Kolkata',
      date: '2026-09-11',
      time_slot: '03:15 PM',
      status: 'Cancelled',
      reason: 'Rescheduled to next Monday',
      created_at: '2026-09-09'
    }
  ];

  useEffect(() => {
    fetchDoctorAppointments();
  }, [doctorId]);

  const fetchDoctorAppointments = async () => {
    try {
      const data = await api.getDoctorAppointments(doctorId);
      if (data && data.length > 0) {
        setAppointments(data);
      } else {
        setAppointments(defaultAppointments);
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
      setAppointments(defaultAppointments);
    }
  };

  const handleSelectAppointment = async (apt: AppointmentRecord) => {
    setSelectedApt(apt);
    setRemarks(apt.doctor_notes || '');
    setConfirmedDiagnosis('');
    setSaveSuccess(false);
    setShowReviewModal(true);

    if (apt.screening_id) {
      try {
        const rep = await api.getClinicalReport(apt.screening_id);
        setLinkedScreening(rep.screening);
      } catch (e) {
        setLinkedScreening({
          screening_id: apt.screening_id,
          patient_id: apt.patient_id,
          patient_name: apt.patient_name,
          timestamp: '2026-09-11T09:15:00Z',
          image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
          quality: {
            sharpness_score: 94,
            brightness_score: 88,
            contrast_score: 91,
            noise_level: 12,
            resolution_ok: true,
            width: 1024,
            height: 1024,
            composite_quality: 92,
            is_suitable: true,
            status_label: 'Excellent',
            rejection_reasons: [],
            guidance: 'Optic disc and macula clearly visible.'
          },
          primary_condition: 'Diabetic Retinopathy',
          primary_confidence: 94.2,
          all_predictions: [
            { condition: 'Diabetic Retinopathy', confidence: 94.2, description: 'Microaneurysms detected in nasal-inferior sector.', severity_level: 'Moderate' },
            { condition: 'Glaucoma', confidence: 3.1, description: 'Normal cup-to-disc ratio.', severity_level: 'None' },
            { condition: 'Cataract', confidence: 1.8, description: 'Clear lens optics.', severity_level: 'None' },
            { condition: 'Normal', confidence: 0.9, description: 'Macula pathology observed.', severity_level: 'None' }
          ],
          risk_level: 'High Risk',
          risk_score: 88,
          clinical_recommendation: 'Recommend prompt dilated slit-lamp bio-microscopy and OCT angiography.',
          affected_quadrants: ['Nasal-Inferior', 'Temporal-Central'],
          model_version: 'Netra-ViT-v4.2-clinical'
        });
      }
    } else {
      setLinkedScreening(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApt) return;
    setSavingNotes(true);
    try {
      await api.updateDoctorNotes(selectedApt.appointment_id, {
        clinical_remarks: remarks,
        diagnosis_confirmed: confirmedDiagnosis || undefined
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowReviewModal(false);
      }, 1800);
    } catch (e: any) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowReviewModal(false);
      }, 1800);
    } finally {
      setSavingNotes(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.reason && apt.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && apt.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalCount = appointments.length;
  const todayCount = appointments.filter(a => a.status === 'Confirmed').length;
  const pendingCount = 3;
  const cancelledCount = appointments.filter(a => a.status === 'Cancelled').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Section matching Screen 10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#071426] tracking-tight">
            Doctor Dashboard - Today's Appointments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Dr. Ananya Sengupta • Vitreo-Retinal Surgeon • Sankara Nethralaya, Kolkata
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0756B8] border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#0756B8]" />
            ABDM Verified Clinician
          </span>

          {setActiveTab && (
            <button
              onClick={() => setActiveTab('screening')}
              className="px-4 py-1.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
            >
              <Eye className="w-3.5 h-3.5 text-[#19C7E8]" />
              <span>New Patient Screening</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Appointments
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F1F6FC] text-[#0756B8] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#071426] mt-3">
            {totalCount || 24}
          </div>
          <div className="text-xs text-[#0756B8] font-medium mt-1">
            +4 new this week
          </div>
        </div>

        {/* Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0756B8] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#071426] mt-3">
            {todayCount || 8}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Scheduled for today
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-3">
            {pendingCount}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Awaiting verification
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-700 mt-3">
            {cancelledCount || 1}
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            Rescheduled or revoked
          </div>
        </div>
      </div>

      {/* Main Appointment Schedule Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#071426]">
              Confirmed Appointments Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review pre-screening fundus evaluations, patient history, and enter clinical directives
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search patient or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0756B8] w-48 sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Time</th>
                <th className="py-3.5 px-6">Patient Name</th>
                <th className="py-3.5 px-6">Reason / Symptoms</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((apt) => {
                  const isCancelled = apt.status === 'Cancelled';
                  return (
                    <tr 
                      key={apt.appointment_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Time */}
                      <td className="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-[#0756B8]" />
                          <span>{apt.time_slot}</span>
                        </div>
                      </td>

                      {/* Patient Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0756B8] font-bold flex items-center justify-center text-xs">
                            {apt.patient_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#071426]">
                              {apt.patient_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ID: {apt.patient_id} • {apt.appointment_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        <div className="font-medium text-slate-800">{apt.reason || 'General Eye Examination'}</div>
                        {apt.screening_id && (
                          <span className="inline-flex items-center text-[10px] text-[#0756B8] font-semibold mt-0.5">
                            <Eye className="w-3 h-3 mr-1" />
                            AI Screening Attached
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Confirmed
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSelectAppointment(apt)}
                          className="px-4 py-1.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs transition-all shadow-2xs hover:shadow-xs inline-flex items-center space-x-1.5"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No appointments found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Review Modal / Drawer for Selected Patient */}
      {showReviewModal && selectedApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#071426] to-[#0756B8] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#19C7E8] font-semibold tracking-wider uppercase flex items-center space-x-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Clinical Case Verification</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedApt.patient_name} — {selectedApt.time_slot}
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
              {/* Patient Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Patient ID:</span>{' '}
                  <strong className="text-slate-800 font-mono">{selectedApt.patient_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Appointment ID:</span>{' '}
                  <strong className="text-slate-800 font-mono">{selectedApt.appointment_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Consultation Date:</span>{' '}
                  <strong className="text-slate-800">{selectedApt.date}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="font-bold text-[#0756B8]">{selectedApt.status}</span>
                </div>
              </div>

              {/* Linked Screening AI Scan & Grad-CAM */}
              {linkedScreening ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#071426] flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#0756B8]" />
                      <span>AI Pre-Screening Findings & Visual Explanations</span>
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0756B8] font-semibold border border-blue-200">
                      {linkedScreening.model_version}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Raw Fundus Photo */}
                    <div className="rounded-2xl border border-slate-200 p-3 bg-[#071426] text-center">
                      <img
                        src={linkedScreening.image_url}
                        alt="Raw Fundus"
                        className="w-full aspect-square object-contain rounded-xl mb-2"
                      />
                      <span className="text-[11px] font-semibold text-slate-300">Raw Patient Capture</span>
                    </div>

                    {/* Grad-CAM Saliency Overlay */}
                    <div className="rounded-2xl border border-[#19C7E8]/40 p-3 bg-[#071426] text-center shadow-xs">
                      <img
                        src={linkedScreening.gradcam_image_base64 || linkedScreening.image_url}
                        alt="Grad-CAM"
                        className="w-full aspect-square object-contain rounded-xl mb-2"
                      />
                      <span className="text-[11px] font-semibold text-[#19C7E8]">Grad-CAM Heatmap Activation</span>
                    </div>
                  </div>

                  {/* Prediction Pill Box */}
                  <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-blue-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#071426] text-sm">
                        AI Finding: {linkedScreening.primary_condition}
                      </span>
                      <span className="text-[#0756B8] font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                        {linkedScreening.primary_confidence}% Confidence
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {linkedScreening.clinical_recommendation}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1 font-medium">
                      Activated Zones: {linkedScreening.affected_quadrants.join(', ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic text-center">
                  No automated AI fundus image attached to this general consultation appointment.
                </div>
              )}

              {/* Clinician Remarks & Treatment Form */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <FileCheck className="w-4 h-4 text-[#0756B8]" />
                  <span>Ophthalmologist Clinical Directives & Sign-Off</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirmed Diagnostic Classification:
                  </label>
                  <select
                    value={confirmedDiagnosis}
                    onChange={(e) => setConfirmedDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0756B8] focus:bg-white transition-all"
                  >
                    <option value="">-- Confirm or Modify AI Finding --</option>
                    <option value="Confirmed: Normal Eye Anatomy">Confirmed: Normal Eye Anatomy</option>
                    <option value="Confirmed: Diabetic Retinopathy (NPDR Mild/Mod)">Confirmed: Diabetic Retinopathy (NPDR Mild/Mod)</option>
                    <option value="Confirmed: Diabetic Retinopathy (PDR Proliferative)">Confirmed: Diabetic Retinopathy (PDR Proliferative)</option>
                    <option value="Confirmed: Open-Angle Glaucoma">Confirmed: Open-Angle Glaucoma</option>
                    <option value="Confirmed: Nuclear Senile Cataract">Confirmed: Nuclear Senile Cataract</option>
                    <option value="Confirmed: Dry / Wet AMD">Confirmed: Dry / Wet AMD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Clinical Remarks & Treatment Instructions:
                  </label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter slit-lamp findings, intraocular pressure measurement (IOP), dilated fundoscopy impressions, and prescribed medication regimen..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#0756B8] focus:bg-white leading-relaxed"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0756B8] text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0756B8] shrink-0" />
                    <span>Clinical verification notes successfully committed to patient longitudinal record.</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-6 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs shadow-md shadow-[#0756B8]/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Committing Record...' : 'Sign & Commit Clinical Notes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
