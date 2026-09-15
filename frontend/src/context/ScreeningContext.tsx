import React, { createContext, useContext, useState } from 'react';
import { ScreeningResult, DoctorProfile } from '../types';

interface ScreeningContextType {
  latestResult: ScreeningResult | null;
  setLatestResult: (res: ScreeningResult | null) => void;
  selectedDoctorForBooking: DoctorProfile | null;
  setSelectedDoctorForBooking: (doc: DoctorProfile | null) => void;
}

const ScreeningContext = createContext<ScreeningContextType | undefined>(undefined);

export const ScreeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latestResult, setLatestResult] = useState<ScreeningResult | null>(() => {
    const saved = localStorage.getItem('netra_latest_screening');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorProfile | null>(null);

  const updateLatestResult = (res: ScreeningResult | null) => {
    setLatestResult(res);
    if (res) {
      localStorage.setItem('netra_latest_screening', JSON.stringify(res));
    } else {
      localStorage.removeItem('netra_latest_screening');
    }
  };

  return (
    <ScreeningContext.Provider value={{
      latestResult,
      setLatestResult: updateLatestResult,
      selectedDoctorForBooking,
      setSelectedDoctorForBooking
    }}>
      {children}
    </ScreeningContext.Provider>
  );
};

export const useScreening = () => {
  const ctx = useContext(ScreeningContext);
  if (!ctx) throw new Error('useScreening must be used within ScreeningProvider');
  return ctx;
};
