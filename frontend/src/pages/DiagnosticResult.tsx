import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Printer, 
  ArrowRight, 
  MapPin, 
  AlertTriangle, 
  Info,
  Layers, 
  Bot, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { ScreeningResult } from '../types';

interface DiagnosticResultProps {
  result: ScreeningResult;
  onFindDoctor: (condition: string) => void;
  onAskChatbot: () => void;
}

export const DiagnosticResult: React.FC<DiagnosticResultProps> = ({
  result,
  onFindDoctor,
  onAskChatbot
}) => {
  const isHighRisk = result.risk_level.toLowerCase().includes('high');
  const isModerateRisk = result.risk_level.toLowerCase().includes('medium') || result.risk_level.toLowerCase().includes('moderate');
  const isLowRisk = !isHighRisk && !isModerateRisk;

  const riskBadgeClass = isHighRisk
    ? 'bg-red-50 text-red-700 border-red-200'
    : isModerateRisk
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const riskBarColor = isHighRisk
    ? 'bg-red-500'
    : isModerateRisk
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const printReport = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6 animate-fade-in text-left print:p-0">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight flex items-center space-x-2">
          <Activity className="w-6 h-6 text-[#0756B8]" />
          <span>AI Analysis Result</span>
        </h2>
        <div className="text-xs text-slate-500 font-medium">
          Screening ID: #{result.screening_id || 'SCR-2026-0910'}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Original Image & AI Heatmap (Grad-CAM) side by side */}
        <div className="lg:col-span-6 card-clean p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Original Image */}
            <div className="space-y-2 text-center">
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#071426] border-2 border-slate-200 shadow-sm relative group">
                <img 
                  src={result.image_url} 
                  alt="Original Retina Scan" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-[#071426] block">
                Original Image
              </span>
            </div>

            {/* AI Heatmap (Grad-CAM) */}
            <div className="space-y-2 text-center">
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#071426] border-2 border-slate-200 shadow-sm relative group">
                <img 
                  src={result.gradcam_image_base64.startsWith('data:') ? result.gradcam_image_base64 : `data:image/jpeg;base64,${result.gradcam_image_base64}`} 
                  alt="AI Heatmap Grad-CAM" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-[#071426] block">
                AI Heatmap (Grad-CAM)
              </span>
            </div>
          </div>

          {/* Affected Regions note */}
          {result.affected_quadrants && result.affected_quadrants.length > 0 && (
            <div className="p-3 bg-[#F1F6FC] rounded-xl border border-blue-100 text-xs text-slate-600">
              <strong className="text-[#071426]">Localized Regions: </strong>
              {result.affected_quadrants.join(', ')}
            </div>
          )}
        </div>

        {/* Right Column: AI Prediction Card */}
        <div className="lg:col-span-6 card-clean p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                AI Prediction
              </div>
              <div className="text-xl font-black text-[#071426] mt-1">
                {result.primary_condition}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Confidence: <strong className="text-[#0756B8]">{result.primary_confidence}%</strong>
              </div>
            </div>

            {/* Medium / High / Low Risk Badge */}
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${riskBadgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-red-500' : isModerateRisk ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{result.risk_level}</span>
            </span>
          </div>

          {/* Class Probabilities Bar Chart */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#071426]">Class Probabilities</div>
            
            {result.all_predictions.map((p, idx) => {
              const isPrimary = p.condition === result.primary_condition;
              const barColor = isPrimary
                ? riskBarColor
                : p.condition === 'Normal'
                ? 'bg-emerald-500'
                : 'bg-slate-300';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{p.condition}</span>
                    <span className="font-bold text-[#071426]">{p.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => onFindDoctor(result.primary_condition)}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-md shadow-[#0756B8]/20 flex items-center justify-center space-x-2 transition-all hover:scale-102"
            >
              <MapPin className="w-4 h-4" />
              <span>Find Nearby Specialists</span>
            </button>

            <button
              onClick={onAskChatbot}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#F1F6FC] hover:bg-blue-100/60 text-[#0756B8] font-bold text-xs border border-blue-200 flex items-center justify-center space-x-2 transition-colors"
            >
              <Bot className="w-4 h-4 text-[#0756B8]" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

      </div>

      {/* "Why this result?" Card */}
      <div className="card-clean p-5 space-y-2">
        <h4 className="text-sm font-bold text-[#071426]">Why this result?</h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {result.clinical_recommendation || 
            'The deep learning model identified structural and microvascular variations in the retinal field commonly associated with the predicted condition. The Grad-CAM attention overlay displays the focal pixel regions weighted highest during inference.'}
        </p>
      </div>

      {/* Disclaimer Alert & Full Report Button */}
      <div className="p-4 rounded-2xl bg-[#F1F6FC] border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-[#0756B8] shrink-0" />
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-[#071426]">Medical Notice:</strong> This is an automated screening result and not a definitive medical diagnosis. Please consult an ophthalmologist for comprehensive dilated slit-lamp biomicroscopy.
          </p>
        </div>

        <button
          onClick={printReport}
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#071426] font-bold text-xs border border-slate-300 shrink-0 shadow-2xs transition-colors flex items-center space-x-1.5"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>View Full Report</span>
        </button>
      </div>

    </div>
  );
};
