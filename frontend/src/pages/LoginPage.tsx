import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+49', label: 'Germany (+49)' },
];

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        next[idx - 1] = '';
        onChange(next.join(''));
        inputs.current[idx - 1]?.focus();
      }
    }
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = ch;
    onChange(next.join(''));
    if (ch && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    if (pasted.length >= 6) inputs.current[5]?.focus();
    else inputs.current[pasted.length]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center my-4">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#0756B8] focus:ring-2 focus:ring-[#19C7E8] bg-white transition-colors text-[#071426]"
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);

  const start = (s?: number) => {
    if (s !== undefined) setSeconds(s);
    setRunning(true);
  };
  const reset = () => { setSeconds(initial); setRunning(false); };

  useEffect(() => {
    if (!running || seconds <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  return { seconds, running, start, reset, canResend: !running || seconds <= 0 };
}

// ─── Alert Component ──────────────────────────────────────────────────────────
function Alert({ 
  type, 
  msg, 
  action 
}: { 
  type: 'error' | 'success'; 
  msg: string; 
  action?: { label: string; onClick: () => void };
}) {
  const styles = type === 'error'
    ? 'bg-red-50 border border-red-200 text-red-700'
    : 'bg-emerald-50 border border-emerald-200 text-emerald-700';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ${styles}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <span>{msg}</span>
        {action && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={action.onClick}
              className="text-xs font-bold underline hover:opacity-80 transition-opacity"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { setUser } = useAuth();

  // ── Login ────────────────────────────────────────────────────────────────
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const id = loginId.trim();
    if (!id) { setLoginError('Please enter your email address or phone number.'); return; }
    if (!loginPw) { setLoginError('Please enter your password.'); return; }
    setLoginLoading(true);
    try {
      const res = await api.login(id, loginPw);
      setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register Modal ────────────────────────────────────────────────────────
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regRole, setRegRole] = useState<'patient' | 'doctor'>('patient');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const openReg = () => {
    setIsRegOpen(true);
    setRegError(null);
    setRegSuccess(null);
    setRegName('');
    setRegIdentifier('');
    setRegPw('');
    setRegConfirmPw('');
    setRegRole('patient');
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const name = regName.trim();
    if (!name || name.length < 2) {
      setRegError('Please enter your full name (at least 2 characters).');
      return;
    }

    const identifier = regIdentifier.trim();
    if (!identifier) {
      setRegError('Please enter your email address or phone number.');
      return;
    }

    // Validate email or phone number format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(identifier);
    const digitsOnly = identifier.replace(/\D/g, '');
    const isPhone = !identifier.includes('@') && digitsOnly.length >= 7 && digitsOnly.length <= 15;

    if (!isEmail && !isPhone) {
      setRegError('Please enter a valid email address (e.g. user@example.com) or phone number (at least 7 digits).');
      return;
    }

    if (regPw.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regConfirmPw !== regPw) {
      setRegError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.register({
        name,
        identifier,
        password: regPw,
        confirm_password: regConfirmPw,
        role: regRole,
      });

      setUser(res.user);
      setRegSuccess(`Account created successfully! Redirecting you to the ${res.user.role === 'doctor' ? 'Doctor Portal' : 'Patient Home'}...`);

      // Seamless role-based navigation after showing success message
      setTimeout(() => {
        setIsRegOpen(false);
        onLoginSuccess(res.user);
      }, 1200);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please check your credentials and try again.');
    } finally {
      setRegLoading(false);
    }
  };


  // ── Forgot Password Modal ─────────────────────────────────────────────────
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [forgotStep, setForgotStep] = useState<'request' | 'otp' | 'done'>('request');
  const [forgotDest, setForgotDest] = useState('');
  const [forgotCountry, setForgotCountry] = useState('+91');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotDestSent, setForgotDestSent] = useState('');
  const forgotCountdown = useCountdown(60);

  const openForgot = () => {
    setIsForgotOpen(true);
    setForgotStep('request');
    setForgotError(null);
    setForgotSuccess(null);
    setForgotDest('');
    setForgotPhone('');
    setForgotOtp('');
    setNewPw('');
    setConfirmNewPw('');
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    let dest = '';
    if (forgotMethod === 'email') {
      dest = forgotDest.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dest)) { setForgotError('Please enter a valid email address.'); return; }
    } else {
      dest = forgotCountry + forgotPhone.trim().replace(/\D/g, '');
      if (forgotPhone.replace(/\D/g, '').length < 7) { setForgotError('Please enter a valid phone number.'); return; }
    }
    setForgotLoading(true);
    try {
      const res = await api.forgotPasswordRequestOtp({ destination: dest, destination_type: forgotMethod });
      setForgotDestSent(dest);
      setForgotSuccess(res.message);
      setForgotStep('otp');
      forgotCountdown.start(60);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (forgotOtp.replace(/\D/g, '').length < 6) { setForgotError('Please enter the 6-digit code.'); return; }
    if (newPw.length < 6) { setForgotError('New password must be at least 6 characters.'); return; }
    if (confirmNewPw && confirmNewPw !== newPw) { setForgotError('Passwords do not match.'); return; }
    setForgotLoading(true);
    try {
      const res = await api.forgotPasswordReset({
        destination: forgotDestSent,
        destination_type: forgotMethod,
        otp: forgotOtp.replace(/\D/g, ''),
        new_password: newPw,
        confirm_password: confirmNewPw || newPw,
      });
      setForgotSuccess(res.message);
      setForgotStep('done');
    } catch (err: any) {
      setForgotError(err.message || 'Reset failed. Please check the code and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResend = async () => {
    setForgotError(null);
    try {
      const res = await api.forgotPasswordResendOtp({ destination: forgotDestSent, destination_type: forgotMethod });
      setForgotSuccess(res.message);
      forgotCountdown.start(60);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to resend.');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F1F6FC] flex items-center justify-center p-4 selection:bg-[#0756B8] selection:text-white">
      {/* ── Login Card ── */}
      <div className="w-full max-w-md">
        {/* Authentic Netra AI Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 mb-2">
            <img 
              src="/netra-ai-logo-transparent.png" 
              alt="Netra AI Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-[#071426] tracking-tight">
            NETRA <span className="text-[#19C7E8]">AI</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 tracking-wide uppercase font-semibold">
            AI FOR A CLEARER TOMORROW
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(7,20,38,0.06)] border border-slate-200/90 p-8">
          <h2 className="text-2xl font-bold text-[#071426] mb-1.5">Log in to your account</h2>
          <p className="text-slate-500 text-sm mb-6">Welcome back! Please enter your credentials.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <Alert type="error" msg={loginError} />}

            <div>
              <label className="block text-sm font-semibold text-[#071426] mb-1">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  placeholder="Enter your email address or phone number"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#071426] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white"
                />
                <button type="button" onClick={() => setShowLoginPw(!showLoginPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showLoginPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={openForgot}
                className="text-sm text-[#0756B8] hover:text-[#054494] hover:underline font-semibold">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loginLoading}
              className="w-full py-3.5 bg-[#0756B8] hover:bg-[#054494] text-white font-bold rounded-xl shadow-md shadow-[#0756B8]/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:ring-offset-2 disabled:opacity-60">
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Log In</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm mb-3">Don't have an account?</p>
            <button onClick={openReg}
              className="w-full py-3 border-2 border-[#0756B8] text-[#0756B8] font-bold rounded-xl hover:bg-[#F1F6FC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19C7E8]">
              Create New Account
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Netra AI · Clinical AI Diagnostic Platform
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Register Modal                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isRegOpen && (
        <div className="fixed inset-0 bg-[#071426]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0756B8]" />
                <h3 className="text-lg font-bold text-[#071426]">
                  Create New Account
                </h3>
              </div>
              <button onClick={() => setIsRegOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleRegSubmit} className="space-y-4">
                {regError && (
                  <Alert 
                    type="error" 
                    msg={regError} 
                    action={
                      regError.toLowerCase().includes('already exists')
                        ? {
                            label: "👉 Account exists: Click here to Log In",
                            onClick: () => {
                              setIsRegOpen(false);
                              setLoginId(regIdentifier.trim());
                              setLoginError(null);
                            }
                          }
                        : undefined
                    }
                  />
                )}
                {regSuccess && <Alert type="success" msg={regSuccess} />}

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-[#071426] mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={regName} 
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Your full name" 
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" 
                    />
                  </div>
                </div>

                {/* Email or Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-[#071426] mb-1">Email or Phone Number</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={regIdentifier} 
                      onChange={e => setRegIdentifier(e.target.value)}
                      placeholder="Enter your email address or phone number" 
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" 
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Accepts email address (e.g. user@example.com) or mobile phone number.</p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-[#071426] mb-2">I am a</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#F1F6FC] p-1 rounded-xl border border-slate-200">
                    {(['patient', 'doctor'] as const).map(r => (
                      <button 
                        key={r} 
                        type="button" 
                        onClick={() => setRegRole(r)}
                        className={`py-2 rounded-lg text-sm transition-all ${regRole === r
                          ? 'bg-white text-[#0756B8] shadow-sm font-bold border border-[#bcdbff]'
                          : 'text-slate-600 hover:text-slate-800'}`}
                      >
                        {r === 'patient' ? '🏥 Patient' : '👨‍⚕️ Doctor'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#071426] mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showRegPw ? 'text' : 'password'} 
                      value={regPw} 
                      onChange={e => setRegPw(e.target.value)}
                      placeholder="Min. 6 characters" 
                      required
                      className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowRegPw(!showRegPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-[#071426] mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={regConfirmPw} 
                      onChange={e => setRegConfirmPw(e.target.value)}
                      placeholder="Re-enter password" 
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" 
                    />
                  </div>
                </div>

                {/* Create Account Action Button */}
                <button 
                  type="submit" 
                  disabled={regLoading}
                  className="w-full py-3.5 bg-[#0756B8] hover:bg-[#054494] text-white font-bold rounded-xl shadow-md shadow-[#0756B8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => setIsRegOpen(false)}
                      className="text-[#0756B8] font-bold hover:underline"
                    >
                      Log In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* Forgot Password Modal                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-[#071426]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {forgotStep === 'otp' && (
                  <button onClick={() => { setForgotStep('request'); setForgotError(null); setForgotOtp(''); }}
                    className="mr-1 text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <KeyRound className="w-5 h-5 text-[#0756B8]" />
                <h3 className="text-lg font-bold text-[#071426]">Reset Password</h3>
              </div>
              <button onClick={() => setIsForgotOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {forgotError && <Alert type="error" msg={forgotError} />}

              {/* STEP 1 — Request OTP */}
              {forgotStep === 'request' && (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <p className="text-slate-500 text-sm">Choose how you'd like to recover your account.</p>

                  {/* Method toggle */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F1F6FC] p-1 rounded-xl border border-slate-200">
                    {(['email', 'phone'] as const).map(m => (
                      <button key={m} type="button"
                        onClick={() => { setForgotMethod(m); setForgotError(null); }}
                        className={`py-2 rounded-lg text-sm transition-all ${forgotMethod === m
                          ? 'bg-white text-[#0756B8] shadow-sm font-bold border border-[#bcdbff]'
                          : 'text-slate-600 hover:text-slate-800'}`}>
                        {m === 'email' ? '📧 Email' : '📱 Phone'}
                      </button>
                    ))}
                  </div>

                  {forgotMethod === 'email' ? (
                    <div>
                      <label className="block text-sm font-semibold text-[#071426] mb-1">Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" value={forgotDest} onChange={e => setForgotDest(e.target.value)}
                          placeholder="your@email.com" required
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-[#071426] mb-1">Registered Phone</label>
                      <div className="flex gap-2">
                        <select value={forgotCountry} onChange={e => setForgotCountry(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] bg-white text-[#071426]">
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="tel" value={forgotPhone} onChange={e => setForgotPhone(e.target.value)}
                            placeholder="9876543210" required
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-3.5 bg-[#0756B8] hover:bg-[#054494] text-white font-bold rounded-xl shadow-md shadow-[#0756B8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]">
                    {forgotLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><ArrowRight className="w-4 h-4" /> Send Reset Code</>}
                  </button>
                </form>
              )}

              {/* STEP 2 — OTP + New Password */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  {forgotSuccess && !forgotError && <Alert type="success" msg={forgotSuccess} />}

                  <div className="text-center">
                    <p className="text-slate-600 text-sm">
                      Enter the code sent to <span className="font-semibold text-[#071426]">{forgotDestSent}</span>
                    </p>
                  </div>

                  <OtpInput value={forgotOtp} onChange={setForgotOtp} />

                  <div>
                    <label className="block text-sm font-semibold text-[#071426] mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                        placeholder="Min. 6 characters" required
                        className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#071426] mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#19C7E8] focus:border-[#0756B8] text-sm text-[#071426] transition-all bg-white" />
                    </div>
                  </div>

                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-3.5 bg-[#0756B8] hover:bg-[#054494] text-white font-bold rounded-xl shadow-md shadow-[#0756B8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#19C7E8]">
                    {forgotLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                      : <><CheckCircle2 className="w-4 h-4" /> Reset Password</>}
                  </button>

                  <div className="text-center">
                    {forgotCountdown.canResend ? (
                      <button type="button" onClick={handleForgotResend}
                        className="text-sm text-[#0756B8] hover:text-[#054494] hover:underline font-semibold flex items-center gap-1 mx-auto">
                        <RefreshCw className="w-4 h-4" /> Resend Code
                      </button>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Resend in <span className="font-semibold text-slate-600">{forgotCountdown.seconds}s</span>
                      </p>
                    )}
                  </div>
                </form>
              )}

              {/* STEP 3 — Done */}
              {forgotStep === 'done' && (
                <div className="text-center py-4 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#edf5ff] rounded-full mb-2">
                    <CheckCircle2 className="w-8 h-8 text-[#0756B8]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071426]">Password Reset!</h4>
                  <p className="text-slate-500 text-sm">{forgotSuccess}</p>
                  <button onClick={() => setIsForgotOpen(false)}
                    className="w-full py-3.5 bg-[#0756B8] hover:bg-[#054494] text-white font-bold rounded-xl shadow-md shadow-[#0756B8]/20 transition-all">
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
