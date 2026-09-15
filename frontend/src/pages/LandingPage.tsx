import React from 'react';
import { 
  Eye, 
  Bot, 
  Stethoscope, 
  Calendar, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Layers, 
  PhoneCall,
  Leaf
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  return (
    <div className="space-y-16 py-6 animate-fade-in">
      {/* Hero Section matching Screen 1 */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, 4 Pills, CTAs */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#edf5ff] border border-[#bcdbff] text-[#0756B8] text-xs font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#19C7E8]" />
              <span>National Clinical AI Initiative • Tele-Ophthalmology</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#071426] leading-[1.15]">
              Better Vision <br />
              <span className="text-[#0756B8]">
                Brighter Future
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed font-normal">
              AI-powered eye health screening, personalized care guidance and easy access to trusted eye specialists — all in one place.
            </p>

            {/* 4 Feature Icon Pills matching Screen 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center shrink-0">
                  {user?.role === 'patient' ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <span className="text-xs font-bold text-[#071426]">
                  {user?.role === 'patient' ? 'Clinical Reports' : 'AI Screening'}
                </span>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#071426]">Chatbot Assistant</span>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#071426]">Find Nearby Doctor</span>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-[#edf5ff] text-[#0756B8] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#071426]">Book Appointment</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => setActiveTab(user?.role === 'patient' ? 'dashboard' : 'screening')}
                className="px-8 py-3.5 rounded-xl bg-[#0756B8] hover:bg-[#054494] text-white font-bold text-sm shadow-md shadow-[#0756B8]/25 hover:scale-102 transition-all flex items-center space-x-2 focus:outline-none focus:ring-4 focus:ring-[#19C7E8]/40"
              >
                <span>{user?.role === 'patient' ? 'Open Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('doctors')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F1F6FC] text-[#071426] font-bold text-sm border border-slate-300 transition-all hover:border-slate-400"
              >
                Find Specialists
              </button>
            </div>
          </div>

          {/* Right Column: Hero Eye Visual with Scanning Reticle & Tag matching Screen 1 */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            {/* Background Soft Glow */}
            <div className="absolute w-72 h-72 bg-[#19C7E8]/20 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Circular Eye Graphic with Reticle */}
            <div className="relative w-80 sm:w-96 aspect-square rounded-full p-2 bg-gradient-to-tr from-[#0756B8] via-[#19C7E8] to-[#bcdbff] shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#071426] border-4 border-white">
                <img 
                  src="/sample_images/normal_retina.jpg" 
                  alt="AI Eye Scanning"
                  className="w-full h-full object-cover"
                />
                {/* AI Reticle Targeting Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 rounded-full border border-[#19C7E8]/60 animate-ping opacity-30" />
                  <div className="w-40 h-40 rounded-full border-2 border-[#19C7E8]/80 border-dashed animate-spin" style={{ animationDuration: '24s' }} />
                  <div className="w-24 h-24 rounded-full border border-[#bcdbff]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#19C7E8] shadow-lg shadow-[#19C7E8]" />
                </div>
              </div>
            </div>

            {/* Professional medical tag */}
            <div className="mt-4 flex items-center space-x-2 text-[#0756B8] font-semibold text-sm sm:text-base bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full border border-[#bcdbff] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#0756B8]" />
              <span>Healthy Eyes, Healthy Lives</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4 Steps Overview matching Workflow */}
      <section id="features" className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071426]">
            How Netra AI Works
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            A comprehensive, closed-loop clinical screening and specialist care-navigation system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-clean p-6 text-left space-y-3 hover:border-[#19C7E8] transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] font-black text-sm flex items-center justify-center border border-[#bcdbff]">
              1
            </div>
            <h3 className="text-base font-bold text-[#071426]">Upload Image</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Drag & drop fundus photographs or capture directly with phone and retinal lens attachments.
            </p>
          </div>

          <div className="card-clean p-6 text-left space-y-3 hover:border-[#19C7E8] transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] font-black text-sm flex items-center justify-center border border-[#bcdbff]">
              2
            </div>
            <h3 className="text-base font-bold text-[#071426]">Quality Check</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated Laplacian blur, contrast, and luminance scoring prevents unreadable inputs.
            </p>
          </div>

          <div className="card-clean p-6 text-left space-y-3 hover:border-[#19C7E8] transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] font-black text-sm flex items-center justify-center border border-[#bcdbff]">
              3
            </div>
            <h3 className="text-base font-bold text-[#071426]">AI Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-condition neural evaluation (Diabetic Retinopathy, Glaucoma, Cataract, AMD) with Grad-CAM heatmaps.
            </p>
          </div>

          <div className="card-clean p-6 text-left space-y-3 hover:border-[#19C7E8] transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#edf5ff] text-[#0756B8] font-black text-sm flex items-center justify-center border border-[#bcdbff]">
              4
            </div>
            <h3 className="text-base font-bold text-[#071426]">Connect to Doctor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Geolocation ranking connects you to verified Indian ophthalmologists with instant booking.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Notification Bar */}
      <section className="max-w-7xl mx-auto">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">Ocular Emergency Assistance</h4>
              <p className="text-xs text-red-700">
                Experiencing sudden loss of vision, severe eye trauma, or acute pain? Call 112 / 108 or contact the emergency eye casualty immediately.
              </p>
            </div>
          </div>
          <a
            href="tel:112"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 shadow-sm transition-colors"
          >
            Emergency Call: 112
          </a>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-clean p-5 text-center">
          <div className="text-3xl font-black text-[#071426]">94.6%</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">Diagnostic Accuracy</div>
        </div>
        <div className="card-clean p-5 text-center">
          <div className="text-3xl font-black text-[#0756B8]">0.978</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">ROC-AUC Performance</div>
        </div>
        <div className="card-clean p-5 text-center">
          <div className="text-3xl font-black text-[#071426]">5 Types</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">Major Eye Conditions</div>
        </div>
        <div className="card-clean p-5 text-center">
          <div className="text-3xl font-black text-[#0756B8]">&lt; 1.5s</div>
          <div className="text-xs text-slate-500 mt-1 font-semibold">Fast Processing Speed</div>
        </div>
      </section>
    </div>
  );
};
