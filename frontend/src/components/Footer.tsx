import React from 'react';
import { ShieldAlert, Heart, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#071426] border-t border-slate-800/80 mt-16 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-3">
              <img 
                src="/netra-ai-logo-transparent.png" 
                alt="Netra AI Logo" 
                className="h-9 w-auto object-contain"
              />
              <span className="text-base font-bold text-white tracking-tight">NETRA AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              An intelligent, closed-loop eye-health screening, explainable diagnostic, and clinical care-navigation network. 
              Bridging the gap between automated image evaluation and verified in-person ophthalmology care.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-[#19C7E8] font-semibold pt-1">
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#19C7E8]" />
              <span>Advanced Clinical Healthcare AI Innovation</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">Care Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-[#19C7E8] transition-colors cursor-pointer">Fundus Image Quality Checker</span></li>
              <li><span className="hover:text-[#19C7E8] transition-colors cursor-pointer">Multi-Disease AI Screener</span></li>
              <li><span className="hover:text-[#19C7E8] transition-colors cursor-pointer">Explainable Grad-CAM Heatmaps</span></li>
              <li><span className="hover:text-[#19C7E8] transition-colors cursor-pointer">Ophthalmologist Geolocation Ranking</span></li>
              <li><span className="hover:text-[#19C7E8] transition-colors cursor-pointer">Real-time Slot Booking Calendar</span></li>
            </ul>
          </div>

          {/* Emergency & Safety */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-3 uppercase tracking-wider text-[11px]">Emergency Hotline</h4>
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Ocular Emergency Protocol</span>
              </div>
              <p className="text-[11px] leading-tight text-red-200/90">
                For sudden vision loss or traumatic ocular pain, call 112 / 108 or report to the nearest emergency eye casualty immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p className="leading-relaxed">
            *Clinical Disclaimer: Netra AI is an automated screening and clinical triaging tool intended to assist registered medical practitioners. It does not replace comprehensive in-person slit-lamp biomicroscopy or direct ophthalmoscopy.*
          </p>
          <div className="flex items-center space-x-1 shrink-0 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>for Global Eye Health</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
