import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  LayoutDashboard, 
  Home, 
  User, 
  Eye, 
  Bot, 
  Stethoscope, 
  FileText, 
  Calendar, 
  LogOut, 
  X, 
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavMenuDropdownProps {
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  isLogout?: boolean;
  roleFilter?: string[];
}

export const NavMenuDropdown: React.FC<NavMenuDropdownProps> = ({
  activeTab = 'dashboard',
  setActiveTab,
  className = ''
}) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Complete navigation options in the slide bar drawer
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      description: 'Clinical workflows & diagnostic AI',
      icon: Home
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Ocular health summary & quick stats',
      icon: LayoutDashboard
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'Personal details & ABHA Health ID',
      icon: User
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      description: 'Interactive ophthalmic chatbot triage',
      icon: Bot
    },
    {
      id: 'doctors',
      label: 'Find Doctor',
      description: 'Locate specialists & book visits',
      icon: Stethoscope
    },
    {
      id: 'reports',
      label: 'My Reports',
      description: 'Screening history & visual trajectories',
      icon: FileText
    },
    {
      id: 'appointments',
      label: 'Appointments',
      description: 'Upcoming consultations & history',
      icon: Calendar
    },
    // Optional role-specific links for doctor/admin users
    ...(user?.role === 'doctor' || user?.role === 'admin'
      ? [
          {
            id: 'screening',
            label: 'New Screening',
            description: 'Upload & analyze retinal fundus images',
            icon: Eye,
            roleFilter: ['doctor', 'admin']
          },
          {
            id: 'doctor-portal',
            label: 'Doctor Portal',
            description: 'Specialist case queue & validation',
            icon: Stethoscope,
            roleFilter: ['doctor', 'admin']
          }
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          {
            id: 'admin',
            label: 'Admin Overview',
            description: 'System telemetry & doctor verifications',
            icon: ShieldCheck,
            roleFilter: ['admin']
          }
        ]
      : []),
    {
      id: 'logout',
      label: 'Logout',
      description: 'Sign out of your Netra AI account',
      icon: LogOut,
      isLogout: true
    }
  ];

  // Keep item refs array aligned
  itemRefs.current = itemRefs.current.slice(0, menuItems.length);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle focus when menu opens or focusedIndex changes
  useEffect(() => {
    if (isOpen) {
      if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
        itemRefs.current[focusedIndex]?.focus();
      } else {
        // Find index of currently active tab or default to 0
        const activeIdx = menuItems.findIndex((item) => item.id === activeTab || (item.id === 'home' && activeTab === 'landing'));
        const targetIdx = activeIdx >= 0 ? activeIdx : 0;
        setFocusedIndex(targetIdx);
        itemRefs.current[targetIdx]?.focus();
      }
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation inside the menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < menuItems.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : menuItems.length - 1;
          itemRefs.current[next]?.focus();
          return next;
        });
        break;

      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
        break;

      case 'End':
        e.preventDefault();
        const lastIdx = menuItems.length - 1;
        setFocusedIndex(lastIdx);
        itemRefs.current[lastIdx]?.focus();
        break;

      case 'Tab':
        // Close menu on tab away
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelectOption = (item: MenuItem) => {
    setIsOpen(false);
    if (item.isLogout) {
      logout();
      setActiveTab('login');
    } else {
      setActiveTab(item.id);
    }
    // Return focus to button
    buttonRef.current?.focus();
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Slide Bar Navigation Button */}
      <button
        ref={buttonRef}
        type="button"
        id="netra-dashboard-slidebar-button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="netra-dashboard-navigation-slidebar"
        aria-label="Navigation slide bar"
        title="Open navigation slide bar"
        className={`relative p-2 rounded-xl border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:ring-offset-2 ${
          isOpen
            ? 'bg-[#F1F6FC] text-[#0756B8] border-[#0756B8] ring-2 ring-[#19C7E8]/30 shadow-xs'
            : 'bg-white text-slate-700 border-slate-200/90 hover:bg-[#F1F6FC] hover:text-[#0756B8] hover:border-[#19C7E8]/70 shadow-2xs'
        }`}
      >
        <Menu className="w-5 h-5 transition-transform duration-200" />
      </button>

      {/* Backdrop overlay with smooth fade animation */}
      <div 
        className={`fixed inset-0 bg-[#071426]/50 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide Bar Navigation Drawer with smooth slide animation */}
      <div
        ref={menuRef}
        id="netra-dashboard-navigation-slidebar"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="netra-dashboard-slidebar-button"
        onKeyDown={handleKeyDown}
        className={`fixed inset-y-0 left-0 flex w-[min(22rem,calc(100vw-1rem))] flex-col bg-white border-r border-slate-200 shadow-2xl shadow-slate-900/25 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        {/* Header inside Menu */}
        <div className="bg-[#071426] px-4 py-3.5 text-white flex items-center justify-between border-b border-[#0e223f]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img 
                src="/netra-ai-logo-transparent.png" 
                alt="Netra AI" 
                className="w-7 h-7 object-contain" 
              />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight leading-none flex items-center space-x-1">
                <span>NETRA</span>
                <span className="text-[#19C7E8]">AI</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">Menu</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium truncate max-w-[150px]">
                {user?.name || 'Clinical Navigation'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0e223f] transition-colors focus:outline-none focus:ring-1 focus:ring-[#19C7E8]"
            aria-label="Close navigation slide bar"
            title="Close slide bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable navigation list */}
        <div className="flex-1 py-2 overflow-y-auto divide-y divide-slate-100">
          <div className="px-1.5 py-1 space-y-0.5">
            {menuItems.map((item, index) => {
              const isCurrent = activeTab === item.id || (item.id === 'home' && activeTab === 'landing');
              const Icon = item.icon;

              if (item.isLogout) {
                return (
                  <div key={item.id} className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      ref={(el) => (itemRefs.current[index] = el)}
                      type="button"
                      role="menuitem"
                      tabIndex={focusedIndex === index ? 0 : -1}
                      onClick={() => handleSelectOption(item)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors group focus:outline-none focus:bg-rose-50"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-slate-800 group-hover:text-rose-700">
                            {item.label}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  ref={(el) => (itemRefs.current[index] = el)}
                  type="button"
                  role="menuitem"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onClick={() => handleSelectOption(item)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group focus:outline-none ${
                    isCurrent
                      ? 'bg-[#F1F6FC] text-[#071426] font-semibold border-l-4 border-[#19C7E8] shadow-2xs'
                      : 'text-slate-700 hover:bg-[#F1F6FC]/70 hover:text-[#0756B8]'
                  } focus:ring-1 focus:ring-[#19C7E8]`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isCurrent
                          ? 'bg-[#0756B8] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-[#d7e7fe] group-hover:text-[#0756B8]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-xs truncate block ${
                            isCurrent ? 'font-bold text-[#0756B8]' : 'font-semibold text-slate-800 group-hover:text-[#0756B8]'
                          }`}
                        >
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#edf5ff] text-[#0756B8] border border-[#bcdbff] shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-400 font-normal truncate">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-[#0756B8]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0756B8] transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info pill */}
        <div className="px-4 py-2 bg-[#F1F6FC] border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-semibold text-[#071426]">Netra AI Clinical Suite</span>
          <span className="font-mono text-slate-400">v2.5</span>
        </div>
      </div>
    </div>
  );
};
