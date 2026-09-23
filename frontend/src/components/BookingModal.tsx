import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Star,
  MapPin,
  X
} from 'lucide-react';
import { DoctorProfile, DoctorSlot, AppointmentRecord } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';

interface BookingModalProps {
  doctor: DoctorProfile;
  onClose: () => void;
  onSuccess: (apt: AppointmentRecord) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { latestResult } = useScreening();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:30 AM');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const apt = await api.bookAppointment({
        doctor_id: doctor.id,
        date: selectedDate,
        time_slot: selectedSlot || '10:30 AM',
        reason: notes || (latestResult ? `Checkup for ${latestResult.primary_condition}` : 'Comprehensive eye checkup'),
        screening_id: latestResult?.screening_id,
        notes: notes || 'Booked via Netra AI patient portal'
      }, user?.id || 'pat-01', user?.name || '');
      
      onSuccess(apt);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking. Please try another slot.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-left">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden space-y-5 p-6 sm:p-7 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-sm font-bold text-[#071426] hover:text-[#0756B8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Confirm Appointment</span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 shrink-0 bg-slate-200">
            <img 
              src={doctor.image_avatar} 
              alt={doctor.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-[#071426] truncate">
              {doctor.name}
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate">
              {doctor.specialization}
            </p>
            <p className="text-xs text-slate-600 truncate">
              {doctor.hospital}
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                {doctor.rating} ({doctor.review_count || 120} reviews)
              </span>
              <span>•</span>
              <span className="flex items-center text-slate-600">
                <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                {doctor.distance_km ? `${doctor.distance_km} km` : '1.2 km'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Date & Time */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Selected Date & Time</label>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0756B8]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-1.5 text-[#0756B8] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#0756B8]" />
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Consultation Fee */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F1F6FC] border border-blue-200 text-xs font-bold">
          <span className="text-[#071426] font-semibold">Consultation Fee</span>
          <span className="text-sm font-black text-[#0756B8]">₹{doctor.consultation_fee}</span>
        </div>

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Any additional notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Previous reports, symptoms, etc."
            className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#0756B8] focus:ring-1 focus:ring-[#0756B8] text-xs outline-none bg-slate-50/50"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-sm shadow-md shadow-[#0756B8]/20 transition-all hover:scale-101 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? 'Confirming with Hospital...' : 'Confirm Booking'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors text-center"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
