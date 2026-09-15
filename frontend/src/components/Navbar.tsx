import React from 'react';
import { Eye, ShieldAlert, User, Activity, Stethoscope, LineChart, Languages, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, hasResult }) => {
  const { user, language, setLanguage } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button 
            type="button"
            className="flex items-center space-x-3 cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-[#19C7E8] rounded-xl p-1"
            onClick={() => setActiveTab('landing')}
            aria-label="Netra AI Home"
          >
            <img 
              src="/netra-ai-logo-transparent.png" 
              alt="Netra AI Logo" 
              className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                NETRA AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-[#0756B8]/20 text-[#19C7E8] border border-[#19C7E8]/30">
                Eye Care Portal
              </span>
            </div>
          </button>

          {/* Accessible Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                activeTab === 'landing' 
                  ? 'bg-cyan-950/90 text-cyan-300 font-semibold border border-cyan-800' 
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </button>

            {user?.role !== 'patient' && (
              <button
                onClick={() => setActiveTab('screening')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  activeTab === 'screening' 
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold shadow-md shadow-cyan-900/40' 
                    : 'text-cyan-300 hover:text-white hover:bg-slate-800/60 font-semibold'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Eye Screening</span>
              </button>
            )}

            {hasResult && (
              <button
                onClick={() => setActiveTab('result')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  activeTab === 'result' 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold' 
                    : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>My Scan Result</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                activeTab === 'doctors' 
                  ? 'bg-cyan-950/90 text-cyan-300 font-semibold border border-cyan-800' 
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Find Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-950/90 text-cyan-300 font-semibold border border-cyan-800' 
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              My Records
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                activeTab === 'trends' 
                  ? 'bg-cyan-950/90 text-cyan-300 font-semibold border border-cyan-800' 
                  : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LineChart className="w-4 h-4 text-teal-400" />
              <span>Health Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('doctor-portal')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                activeTab === 'doctor-portal' 
                  ? 'bg-indigo-950/90 text-indigo-300 font-semibold border border-indigo-700' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-indigo-400" />
              <span>Doctor Portal</span>
            </button>
          </nav>

          {/* Controls: Language, Role Switcher, Emergency */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-800/80 rounded-lg px-2 py-1 text-xs border border-slate-700">
              <Languages className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
              >
                <option value="en" className="bg-slate-900 text-white">English</option>
                <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
                <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
              </select>
            </div>

            {/* User Account / Sign In */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 rounded-xl p-1 pl-2.5 border border-slate-700 text-xs">
                <div 
                  className="flex items-center space-x-1.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  onClick={() => {
                    if (user.role === 'doctor') setActiveTab('doctor-portal');
                    else setActiveTab('dashboard');
                  }}
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-white max-w-[90px] sm:max-w-[130px] truncate">{user.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    user.role === 'doctor'
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      : user.role === 'admin'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors text-[11px]"
                  title="Switch or Change Account"
                >
                  Switch
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center space-x-1.5 ${
                  activeTab === 'login'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-900/30'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Emergency Hotline Button */}
            <a
              href="tel:112"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-800/50 text-red-400 hover:bg-red-900/80 text-xs font-semibold transition-all shadow-sm"
              title="National Ocular Emergency Helpline: 112"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden xl:inline">SOS: 112</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
