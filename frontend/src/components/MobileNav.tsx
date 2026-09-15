import React from 'react';
import { Home, FileText, Camera, Bot, User } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 px-4 py-2 z-50 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center space-y-1 text-xs font-semibold transition-colors ${
          activeTab === 'home' || activeTab === 'landing' ? 'text-[#0756B8]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setActiveTab('reports')}
        className={`flex flex-col items-center space-y-1 text-xs font-semibold transition-colors ${
          activeTab === 'reports' ? 'text-[#0756B8]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span>Reports</span>
      </button>

      {/* Primary Center Action Button */}
      <button
        onClick={() => setActiveTab('screening')}
        className="flex flex-col items-center -mt-6 focus:outline-none"
        aria-label="Start Eye Scan"
      >
        <div className="w-12 h-12 rounded-full bg-[#0756B8] text-white flex items-center justify-center shadow-lg shadow-[#0756B8]/35 border-4 border-white hover:bg-[#054494] transition-all scale-105 ring-2 ring-[#19C7E8]/50">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-[#0756B8] mt-1">Scan</span>
      </button>

      <button
        onClick={() => setActiveTab('chat')}
        className={`flex flex-col items-center space-y-1 text-xs font-semibold transition-colors ${
          activeTab === 'chat' ? 'text-[#0756B8]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Bot className="w-5 h-5" />
        <span>Chat</span>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center space-y-1 text-xs font-semibold transition-colors ${
          activeTab === 'profile' ? 'text-[#0756B8]' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </button>
    </nav>
  );
};
