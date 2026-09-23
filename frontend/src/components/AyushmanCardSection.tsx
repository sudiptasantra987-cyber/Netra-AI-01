import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  CreditCard, 
  X, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  HelpCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AbdmCard } from '../types';

interface AyushmanCardSectionProps {
  userFullName?: string;
}

export const AyushmanCardSection: React.FC<AyushmanCardSectionProps> = ({ userFullName }) => {
  const { user } = useAuth();
  if (user?.role === 'doctor') {
    return null;
  }

  const [card, setCard] = useState<AbdmCard | null>(null);
  const [officialGatewayAvailable, setOfficialGatewayAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Form State
  const [abhaInput, setAbhaInput] = useState('');
  const [pmjayInput, setPmjayInput] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  // Validation & Feedback State
  const [validationErrors, setValidationErrors] = useState<{ abha?: string; pmjay?: string; consent?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing card on mount
  useEffect(() => {
    fetchCardStatus();
  }, []);

  const fetchCardStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getAbdmCard();
      setCard(res.card || null);
      setOfficialGatewayAvailable(res.official_gateway_available);
      setDemoMode(!res.official_gateway_available);
    } catch (err: any) {
      console.error('Error fetching ABDM card status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Frontend Validation Rules
  // ABHA ID: 14 digits (e.g. 91-8273-1928-3482 or 91827319283482) or PHR address (e.g. user@abdm)
  const validateAbha = (value: string): string | null => {
    const clean = value.trim();
    if (!clean) return 'ABHA ID is required.';
    const is14Digit = /^(?:\d{2}-\d{4}-\d{4}-\d{4}|\d{14})$/.test(clean);
    const isAddress = /^[a-zA-Z0-9._]{3,32}@[a-zA-Z0-9]{2,10}$/.test(clean);
    if (!is14Digit && !isAddress) {
      return 'Format invalid. Use 14 digits (e.g. 91-8273-1928-3482) or an ABHA address (e.g. name@abdm).';
    }
    return null;
  };

  // PM-JAY ID: 8 to 18 alphanumeric characters
  const validatePmjay = (value: string): string | null => {
    const clean = value.trim().replace(/[-\s]/g, '');
    if (!clean) return null; // Optional if only ABHA is being linked
    if (!/^[a-zA-Z0-9]{8,18}$/.test(clean)) {
      return 'Format invalid. Must be 8-18 alphanumeric characters (e.g. P12345678 or PMJAY98765432).';
    }
    return null;
  };

  const handleOpenModal = () => {
    setAbhaInput(card?.abha_id_masked ? '' : '');
    setPmjayInput('');
    setConsentGiven(false);
    setValidationErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setValidationErrors({});
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate inputs
    const abhaErr = validateAbha(abhaInput);
    const pmjayErr = validatePmjay(pmjayInput);
    const consentErr = !consentGiven ? 'You must provide consent to link your health identifiers.' : undefined;

    if (abhaErr || pmjayErr || consentErr) {
      setValidationErrors({
        abha: abhaErr || undefined,
        pmjay: pmjayErr || undefined,
        consent: consentErr
      });
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      const newCard = await api.linkAbdmCard({
        abha_id: abhaInput.trim(),
        pmjay_id: pmjayInput.trim() ? pmjayInput.trim().replace(/[-\s]/g, '') : undefined,
        consent_given: true,
        demo_mode: demoMode
      });

      setCard(newCard);
      setSuccessMessage(
        demoMode
          ? 'Ayushman details successfully linked in Demo Mode! (Masked for privacy).'
          : 'Ayushman details verified and linked successfully!'
      );
      setIsModalOpen(false);
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to link card. Please verify format and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setErrorMessage(null);
    try {
      await api.removeAbdmCard();
      setCard(null);
      setShowRemoveConfirm(false);
      setSuccessMessage('Ayushman Card details have been removed and unlinked.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove Ayushman Card.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-center space-x-2 py-8">
        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Checking ABDM record status...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Ayushman Bharat Digital Mission (ABDM)
            </h3>
            <p className="text-[11px] text-slate-500">National Health Authority Interoperable Gateway</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {card ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              card.demo_mode 
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {card.demo_mode ? 'Linked (Demo Mode)' : 'Verified ABDM Card'}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Not Linked
            </span>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {card ? (
        /* CARD SUMMARY VIEW */
        <div className="space-y-4">
          {/* Card Design Component */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-5 text-white shadow-md border border-emerald-800/40">
            {/* Background Decorative Rings */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-emerald-500/10 pointer-events-none blur-xl" />
            <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-teal-500/10 pointer-events-none blur-lg" />

            {/* Card Top Row */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-emerald-400 font-black text-xs">
                  आ
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-emerald-400">
                    National Health Authority • Govt. of India
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Ayushman Bharat - ABDM
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-white/10 text-emerald-300 border border-white/10">
                  {card.demo_mode ? 'DEMO PREVIEW' : 'OFFICIAL LINK'}
                </span>
              </div>
            </div>

            {/* Beneficiary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              {/* ABHA ID Block */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-emerald-300/80 font-medium">ABHA ID (Health Identifier)</div>
                <div className="font-mono text-base font-bold tracking-wider text-white mt-0.5">
                  {card.abha_id_masked}
                </div>
                <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" /> Masked for privacy (SHA-256)
                </div>
              </div>

              {/* PM-JAY Beneficiary ID Block */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-teal-300/80 font-medium">PM-JAY ID (Ayushman Coverage)</div>
                <div className="font-mono text-base font-bold tracking-wider text-white mt-0.5">
                  {card.pmjay_id_masked || 'Not Specified'}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  {card.pmjay_id_masked ? 'Beneficiary coverage active' : 'ABHA health records only'}
                </div>
              </div>
            </div>

            {/* Beneficiary Name & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-2 border-t border-white/10 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Beneficiary Name</span>
                <span className="font-semibold text-slate-200">
                  {card.beneficiary_name || userFullName || 'Authorized Citizen'}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] text-slate-400 block">Linked At</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {new Date(card.linked_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your Netra AI clinical reports and diagnostic scans are cryptographically linked to your ABDM account.
            </p>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleOpenModal}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Details</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Card</span>
              </button>
            </div>
          </div>

          {/* Remove Confirmation Dialog */}
          {showRemoveConfirm && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">Confirm Ayushman Card Removal</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Are you sure you want to unlink your ABHA and PM-JAY details? This will disconnect your Netra AI screening records from the ABDM exchange.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={isRemoving}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 flex items-center space-x-1 disabled:opacity-50"
                >
                  {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Yes, Remove Card</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* UNLINKED STATE */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                No Ayushman Card or ABHA ID Linked
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                Link your 14-digit ABHA Number and PM-JAY Beneficiary ID to enable government health record linkage, cashless insurance verification, and hospital referrals.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 transition-all flex items-center space-x-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ayushman Card</span>
            </button>
          </div>

          {/* Educational Callout on ABHA vs PM-JAY */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start space-x-2.5 text-xs text-emerald-950">
            <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <span className="font-bold text-emerald-900 block">ABHA vs PM-JAY Distinction:</span>
              <p className="text-emerald-800/90 leading-relaxed">
                An <strong>ABHA ID</strong> is your digital health account identifier under the Ayushman Bharat Digital Mission (ABDM). A <strong>PM-JAY ID</strong> is your beneficiary identifier for the PM-JAY cashless health insurance scheme. An ABHA ID alone is not proof of PM-JAY eligibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: LINK YOUR AYUSHMAN DETAILS                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-sm font-bold text-slate-900">
                    Link Your Ayushman Details
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ayushman Bharat Digital Mission (ABDM) Integration
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* OFFICIAL GATEWAY NOTICE (IF CONFIGURED) */}
              {officialGatewayAvailable && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-[11px]">Official ABDM Gateway Available</span>
                </div>
              )}

              {/* General Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* FIELD 1: ABHA ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  1. ABHA ID (Ayushman Bharat Health Account) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">91-8273-1928-3482</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">user@abdm</code>
                </p>
                <input
                  type="text"
                  value={abhaInput}
                  onChange={(e) => {
                    setAbhaInput(e.target.value);
                    if (validationErrors.abha) setValidationErrors(prev => ({ ...prev, abha: undefined }));
                  }}
                  placeholder="e.g. 91-8273-1928-3482 or name@abdm"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors ${
                    validationErrors.abha 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  aria-invalid={!!validationErrors.abha}
                  aria-describedby="abha-error"
                />
                {validationErrors.abha && (
                  <p id="abha-error" className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{validationErrors.abha}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  ABHA is a 14-digit digital health ID. It is not an insurance policy or proof of PM-JAY eligibility.
                </p>
              </div>

              {/* FIELD 2: PM-JAY ID / Ayushman Beneficiary ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  2. PM-JAY ID / Ayushman Beneficiary ID
                </label>
                <p className="text-[11px] text-slate-500">
                  Example: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">P12345678</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">PMJAY98765432</code>
                </p>
                <input
                  type="text"
                  value={pmjayInput}
                  onChange={(e) => {
                    setPmjayInput(e.target.value);
                    if (validationErrors.pmjay) setValidationErrors(prev => ({ ...prev, pmjay: undefined }));
                  }}
                  placeholder="e.g. P12345678 or PMJAY98765432 (optional)"
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors ${
                    validationErrors.pmjay 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                  aria-invalid={!!validationErrors.pmjay}
                  aria-describedby="pmjay-error"
                />
                {validationErrors.pmjay && (
                  <p id="pmjay-error" className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{validationErrors.pmjay}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  Beneficiary scheme identifier for PM-JAY empanelled hospital cashless coverage.
                </p>
              </div>

              {/* CONSENT CHECKBOX */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => {
                      setConsentGiven(e.target.checked);
                      if (validationErrors.consent) setValidationErrors(prev => ({ ...prev, consent: undefined }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-[11px] text-slate-700 leading-relaxed select-none">
                    I explicitly consent to link my ABHA and Ayushman details with my Netra AI personal health record. I understand that format checks do not verify actual scheme eligibility.
                  </span>
                </label>
                {validationErrors.consent && (
                  <p className="text-[11px] text-red-600 font-medium pl-6">
                    {validationErrors.consent}
                  </p>
                )}
              </div>

              {/* SECURITY & DATA PROTECTION NOTICE */}
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>Protected by SHA-256 masking. Full identifiers are never logged or stored in plain text.</span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !consentGiven}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Linking...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Link Card</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
