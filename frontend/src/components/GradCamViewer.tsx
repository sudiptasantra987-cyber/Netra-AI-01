import React, { useState } from 'react';
import { Eye, Layers, SplitSquareVertical, Info, Zap } from 'lucide-react';

interface GradCamViewerProps {
  originalImageUrl: string;
  gradCamBase64?: string;
  condition: string;
  confidence: number;
  affectedQuadrants: string[];
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({
  originalImageUrl,
  gradCamBase64,
  condition,
  confidence,
  affectedQuadrants
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'blend'>('blend');
  const [blendOpacity, setBlendOpacity] = useState<number>(65);

  const effectiveGradCam = gradCamBase64 || originalImageUrl;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-slate-900/90 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Explainable AI (Grad-CAM Saliency)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gradient-weighted Class Activation Mapping localizing convolutional decision features
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode('blend')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              viewMode === 'blend' ? 'bg-[#0756B8] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Opacity Overlay</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              viewMode === 'side-by-side' ? 'bg-[#0756B8] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div className="mt-6">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[360px] rounded-2xl overflow-hidden border border-slate-700 bg-black shadow-lg">
                <img
                  src={originalImageUrl}
                  alt="Raw Ocular Fundus"
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-slate-200 border border-slate-700">
                  Original Photograph
                </span>
              </div>
            </div>

            {/* Grad-CAM */}
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[360px] rounded-2xl overflow-hidden border border-cyan-800/80 bg-black shadow-lg shadow-cyan-950/40">
                <img
                  src={effectiveGradCam}
                  alt="Grad-CAM Saliency"
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-cyan-950/80 backdrop-blur-sm text-[11px] font-semibold text-cyan-300 border border-cyan-700">
                  AI Attention Heatmap
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Blend Slider View */
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[420px] rounded-2xl overflow-hidden border border-cyan-700/60 bg-black shadow-2xl">
              {/* Base Original */}
              <img
                src={originalImageUrl}
                alt="Base Fundus"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {/* Blended Heatmap Overlay */}
              <img
                src={effectiveGradCam}
                alt="Grad-CAM Overlay"
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 mix-blend-screen"
                style={{ opacity: blendOpacity / 100 }}
              />
              <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-cyan-300 border border-cyan-800/80">
                Attention Overlay: {blendOpacity}%
              </span>
            </div>

            {/* Opacity Range Slider */}
            <div className="w-full max-w-[420px] mt-4 px-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                <span>Original Fundus</span>
                <span className="text-cyan-400 font-bold">{blendOpacity}% Thermal Intensity</span>
                <span>Full Activation Map</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blendOpacity}
                onChange={(e) => setBlendOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Affected Anatomical Quadrants & Clinical Interpretation */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block mb-2 font-semibold flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Key Spatial Activation Zones:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {affectedQuadrants.map((q, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-medium"
              >
                {q}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-2.5 text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-[#19C7E8] shrink-0 mt-0.5" />
          <p>
            The thermal heatmap displays regions of high gradient flux contributing to the prediction of{' '}
            <strong className="text-white">{condition}</strong> ({confidence}%). High-intensity regions denote microvascular clustering, cup/rim boundaries, or foveal pathology.
          </p>
        </div>
      </div>
    </div>
  );
};
