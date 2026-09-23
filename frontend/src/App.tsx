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
import { NotificationsPage } from './pages/NotificationsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';

const MainApp: React.FC = () => {
  const { user, isLoadingSession } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const token = localStorage.getItem('netra_token');
    if (!token) return 'login';
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && hash !== 'login') return hash;
    const saved = localStorage.getItem('netra_active_tab');
    return saved && saved !== 'login' ? saved : 'home';
  });
  const [doctorConditionFilter, setDoctorConditionFilter] = useState<string>('All');
  const [screeningPatient, setScreeningPatient] = useState<{
    id: string;
    name: string;
    age?: number;
    gender?: string;
    city?: string;
  } | null>(null);
  const { latestResult, setLatestResult } = useScreening();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Sync activeTab to localStorage and URL hash
  useEffect(() => {
    if (activeTab && activeTab !== 'login') {
      localStorage.setItem('netra_active_tab', activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab]);

  // Listen to manual URL hash changes and enforce RBAC
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (!hash || hash === 'login') return;
      if (!user) {
        setActiveTab('login');
        return;
      }
      if (user.role !== 'admin' && hash.startsWith('admin')) {
        const target = user.role === 'doctor' ? 'doctor-portal' : 'home';
        setActiveTab(target);
        window.location.hash = `#${target}`;
        return;
      }
      if (user.role === 'patient' && hash.startsWith('doctor')) {
        setActiveTab('home');
        window.location.hash = '#home';
        return;
      }
      if (user.role === 'doctor' && (hash === 'appointments' || (hash === 'dashboard' && !hash.startsWith('doctor')))) {
        setActiveTab('doctor-portal');
        window.location.hash = '#doctor-portal';
        return;
      }
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  useEffect(() => {
    if (!isLoadingSession) {
      if (user && activeTab === 'login') {
        if (user.role === 'admin') setActiveTab('admin-dashboard');
        else if (user.role === 'doctor') setActiveTab('doctor-portal');
        else setActiveTab('home');
      } else if (!user) {
        setActiveTab('login');
      } else if (user?.role !== 'admin' && activeTab.startsWith('admin')) {
        // Enforce RBAC: Non-admin users cannot access admin portal
        const target = user.role === 'doctor' ? 'doctor-portal' : 'home';
        setActiveTab(target);
        window.location.hash = `#${target}`;
      } else if (user?.role === 'patient' && activeTab.startsWith('doctor')) {
        // Prevent patient accessing doctor routes directly
        setActiveTab('home');
        window.location.hash = '#home';
      } else if (user?.role === 'doctor' && (activeTab === 'appointments' || (activeTab === 'dashboard' && !activeTab.startsWith('doctor')))) {
        setActiveTab('doctor-portal');
        window.location.hash = '#doctor-portal';
      }
    }
  }, [user, isLoadingSession, activeTab]);

  const handleLoginSuccess = (loggedInUser: any) => {
    if (loggedInUser.role === 'admin') {
      setActiveTab('admin-dashboard');
      localStorage.setItem('netra_active_tab', 'admin-dashboard');
    } else if (loggedInUser.role === 'doctor') {
      setActiveTab('doctor-portal');
      localStorage.setItem('netra_active_tab', 'doctor-portal');
    } else {
      setActiveTab('home');
      localStorage.setItem('netra_active_tab', 'home');
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
          title: user?.role === 'doctor'
            ? 'Doctor Dashboard - Tele-Screening Review'
            : user?.role === 'admin'
            ? 'Admin Dashboard - System Overview'
            : 'Patient Portal Home',
          subtitle: user?.role === 'doctor'
            ? 'Assigned patient metrics, screening reports awaiting evaluation, and urgent clinical flags'
            : user?.role === 'admin'
            ? 'Real-time telemetry, screening throughput, verified specialists, and high-risk case triage'
            : 'National tele-ophthalmology initiative, clinical AI features, and eye care guidance'
        };
      case 'dashboard':
        return {
          title: user?.role === 'doctor'
            ? 'Doctor Dashboard - Tele-Screening Review'
            : user?.role === 'admin'
            ? 'Admin Dashboard - System Overview'
            : 'Patient Health Dashboard',
          subtitle: user?.role === 'doctor'
            ? 'Assigned patient metrics, screening reports awaiting evaluation, and urgent clinical flags'
            : user?.role === 'admin'
            ? 'Real-time telemetry, screening throughput, verified specialists, and high-risk case triage'
            : 'Ocular health monitoring, risk status, and quick clinical actions'
        };
      case 'screening':
        return {
          title: user?.role === 'patient' ? 'Retinal Screening Studio' : 'Eye Screening Studio',
          subtitle: user?.role === 'patient'
            ? 'Upload retinal fundus images for quality verification and tele-ophthalmology doctor review'
            : 'Upload fundus images for instant AI quality check and deep learning analysis'
        };
      case 'result':
        return {
          title: 'Diagnostic Analysis Result',
          subtitle: 'Multi-disease classification, Grad-CAM heatmap visualization, and clinical triage'
        };
      case 'notifications':
        return {
          title: 'Notifications & Alerts',
          subtitle: 'Clinical updates, evaluation notices, and report delivery alerts'
        };
      case 'settings':
        return {
          title: 'Account Settings & Preferences',
          subtitle: 'Manage credentials, security preferences, and personal health configuration'
        };
      case 'chat':
        return {
          title: 'AI Eye Health Assistant',
          subtitle: 'Interactive conversational triage and guidance powered by clinical ophthalmology knowledge'
        };
      case 'doctors':
        return {
          title: 'Find Eye Specialists',
          subtitle: 'Locate verified ophthalmologists and book clinic consultations'
        };
      case 'appointments':
        return {
          title: 'My Consultation Appointments',
          subtitle: 'Review your booked ophthalmology visits, hospital clinics, and slot receipts'
        };
      case 'reports':
      case 'trends':
        return {
          title: 'History & Screening Reports',
          subtitle: 'Track longitudinal screening records, visual trajectories, and clinical notes'
        };
      case 'doctor-portal':
      case 'doctor-dashboard':
        return {
          title: "Doctor Dashboard - Tele-Screening Review",
          subtitle: 'Assigned patient metrics, screening reports awaiting evaluation, and urgent clinical flags'
        };
      case 'doctor-patients':
        return {
          title: 'Assigned Patients Directory',
          subtitle: 'Search patient records, view ocular medical history, and access past retinal screenings'
        };
      case 'doctor-reports':
        return {
          title: 'AI Screening Reports Review',
          subtitle: 'Fundus image gradability, Explainable AI Grad-CAM attention heatmaps, and doctor sign-off'
        };
      case 'doctor-notifications':
        return {
          title: 'Clinical Notifications',
          subtitle: 'Newly assigned scans, urgent high-risk alerts, and image recapture requests'
        };
      case 'doctor-profile':
        return {
          title: 'Doctor Profile & Credentials',
          subtitle: 'Medical registration number, qualifications, hospital affiliation, and contact details'
        };
      case 'doctor-settings':
        return {
          title: 'Doctor Portal Settings',
          subtitle: 'Tele-ophthalmology outreach center configuration and clinical alert thresholds'
        };
      case 'admin':
      case 'admin-dashboard':
        return {
          title: 'Admin Dashboard - System Overview',
          subtitle: 'Real-time telemetry, screening throughput, verified specialists, and high-risk case triage'
        };
      case 'admin-patients':
        return {
          title: 'Patient Governance & Directory',
          subtitle: 'Search registered patients, manage account access status, and view screening activity'
        };
      case 'admin-doctors':
        return {
          title: 'Doctor Directory & Verification',
          subtitle: 'Verify medical registrations, approve or reject credentials, and manage doctor privileges'
        };
      case 'admin-reports':
        return {
          title: 'Screening Reports Technical Oversight',
          subtitle: 'Audit scan quality metrics, track ungradable fundus photographs, and inspect technical diagnostics'
        };
      case 'admin-monitoring':
        return {
          title: 'System Health & Engine Diagnostics',
          subtitle: 'Live application status, PyTorch model pipeline readiness, database integrity, and error logs'
        };
      case 'admin-notifications':
        return {
          title: 'Administrative Alerts & Broadcasts',
          subtitle: 'Doctor verification queues, image capture alerts, and system operational notices'
        };
      case 'admin-profile':
        return {
          title: 'Administrator Profile',
          subtitle: 'Manage administrative contact details and platform credentials'
        };
      case 'admin-settings':
        return {
          title: 'Platform Settings & Security',
          subtitle: 'Administrator credential management, password updates, and system configuration'
        };
      case 'profile':
        return {
          title: user?.role === 'doctor' ? 'Doctor Profile & Credentials' : 'Patient Profile & ABHA Identity',
          subtitle: user?.role === 'doctor' 
            ? 'Medical registration number, qualifications, and hospital affiliation' 
            : 'Ayushman Bharat Digital Mission (ABDM) record linkage and personal ocular history'
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
          localStorage.removeItem('netra_active_tab');
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
          {(activeTab === 'landing' || (activeTab === 'home' && user?.role === 'patient')) && (
            <LandingPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'dashboard' && user?.role === 'patient' && (
            <PatientDashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'screening' && (
            <ScreeningStudio 
              onAnalysisComplete={handleAnalysisComplete} 
              onBack={() => {
                if (user?.role === 'doctor') {
                  setActiveTab('doctor-patients');
                } else {
                  setActiveTab('home');
                }
              }}
              patientContext={screeningPatient}
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

          {activeTab === 'appointments' && (
            user?.role === 'doctor' ? (
              <DoctorPortal setActiveTab={setActiveTab} initialSection="dashboard" />
            ) : (
              <AppointmentsPage setActiveTab={setActiveTab} />
            )
          )}

          {(activeTab === 'reports' || activeTab === 'trends') && (
            <HistoryTrends 
              onBack={() => setActiveTab('home')} 
              onStartScreening={() => setActiveTab('screening')}
            />
          )}

          {activeTab === 'notifications' && (
            user?.role === 'doctor' ? (
              <DoctorPortal setActiveTab={setActiveTab} initialSection="notifications" />
            ) : user?.role === 'admin' ? (
              <AdminDashboard setActiveTab={setActiveTab} initialSection="notifications" />
            ) : (
              <NotificationsPage setActiveTab={setActiveTab} onBack={() => setActiveTab('home')} />
            )
          )}

          {activeTab === 'settings' && (
            user?.role === 'doctor' ? (
              <DoctorPortal setActiveTab={setActiveTab} initialSection="settings" />
            ) : user?.role === 'admin' ? (
              <AdminDashboard setActiveTab={setActiveTab} initialSection="settings" />
            ) : (
              <ProfilePage setActiveTab={setActiveTab} />
            )
          )}

          {(activeTab === 'doctor-portal' ||
            activeTab === 'doctor-dashboard' ||
            activeTab === 'doctor-patients' ||
            activeTab === 'doctor-reports' ||
            activeTab === 'doctor-notifications' ||
            activeTab === 'doctor-profile' ||
            activeTab === 'doctor-settings' ||
            (user?.role === 'doctor' && activeTab === 'dashboard')) && (
            <DoctorPortal 
              setActiveTab={setActiveTab} 
              onStartScreening={(pat) => {
                setScreeningPatient(pat);
                setActiveTab('screening');
              }}
              initialSection={
                activeTab === 'doctor-patients' ? 'patients' :
                activeTab === 'doctor-reports' ? 'reports' :
                activeTab === 'doctor-notifications' ? 'notifications' :
                activeTab === 'doctor-profile' ? 'profile' :
                activeTab === 'doctor-settings' ? 'settings' :
                'dashboard'
              } 
            />
          )}

          {(activeTab === 'admin' ||
            activeTab === 'admin-dashboard' ||
            activeTab === 'admin-patients' ||
            activeTab === 'admin-doctors' ||
            activeTab === 'admin-reports' ||
            activeTab === 'admin-monitoring' ||
            activeTab === 'admin-notifications' ||
            activeTab === 'admin-profile' ||
            activeTab === 'admin-settings') && user?.role === 'admin' && (
            <AdminDashboard 
              setActiveTab={setActiveTab} 
              initialSection={
                activeTab === 'admin-patients' ? 'patients' :
                activeTab === 'admin-doctors' ? 'doctors' :
                activeTab === 'admin-reports' ? 'reports' :
                activeTab === 'admin-monitoring' ? 'monitoring' :
                activeTab === 'admin-notifications' ? 'notifications' :
                activeTab === 'admin-profile' ? 'profile' :
                activeTab === 'admin-settings' ? 'settings' :
                'dashboard'
              } 
            />
          )}

          {activeTab === 'profile' && (
            user?.role === 'doctor' ? (
              <DoctorPortal setActiveTab={setActiveTab} initialSection="profile" />
            ) : (
              <ProfilePage setActiveTab={setActiveTab} />
            )
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
