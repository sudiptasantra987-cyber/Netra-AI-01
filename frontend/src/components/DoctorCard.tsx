import React from 'react';
import { Star, MapPin, CheckCircle, Calendar, Clock, Building2, Award } from 'lucide-react';
import { DoctorProfile } from '../types';

interface DoctorCardProps {
  doctor: DoctorProfile;
  onBook: (doctor: DoctorProfile) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const defaultSlots = ['10:00 AM', '10:30 AM', '11:00 AM'];
  const displaySlots = doctor.available_slots && doctor.available_slots.length > 0 
    ? doctor.available_slots.slice(0, 3) 
    : defaultSlots;

  return (
    <div className="card-clean p-5 hover:border-[#0756B8] transition-all flex flex-col justify-between space-y-4 text-left shadow-xs">
      <div>
        {/* Top Doctor Info */}
        <div className="flex items-start space-x-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 shrink-0 bg-slate-100">
            <img
              src={doctor.image_avatar}
              alt={doctor.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-[#071426] truncate">
                {doctor.name}
              </h4>
              {doctor.is_verified && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-[#0756B8] border border-blue-200">
                  <CheckCircle className="w-3 h-3 mr-0.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium truncate">
              {doctor.specialization}
            </p>

            <p className="text-xs text-slate-600 truncate mt-0.5">
              {doctor.hospital}
            </p>

            {/* Rating, Reviews & Distance */}
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1.5">
              <div className="flex items-center space-x-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{doctor.rating}</span>
                <span className="text-slate-400 font-normal">({doctor.review_count || 120} reviews)</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1 text-slate-600">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{doctor.distance_km !== undefined ? `${doctor.distance_km} km` : '1.2 km'}</span>
              </div>
            </div>
          </div>

          {/* Fee on right */}
          <div className="text-right shrink-0">
            <span className="text-base font-black text-[#071426]">₹{doctor.consultation_fee}</span>
          </div>
        </div>

        {/* Available Slots */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#0756B8] font-bold flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Available Today</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {displaySlots.map((slot, sIdx) => {
              const timeLabel = typeof slot === 'string' ? slot : (slot as any)?.time || '10:00 AM';
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => onBook(doctor)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#0756B8] bg-slate-50 hover:bg-[#F1F6FC] text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  {timeLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Book Appointment CTA Button */}
      <button
        onClick={() => onBook(doctor)}
        className="w-full py-2.5 px-4 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-xs transition-all hover:scale-101 flex items-center justify-center space-x-1.5"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Book Appointment</span>
      </button>
    </div>
  );
};
