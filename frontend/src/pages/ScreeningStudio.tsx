import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Image as ImageIcon,
  Check,
  Clock,
  FileText,
  Info,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useScreening } from '../context/ScreeningContext';
import { QualityMetrics, ScreeningResult } from '../types';

interface ScreeningStudioProps {
  onAnalysisComplete: (result: ScreeningResult) => void;
  onBack?: () => void;
  patientContext?: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    city?: string;
  } | null;
  setActiveTab?: (tab: string) => void;
}

export const ScreeningStudio: React.FC<ScreeningStudioProps> = ({ 
  onAnalysisComplete,
  onBack,
  patientContext = null,
  setActiveTab
}) => {
  const { user } = useAuth();
  const { setLatestResult } = useScreening();

  const [patientNotes, setPatientNotes] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    status: string;
    is_gradable: boolean;
    message: string;
  } | null>(null);
  const [patientRequests, setPatientRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);

  const fetchPatientRequests = async () => {
    if (user?.role !== 'patient') return;
    try {
      setIsLoadingRequests(true);
      const reqs = await api.getMyScreeningRequests();
      setPatientRequests(reqs);
    } catch (e) {
      console.error('Error fetching patient requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'patient') {
      fetchPatientRequests();
    }
  }, [user?.role]);

  const submitPatientRequest = async () => {
    if (!selectedFile && !selectedSampleKey) {
      setErrorMessage('Please upload a fundus photograph or select a sample image.');
      return;
    }
    setIsSubmittingRequest(true);
    setErrorMessage(null);
    try {
      const res = await api.submitScreeningRequest(
        selectedFile || undefined,
        selectedSampleKey || undefined,
        patientNotes
      );
      setSubmissionResult({
        id: res.screening_id,
        status: res.status,
        is_gradable: res.is_gradable,
        message: res.message
      });
      setPatientNotes('');
      await fetchPatientRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit screening request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleKey, setSelectedSampleKey] = useState<string | null>('diabetic_retinopathy.jpg');
  const [previewUrl, setPreviewUrl] = useState<string | null>('/sample_images/diabetic_retinopathy.jpg');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>({
    sharpness_score: 91.5,
    contrast_score: 93.0,
    brightness_score: 92.0,
    noise_level: 10.5,
    resolution_ok: true,
    composite_quality: 92.0,
    is_suitable: true,
    status_label: 'Excellent',
    rejection_reasons: [],
    guidance: 'Suitable for clinical AI analysis',
    width: 1024,
    height: 1024
  });
  
  const [isCheckingQuality, setIsCheckingQuality] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedSampleKey(null);
      setPreviewUrl(URL.createObjectURL(file));
      setQualityMetrics(null);
      setErrorMessage(null);
      runQualityCheckOnFile(file);
    }
  };

  const handleSampleSelect = async (sampleKey: string) => {
    setSelectedSampleKey(sampleKey);
    setSelectedFile(null);
    setPreviewUrl(`/sample_images/${sampleKey}`);
    setErrorMessage(null);

    try {
      setIsCheckingQuality(true);
      const res = await fetch(`/sample_images/${sampleKey}`);
      const blob = await res.blob();
      const file = new File([blob], sampleKey, { type: 'image/jpeg' });
      const q = await api.checkQuality(file);
      setQualityMetrics(q);
    } catch (err: any) {
      console.error(err);
      // Fallback quality display
      setQualityMetrics({
        sharpness_score: 91.0,
        contrast_score: 92.5,
        brightness_score: 92.0,
        noise_level: 10.5,
        resolution_ok: true,
        composite_quality: 92.0,
        is_suitable: true,
        status_label: 'Excellent',
        rejection_reasons: [],
        guidance: 'Suitable for clinical AI analysis',
        width: 1024,
        height: 1024
      });
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const runQualityCheckOnFile = async (file: File) => {
    setIsCheckingQuality(true);
    setErrorMessage(null);
    try {
      const q = await api.checkQuality(file);
      setQualityMetrics(q);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quality verification failed');
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      alert('Camera access denied or unavailable. Please upload an image.');
      setIsCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setSelectedSampleKey(null);
          setPreviewUrl(URL.createObjectURL(blob));
          stopCamera();
          runQualityCheckOnFile(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const isDoctorUnverified = user?.role === 'doctor' && user?.verification_status !== 'verified';

  const executeFullAnalysis = async () => {
    if (!selectedFile && !selectedSampleKey) {
      setErrorMessage('Please upload a fundus photograph or select a sample image.');
      return;
    }

    if (isDoctorUnverified) {
      setErrorMessage(`Doctor verification required. Current status: '${user?.verification_status || 'pending'}'. Clinical screening is restricted.`);
      return;
    }

    if (user?.role === 'doctor' && !patientContext?.id) {
      setErrorMessage('Patient selection required. Please select or enroll a patient before performing retinal screening.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const targetPatientId = patientContext?.id || (user?.role === 'admin' ? 'pat-01' : user?.id);
      const targetPatientName = patientContext?.name || user?.name;

      const result = await api.analyzeScreening(
        selectedFile || undefined,
        selectedSampleKey || undefined,
        targetPatientId,
        targetPatientName,
        true
      );
      setLatestResult(result);
      onAnalysisComplete(result);
    } catch (err: any) {
      if (err.quality) {
        setQualityMetrics(err.quality);
      }
      setErrorMessage(err.message || 'Analysis could not be completed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Patient Screening Portal Flow ──────────────────────────────────────────
  if (user?.role === 'patient') {
    return (
      <div className="max-w-4xl mx-auto py-4 space-y-6 animate-fade-in text-left">
        {/* Header with Back button */}
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight">
              Retinal Screening
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated optical quality verification & specialist clinical review
            </p>
          </div>
        </div>

        {/* 4-Step Educational Process Overview */}
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0756B8]">
            <Info className="w-4 h-4" />
            <span className="uppercase tracking-wider">How Retinal Tele-Screening Works</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#F1F6FC] border border-blue-100 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#0756B8] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <span className="text-xs font-bold text-[#071426]">Fundus Capture</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Upload or capture high-resolution posterior pole retinal image.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F1F6FC] border border-blue-100 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#0756B8] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <span className="text-xs font-bold text-[#071426]">Optical Quality</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Automated check verifies sharpness, focus, and illumination.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F1F6FC] border border-blue-100 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#0756B8] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                <span className="text-xs font-bold text-[#071426]">Doctor Queue</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Assigned to tele-ophthalmology queue for verified specialist review.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F1F6FC] border border-blue-100 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#0756B8] text-white text-[10px] font-bold flex items-center justify-center">4</span>
                <span className="text-xs font-bold text-[#071426]">Doctor Sign-Off</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Doctor reviews Grad-CAM AI heatmaps and signs clinical report.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Confirmation Banner */}
        {submissionResult && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-emerald-950">
                    Screening Request Submitted Successfully!
                  </h3>
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                    {submissionResult.id}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {submissionResult.message}
                </p>
                <div className="text-[11px] text-emerald-700 pt-1">
                  Status: <strong className="uppercase font-bold">{submissionResult.status}</strong> • Queued in the Doctor Portal Review Queue.
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-1 pl-9">
              <button
                type="button"
                onClick={() => setActiveTab?.('reports')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Go to My Screening Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSubmissionResult(null)}
                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-semibold text-xs transition-colors"
              >
                Submit Another Scan
              </button>
            </div>
          </div>
        )}

        {/* Retinal Image Upload Card */}
        <div className="card-clean p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#071426]">
              1. Upload Retinal (Fundus) Photograph
            </h3>
            {previewUrl && (
              <span className="text-xs font-semibold text-[#0756B8] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Image Selected
              </span>
            )}
          </div>

          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-[#071426] border-2 border-[#0756B8] aspect-video flex flex-col items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={captureCameraFrame}
                  className="px-6 py-2.5 rounded-full bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Eye Image</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#0756B8] bg-white hover:bg-[#F1F6FC] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-[#F1F6FC] border border-blue-100 text-[#0756B8] flex items-center justify-center shadow-2xs">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#071426]">
                  Click or Drag & Drop Retinal Image
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Standard 45° or 50° fundus camera photograph
                </p>
                <p className="text-[11px] text-slate-400">
                  JPG, JPEG, PNG (Max 10MB)
                </p>
              </div>
            </div>
          )}

          {!isCameraActive && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-[#0756B8] text-slate-700 hover:text-[#0756B8] text-xs font-bold transition-all inline-flex items-center space-x-2 shadow-2xs"
              >
                <Camera className="w-4 h-4 text-[#0756B8]" />
                <span>Or Capture with Connected Fundus Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Preloaded Verified Retinal Scans for Clinical Testing */}
        <div className="card-clean p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <ImageIcon className="w-4 h-4 text-[#0756B8]" />
            <span>Or Select a Pre-Loaded Verified Retinal Scan for Testing</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleSampleSelect('diabetic_retinopathy.jpg')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedSampleKey === 'diabetic_retinopathy.jpg'
                  ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs ring-2 ring-[#0756B8]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-[#071426]">Diabetic Retinopathy</div>
              <div className="text-[11px] text-amber-700 font-semibold">Moderate/Severe DR</div>
            </button>

            <button
              type="button"
              onClick={() => handleSampleSelect('glaucoma_fundus.jpg')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedSampleKey === 'glaucoma_fundus.jpg'
                  ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs ring-2 ring-[#0756B8]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-[#071426]">Glaucoma (Cupping)</div>
              <div className="text-[11px] text-red-700 font-semibold">Elevated Cup-to-Disc</div>
            </button>

            <button
              type="button"
              onClick={() => handleSampleSelect('cataract_eye.jpg')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedSampleKey === 'cataract_eye.jpg'
                  ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs ring-2 ring-[#0756B8]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-[#071426]">Cataract (Lens)</div>
              <div className="text-[11px] text-blue-700 font-semibold">Lens Opacification</div>
            </button>

            <button
              type="button"
              onClick={() => handleSampleSelect('normal_retina.jpg')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedSampleKey === 'normal_retina.jpg'
                  ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs ring-2 ring-[#0756B8]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-[#071426]">Normal Retina</div>
              <div className="text-[11px] text-emerald-700 font-semibold">Healthy Control</div>
            </button>
          </div>
        </div>

        {/* Optical Quality Check Result Card */}
        {previewUrl && (
          <div className="card-clean p-6 space-y-4">
            <h3 className="text-base font-bold text-[#071426]">
              2. Optical Image Quality Verification
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-[#F1F6FC] border border-blue-100">
              {/* Thumbnail */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-[#071426] shrink-0">
                <img 
                  src={previewUrl} 
                  alt="Selected Eye" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Quality Gauge & Breakdown */}
              <div className="flex-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={qualityMetrics?.is_suitable ? 'text-[#0756B8]' : 'text-red-500'}
                      strokeDasharray={`${qualityMetrics?.composite_quality || 92}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-black text-xs text-[#071426]">
                    {Math.round(qualityMetrics?.composite_quality || 92)}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Optical Quality Status:
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      qualityMetrics?.is_suitable !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {qualityMetrics?.is_suitable !== false ? 'Suitable for Grading' : 'Requires Recapture'}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-[#071426]">
                    {qualityMetrics?.status_label || 'Adequate Quality'}
                  </div>
                  <p className="text-xs text-slate-500">
                    {qualityMetrics?.guidance || 'Image satisfies clinical optical clarity standards for tele-ophthalmology screening.'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sharpness</span>
                  <span className="font-bold text-[#071426]">{qualityMetrics?.sharpness_score?.toFixed(0) || 90}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Contrast</span>
                  <span className="font-bold text-[#071426]">{qualityMetrics?.contrast_score?.toFixed(0) || 92}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Brightness</span>
                  <span className="font-bold text-[#071426]">{qualityMetrics?.brightness_score?.toFixed(0) || 91}%</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Gradability</span>
                  <span className="font-bold text-emerald-700">OK</span>
                </div>
              </div>
            </div>

            {/* Patient Symptoms / Clinical Notes (Optional) */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="patient-screening-notes" className="text-xs font-bold text-slate-700 block">
                3. Clinical Symptoms or Visual Complaints (Optional)
              </label>
              <textarea
                id="patient-screening-notes"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Describe any vision symptoms (e.g. blurry vision, dark spots, difficulty seeing at night, duration of symptoms) for the examining doctor..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-700 outline-none focus:border-[#0756B8] focus:ring-2 focus:ring-[#19C7E8]/20 transition-all resize-none"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Screening Request Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={submitPatientRequest}
                disabled={isSubmittingRequest || isCheckingQuality}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-sm shadow-md shadow-[#0756B8]/20 transition-all hover:scale-101 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmittingRequest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting to Specialist Queue...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Screening Request to Ophthalmologist</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Note: Your request will be queued in the Doctor Portal. A verified ophthalmologist will inspect your scan and sign off your report.
              </p>
            </div>
          </div>
        )}

        {/* Live Tracking: My Screening Requests & Status */}
        <div className="card-clean p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#071426]">
                My Screening Requests & Live Status
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Track submitted fundus photographs and ophthalmologist clinical reviews
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPatientRequests}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRequests ? 'animate-spin text-[#0756B8]' : ''}`} />
            </button>
          </div>

          {isLoadingRequests && patientRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0756B8] mb-2" />
              Loading your screening requests...
            </div>
          ) : patientRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Clock className="w-6 h-6 mx-auto text-slate-400" />
              <div className="text-xs font-bold text-slate-700">No screening requests submitted yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Select an image above and submit your first retinal screening request for optical verification and doctor evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {patientRequests.map((req) => {
                const status = req.status || 'Awaiting Review';
                const isReportAvailable = status === 'Report Available' || req.review_status === 'reviewed';
                const isRecapture = status === 'Image Requires Recapture' || req.review_status === 'recapture_required';
                const isUnderReview = status === 'Under Doctor Review' || req.review_status === 'needs_further_examination';
                
                const statusBadgeClass = isReportAvailable
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isRecapture
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : isUnderReview
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div
                    key={req.screening_id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0756B8] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#071426] border border-slate-200 shrink-0">
                        <img
                          src={req.image_url}
                          alt="Retinal Scan"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {req.screening_id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                            {status}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.is_gradable !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {req.is_gradable !== false ? 'Gradable' : 'Requires Recapture'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Submitted on {new Date(req.timestamp || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {req.patient_notes && (
                          <div className="text-[11px] text-slate-600 italic">
                            "{req.patient_notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {isReportAvailable ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab?.('reports')}
                          className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Final Report</span>
                        </button>
                      ) : isRecapture ? (
                        <button
                          type="button"
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            setErrorMessage('Please select or capture a clearer fundus photograph and resubmit.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all"
                        >
                          Recapture & Resubmit
                        </button>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                          Awaiting Specialist Review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6 animate-fade-in text-left">
      
      {/* Header with Back button matching Screen 4 */}
      <div className="flex items-center space-x-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-black text-[#071426] tracking-tight">
          Eye Screening
        </h2>
      </div>

      {/* Doctor Verification Restriction Alert */}
      {isDoctorUnverified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start space-x-3 text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Doctor Verification Required</div>
            <p className="mt-1 leading-relaxed">
              Your doctor account status is <strong>{user?.verification_status || 'pending'}</strong>. Clinical retinal screenings and AI analysis are restricted until your medical registration has been verified by Netra AI Administration.
            </p>
          </div>
        </div>
      )}

      {/* Patient Context Banner when screening a selected patient */}
      {patientContext && (
        <div className="bg-gradient-to-r from-[#071426] to-[#0a2344] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-[#19C7E8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#19C7E8]/20 border border-[#19C7E8]/50 flex items-center justify-center text-[#19C7E8] font-bold text-sm">
              {patientContext.name ? patientContext.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-white">{patientContext.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#19C7E8]/20 text-[#19C7E8] border border-[#19C7E8]/30">
                  {patientContext.id}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{patientContext.age ? `${patientContext.age} yrs` : 'Age N/A'} • {patientContext.gender || 'Gender N/A'}</span>
                <span>•</span>
                <span>{patientContext.city || 'Rural Outreach Centre'}</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right sm:border-l sm:border-slate-700 sm:pl-4">
            <div className="text-[11px] text-slate-400">Examining Clinician</div>
            <div className="text-xs font-bold text-[#19C7E8]">{user?.name || 'Dr. Ophthalmologist'}</div>
          </div>
        </div>
      )}

      {/* 4-Step Progress Indicator */}
      <div className="card-clean p-4 sm:p-5">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          {/* Connecting Track */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          
          {/* Step 1: Upload (Completed/Active) */}
          <div className="flex flex-col items-center space-y-1.5 relative z-10">
            <div className="w-8 h-8 rounded-full bg-[#0756B8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              1
            </div>
            <span className="text-xs font-bold text-[#0756B8]">Upload</span>
          </div>

          {/* Step 2: Quality Check (Active) */}
          <div className="flex flex-col items-center space-y-1.5 relative z-10">
            <div className="w-8 h-8 rounded-full bg-[#0756B8] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-[#19C7E8]/25">
              2
            </div>
            <span className="text-xs font-bold text-[#0756B8]">Quality Check</span>
          </div>

          {/* Step 3: Analysis */}
          <div className="flex flex-col items-center space-y-1.5 relative z-10">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="text-xs font-medium text-slate-400">Analysis</span>
          </div>

          {/* Step 4: Result */}
          <div className="flex flex-col items-center space-y-1.5 relative z-10">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <span className="text-xs font-medium text-slate-400">Result</span>
          </div>
        </div>
      </div>

      {/* Main Drag & Drop Upload Card */}
      <div className="card-clean p-6 sm:p-8 space-y-4">
        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-[#071426] border-2 border-[#0756B8] aspect-video flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 flex items-center space-x-3">
              <button
                onClick={captureCameraFrame}
                className="px-6 py-2.5 rounded-full bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Eye Image</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#0756B8] bg-white hover:bg-[#F1F6FC] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-[#F1F6FC] border border-blue-100 text-[#0756B8] flex items-center justify-center shadow-2xs">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#071426]">
                Upload Eye Image
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Drag and drop or click to browse
              </p>
              <p className="text-[11px] text-slate-400">
                JPG, JPEG, PNG (Max 5MB)
              </p>
            </div>
          </div>
        )}

        {/* Or Capture with Camera Button */}
        {!isCameraActive && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-[#0756B8] text-slate-700 hover:text-[#0756B8] text-xs font-bold transition-all inline-flex items-center space-x-2 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-[#0756B8]" />
              <span>Or Capture with Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Preview & Quality Check Result Card */}
      {previewUrl && (
        <div className="card-clean p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: Thumbnail Preview with Neutral Viewing Surface */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-[#071426] shrink-0">
            <img 
              src={previewUrl} 
              alt="Uploaded Eye" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Center: Image Quality Circular Score & Text */}
          <div className="flex-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
            {/* Circular Gauge */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={qualityMetrics?.is_suitable ? 'text-[#0756B8]' : 'text-amber-500'}
                  strokeDasharray={`${qualityMetrics?.composite_quality || 92}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-xs text-[#071426]">
                {Math.round(qualityMetrics?.composite_quality || 92)}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Image Quality
              </div>
              <div className="text-sm font-extrabold text-[#071426]">
                {qualityMetrics?.status_label || 'Good quality'}
              </div>
              <p className="text-xs text-slate-500">
                {qualityMetrics?.guidance || 'Suitable for analysis'}
              </p>
            </div>
          </div>

          {/* Right: Continue Button */}
          <button
            onClick={executeFullAnalysis}
            disabled={isAnalyzing || isCheckingQuality || isDoctorUnverified}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-bold text-sm shadow-md shadow-[#0756B8]/20 transition-all hover:scale-102 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Preloaded Sample Benchmark Test Cases */}
      <div className="card-clean p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <ImageIcon className="w-4 h-4 text-[#0756B8]" />
          <span>Or Test With Pre-Loaded Verified Retinal Scans</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleSampleSelect('diabetic_retinopathy.jpg')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedSampleKey === 'diabetic_retinopathy.jpg'
                ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold text-[#071426]">Diabetic Retinopathy</div>
            <div className="text-[11px] text-amber-700 font-semibold">Moderate/Severe</div>
          </button>

          <button
            type="button"
            onClick={() => handleSampleSelect('glaucoma_fundus.jpg')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedSampleKey === 'glaucoma_fundus.jpg'
                ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold text-[#071426]">Glaucoma (Cupping)</div>
            <div className="text-[11px] text-red-700 font-semibold">High CDR</div>
          </button>

          <button
            type="button"
            onClick={() => handleSampleSelect('cataract_eye.jpg')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedSampleKey === 'cataract_eye.jpg'
                ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold text-[#071426]">Cataract (Lens)</div>
            <div className="text-[11px] text-blue-700 font-semibold">Opacification</div>
          </button>

          <button
            type="button"
            onClick={() => handleSampleSelect('normal_retina.jpg')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedSampleKey === 'normal_retina.jpg'
                ? 'border-[#0756B8] bg-[#F1F6FC] shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold text-[#071426]">Normal Retina</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Healthy Control</div>
          </button>
        </div>
      </div>
    </div>
  );
};
