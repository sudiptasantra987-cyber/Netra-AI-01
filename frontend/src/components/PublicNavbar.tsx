import React from 'react';
import { Eye, Languages, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PublicNavbarProps {
  setActiveTab: (tab: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ setActiveTab }) => {
  const { user, language, setLanguage } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <img 
            src="/netra-ai-logo-transparent.png" 
            alt="Netra AI" 
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
          />
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#071426]">
              Netra AI
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-blue-50 text-[#0756B8] border border-blue-200">
              Care Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <button 
            onClick={() => setActiveTab('landing')}
            className="text-[#0756B8] hover:text-[#064696] transition-colors font-bold"
          >
            Home
          </button>
          <a 
            href="#features"
            className="hover:text-[#0756B8] transition-colors"
          >
            Features
          </a>
          <a 
            href="#about"
            className="hover:text-[#0756B8] transition-colors"
          >
            About
          </a>
          <a 
            href="#contact"
            className="hover:text-[#0756B8] transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Right Controls: Language, Login & Register */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Languages className="w-3.5 h-3.5 text-[#0756B8] mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer text-xs font-semibold text-slate-700"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>

          {user ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-md shadow-[#0756B8]/20 transition-all flex items-center space-x-2"
            >
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0756B8] hover:bg-blue-50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-md shadow-[#0756B8]/20 transition-all hover:scale-102"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
