import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScreeningProvider, useScreening } from './context/ScreeningContext';

// Navigation & Global UI components matching the 12 screens
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { PublicNavbar } from './components/PublicNavbar';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { ChatbotWidget } from './components/ChatbotWidget';

// Core Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { ScreeningStudio } from './pages/ScreeningStudio';
import { DiagnosticResult } from './pages/DiagnosticResult';
import { ChatPage } from './pages/ChatPage';
import { FindDoctor } from './pages/FindDoctor';
import { HistoryTrends } from './pages/HistoryTrends';
import { DoctorPortal } from './pages/DoctorPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';

const MainApp: React.FC = () => {
  const { user, isLoadingSession } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const token = localStorage.getItem('netra_token');
    return token ? 'home' : 'login';
  });
  const [doctorConditionFilter, setDoctorConditionFilter] = useState<string>('All');
  const { latestResult, setLatestResult } = useScreening();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoadingSession) {
      if (user && activeTab === 'login') {
        if (user.role === 'doctor') setActiveTab('doctor-portal');
        else if (user.role === 'admin') setActiveTab('admin');
        else setActiveTab('home');
      } else if (!user) {
        setActiveTab('login');
      }
    }
  }, [user, isLoadingSession]);

  const handleLoginSuccess = (loggedInUser: any) => {
    if (loggedInUser.role === 'doctor') {
      setActiveTab('doctor-portal');
    } else if (loggedInUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleAnalysisComplete = (res: any) => {
    setLatestResult(res);
    setActiveTab('result');
  };

  const handleFindDoctorForCondition = (cond: string) => {
    setDoctorConditionFilter(cond);
    setActiveTab('doctors');
  };

  const handleAppointmentBooked = () => {
    setActiveTab('dashboard');
  };

  // Initial session verification loader
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#F1F6FC] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#19C7E8]/40 shadow-md flex items-center justify-center">
          <img src="/netra-ai-logo-transparent.png" alt="Netra AI" className="w-10 h-10 object-contain animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-[#071426] text-sm font-semibold">
          <div className="w-2 h-2 rounded-full bg-[#19C7E8] animate-ping"></div>
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  // 1. Authentication Gate: The website starts at the Login Page for unauthenticated visitors
  if (!user || activeTab === 'login') {
    return (
      <div className="min-h-screen bg-[#F1F6FC] flex items-center justify-center font-sans selection:bg-[#0756B8] selection:text-white">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 3. In-App Workspace (Screens 3 to 12): AppHeader + three-dot navigation + content + MobileNav
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'home':
      case 'landing':
        return {
          title: 'Netra AI Clinical Home Overview',
          subtitle: 'Comprehensive deep learning diagnostic workflows, clinical features, and ocular technology'
        };
      case 'screening':
        return {
          title: 'Eye Screening Studio',
          subtitle: 'Upload fundus images for instant AI quality check and deep learning analysis'
        };
      case 'result':
        return {
          title: 'Diagnostic Analysis Result',
          subtitle: 'Multi-disease classification, Grad-CAM heatmap visualization, and clinical triage'
        };
      case 'chat':
        return {
          title: 'AI Eye Health Assistant',
          subtitle: 'Interactive conversational triage and guidance powered by clinical ophthalmology knowledge'
        };
      case 'doctors':
        return {
          title: 'Find Eye Specialists',
          subtitle: 'Locate verified ophthalmologists and book verified clinic consultations'
        };
      case 'reports':
      case 'trends':
        return {
          title: 'My Medical Reports',
          subtitle: 'Track longitudinal screening records, visual trajectories, and clinical notes'
        };
      case 'appointments':
        return {
          title: 'My Consultation Appointments',
          subtitle: 'Upcoming ophthalmic consultations and clinical case histories'
        };
      case 'doctor-portal':
        return {
          title: "Doctor Dashboard - Today's Appointments",
          subtitle: 'Specialist case queue, Grad-CAM diagnostic verification, and clinical sign-off'
        };
      case 'admin':
        return {
          title: 'Admin Dashboard - System Overview',
          subtitle: 'Real-time telemetry, screening throughput, verified specialists, and high-risk case triage'
        };
      case 'profile':
        return {
          title: 'Patient Profile & ABHA Identity',
          subtitle: 'Ayushman Bharat Digital Mission (ABDM) record linkage and personal ocular history'
        };
      default:
        return {
          title: undefined,
          subtitle: undefined
        };
    }
  };

  const headerDetails = getHeaderDetails();

  return (
    <div className="min-h-screen bg-[#F1F6FC] text-[#071426] flex font-sans selection:bg-[#0756B8] selection:text-white">
      {/* Single Unified Slide-in Sidebar (Desktop & Mobile) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        onLogout={() => {
          setIsSidebarOpen(false);
          setActiveTab('login');
        }}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden w-full">
        {/* Sticky In-App Header with Menu Toggle */}
        <AppHeader 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          title={headerDetails.title}
          subtitle={headerDetails.subtitle}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Scrollable Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          {(activeTab === 'home' || activeTab === 'landing') && (
            <LandingPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'dashboard' && (
            <PatientDashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'screening' && (
            <ScreeningStudio 
              onAnalysisComplete={handleAnalysisComplete} 
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'result' && (
            latestResult ? (
              <DiagnosticResult
                result={latestResult}
                onFindDoctor={handleFindDoctorForCondition}
                onAskChatbot={() => setActiveTab('chat')}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs max-w-lg mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#edf5ff] text-[#0756B8] flex items-center justify-center mx-auto">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#071426]">No Active Screening Result</h3>
                <p className="text-xs text-slate-500">
                  Please upload a fundus photograph or perform a screening to generate AI diagnostic predictions and Grad-CAM saliency heatmaps.
                </p>
                <button
                  onClick={() => setActiveTab('screening')}
                  className="px-6 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-semibold text-xs shadow-md transition-all"
                >
                  Start New Screening
                </button>
              </div>
            )
          )}

          {activeTab === 'chat' && (
            <ChatPage onFindDoctor={() => setActiveTab('doctors')} />
          )}

          {activeTab === 'doctors' && (
            <FindDoctor
              initialCondition={doctorConditionFilter}
              onAppointmentBooked={handleAppointmentBooked}
            />
          )}

          {(activeTab === 'reports' || activeTab === 'trends') && (
            <HistoryTrends 
              onBack={() => setActiveTab('dashboard')} 
              onStartScreening={() => setActiveTab('screening')}
            />
          )}

          {activeTab === 'appointments' && (
            <PatientDashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'doctor-portal' && (
            <DoctorPortal />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'profile' && (
            <ProfilePage setActiveTab={setActiveTab} />
          )}
        </main>

        {/* Bottom Mobile Navigation (Screen 12) */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Floating AI Chat Assistant (hidden when on the full chat page) */}
      {activeTab !== 'chat' && <ChatbotWidget />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ScreeningProvider>
        <MainApp />
      </ScreeningProvider>
    </AuthProvider>
  );
}
