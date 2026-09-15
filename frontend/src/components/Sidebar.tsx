import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Home,
  Eye, 
  Bot, 
  Stethoscope, 
  FileText, 
  Calendar, 
  User, 
  LogOut, 
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen,
  onClose,
  activeTab, 
  setActiveTab, 
  onLogout 
}) => {
  const { user, logout } = useAuth();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    logout();
    setActiveTab('login');
    onClose();
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'screening',
      label: 'New Screening',
      icon: Eye,
      roles: ['doctor', 'admin'],
      badge: 'Doctor'
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: Bot,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'doctors',
      label: 'Find Doctor',
      icon: Stethoscope,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'reports',
      label: 'My Reports',
      icon: FileText,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      roles: ['patient', 'doctor', 'admin']
    },
    {
      id: 'doctor-portal',
      label: 'Doctor Portal',
      icon: Stethoscope,
      roles: ['doctor', 'admin'],
      badge: 'Doctor'
    },
    {
      id: 'admin',
      label: 'Admin Overview',
      icon: ShieldCheck,
      roles: ['admin'],
      badge: 'Admin'
    }
  ];

  const filteredItems = navItems.filter(item => 
    !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Semi-transparent Backdrop Overlay for desktop & mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-[#071426]/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Sidebar Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-[#071426] text-white flex flex-col justify-between shadow-2xl border-r border-[#0e223f] select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation Sidebar"
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header with authentic logo & Close (×) button */}
          <div className="p-4 sm:px-5 sm:py-4 border-b border-[#0e223f] flex items-center justify-between shrink-0">
            <div 
              onClick={() => {
                setActiveTab('home');
                onClose();
              }}
              className="cursor-pointer group flex items-center space-x-3"
              title="Netra AI Home"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img 
                  src="/netra-ai-logo-transparent.png" 
                  alt="Netra AI" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-black tracking-tight text-white flex items-center space-x-1">
                  <span>NETRA</span>
                  <span className="text-[#19C7E8]">AI</span>
                </div>
                <div className="text-[10px] text-[#19C7E8]/80 font-medium tracking-wide">
                  AI FOR A CLEARER TOMORROW
                </div>
              </div>
            </div>

            {/* Close button (×) */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#0e223f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Identity / Role pill */}
          {user && (
            <div className="px-5 py-3 bg-[#0a1a33]/60 border-b border-[#0e223f] flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[#19C7E8] animate-pulse shrink-0" />
                <span className="text-slate-200 font-medium truncate max-w-[150px]">{user.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0756B8]/40 text-[#19C7E8] border border-[#0756B8]">
                {user.role}
              </span>
            </div>
          )}

          {/* Scrollable Navigation items */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'landing');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-[#0756B8]/25 text-white font-bold border-l-4 border-[#19C7E8] shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#0e223f]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon 
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-[#19C7E8]' : 'text-slate-400 group-hover:text-white'
                      }`} 
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-[#071426] text-[#19C7E8] border border-[#0756B8]/60">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[#0e223f] space-y-2 shrink-0 bg-[#071426]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400 hover:text-rose-400" />
            <span>Logout</span>
          </button>

          <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
            Netra AI • Clinical Edition
          </div>
        </div>
      </aside>
    </>
  );
};
