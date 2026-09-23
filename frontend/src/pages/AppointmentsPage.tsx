import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle2, Stethoscope, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppointmentRecord } from '../types';

interface AppointmentsPageProps {
  setActiveTab: (tab: string) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPatientAppointments(user?.id || 'pat-01');
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError(err.message || 'Could not fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  return (
    <div className="space-y-6 text-left animate-fade-in max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="card-clean p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#edf5ff] text-[#0756B8] text-xs font-bold border border-[#bcdbff] mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Consultation Schedule</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review your booked eye specialist consultations, hospital visits, and clinical receipts.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('doctors')}
          className="px-5 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-xs shadow-md shadow-[#0756B8]/20 transition-all flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAppointments}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-clean p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0756B8] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="card-clean p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mx-auto border border-[#bcdbff]">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#071426]">No Booked Appointments Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Schedule in-person clinic consultations or virtual evaluations with verified Indian ophthalmologists.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('doctors')}
            className="px-6 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-xs shadow-sm transition-all"
          >
            Find Specialists & Book Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.appointment_id}
              className="card-clean p-5 flex flex-col justify-between space-y-4 hover:border-[#19C7E8] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-extrabold text-[#071426]">{apt.doctor_name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {apt.status || 'Confirmed'}
                    </span>
                  </div>
                  <p className="text-xs text-[#0756B8] font-semibold">{apt.doctor_specialization || 'Ophthalmologist'}</p>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{apt.hospital || 'Eye Care Hospital'}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-[#edf5ff] border border-[#bcdbff] text-xs font-extrabold text-[#0756B8]">
                    {apt.date}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-1 flex items-center justify-end space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{apt.time_slot}</span>
                  </div>
                </div>
              </div>

              {apt.reason && (
                <div className="p-3 rounded-xl bg-[#F1F6FC] border border-slate-200/80 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Reason: </span>
                  {apt.reason}
                </div>
              )}

              {apt.doctor_notes && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold text-amber-800">Doctor Remarks: </span>
                  {apt.doctor_notes}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Appointment ID: <strong className="font-mono text-slate-600">{apt.appointment_id}</strong></span>
                <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Slot</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
