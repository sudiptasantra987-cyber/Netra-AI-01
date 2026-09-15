import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { QualityMetrics } from '../types';

interface ImageQualityModalProps {
  metrics: QualityMetrics;
  onClose: () => void;
  onProceedAnyway?: () => void;
}

export const ImageQualityModal: React.FC<ImageQualityModalProps> = ({
  metrics,
  onClose,
  onProceedAnyway
}) => {
  const isGood = metrics.is_suitable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel-glow max-w-lg w-full rounded-2xl p-6 relative border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isGood ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
          }`}>
            {isGood ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-bounce" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isGood ? 'Image Quality Verified' : 'Insufficient Image Quality'}
            </h3>
            <p className="text-xs text-slate-400">
              {isGood ? 'Optimal clinical parameters for deep neural inference' : 'Image quality does not meet clinical diagnostic threshold'}
            </p>
          </div>
        </div>

        {/* Overall Quality Score Meter */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Composite Quality Score</span>
            <span className={`text-lg font-bold ${
              metrics.composite_quality >= 75 ? 'text-emerald-400' : metrics.composite_quality >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {metrics.composite_quality}% ({metrics.status_label})
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 rounded-full ${
                metrics.composite_quality >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                metrics.composite_quality >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, metrics.composite_quality))}%` }}
            />
          </div>
        </div>

        {/* 4 Critical Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 mb-1">Sharpness (Focus)</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{metrics.sharpness_score}%</span>
              {metrics.sharpness_score >= 35 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Laplacian Variance</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 mb-1">Brightness Balance</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{metrics.brightness_score}%</span>
              {metrics.brightness_score >= 25 && metrics.brightness_score <= 85 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Retinal Luminance</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 mb-1">RMS Contrast</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{metrics.contrast_score}%</span>
              {metrics.contrast_score >= 30 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Vascular Definition</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 mb-1">Sensor Noise</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{metrics.noise_level}%</span>
              {metrics.noise_level <= 30 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">High-Freq Residual</div>
          </div>
        </div>

        {/* Guidance / Reasons */}
        <div className={`p-3.5 rounded-xl text-xs mb-5 ${
          isGood ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800/40' : 'bg-red-950/40 text-red-200 border border-red-800/40'
        }`}>
          <div className="font-semibold mb-1">Clinical Operator Feedback:</div>
          <p className="leading-relaxed">{metrics.guidance}</p>
          {metrics.rejection_reasons.length > 0 && (
            <ul className="list-disc list-inside mt-2 space-y-1 text-[11px] text-red-300">
              {metrics.rejection_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Select Another Image</span>
          </button>
          
          {onProceedAnyway && (
            <button
              onClick={onProceedAnyway}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                isGood ? 'bg-[#0756B8] hover:bg-[#064696] text-white shadow-lg shadow-[#0756B8]/20' : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <span>{isGood ? 'Proceed to AI Analysis' : 'Override & Analyze Anyway'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
