import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Save, 
  LogOut, 
  Eye, 
  AlertCircle,
  Lock,
  Camera,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { AyushmanCardSection } from '../components/AyushmanCardSection';

interface ProfilePageProps {
  setActiveTab: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ setActiveTab }) => {
  const { user, setUser, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emptyFormData = {
    full_name: '',
    profile_picture: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pin_code: '',
    bio: '',
    emergency_contact: '',
    abha_id: ''
  };

  const [formData, setFormData] = useState(emptyFormData);
  const [initialSnapshot, setInitialSnapshot] = useState(emptyFormData);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getProfile();
      setProfile(data);
      const loaded = {
        full_name: data.full_name || user?.name || '',
        profile_picture: data.profile_picture || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pin_code: data.pin_code || '',
        bio: data.bio || '',
        emergency_contact: '',
        abha_id: ''
      };
      setFormData(loaded);
      setInitialSnapshot(loaded);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setErrorMessage('Could not load profile. Using offline cached data.');
      if (user) {
        const fallbackData = {
          ...emptyFormData,
          full_name: user.name || '',
          gender: user.gender || '',
          city: user.city || ''
        };
        setFormData(fallbackData);
        setInitialSnapshot(fallbackData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialSnapshot);
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const name = formData.full_name.trim();
    if (!name || name.length < 2) {
      setErrorMessage('Please enter your full legal name (at least 2 characters).');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        full_name: name,
        profile_picture: formData.profile_picture,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
        city: formData.city.trim(),
        state: formData.state,
        pin_code: formData.pin_code,
        bio: formData.bio
      });

      setProfile(updated);
      const synced = {
        ...formData,
        full_name: updated.full_name,
        gender: updated.gender || '',
        city: updated.city || '',
        date_of_birth: updated.date_of_birth || '',
        address: updated.address || '',
        state: updated.state || '',
        pin_code: updated.pin_code || '',
        bio: updated.bio || ''
      };
      setFormData(synced);
      setInitialSnapshot(synced);

      if (user) {
        setUser({
          ...user,
          name: updated.full_name,
          gender: updated.gender || undefined,
          city: updated.city || undefined
        });
      }

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('login');
  };

  const avatarInitial = (formData.full_name || user?.name || 'U').trim().charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#0756B8] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading your profile data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in text-left font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F6FC] border-2 border-[#0756B8] flex items-center justify-center text-[#0756B8] text-2xl font-black shadow-xs">
              {avatarInitial}
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#0756B8] text-white rounded-lg shadow-sm">
                <Camera className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#071426]">
                {formData.full_name || 'Complete Your Profile'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0756B8] border border-blue-200 capitalize">
                {profile?.role || user?.role || 'Patient'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Netra AI Health Record • User ID: <span className="font-mono font-semibold text-slate-700">{profile?.user_id || user?.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setErrorMessage('');
              }}
              className="px-4 py-2 rounded-xl border border-blue-200 bg-[#F1F6FC] hover:bg-blue-100/60 text-[#0756B8] font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#0756B8] text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#0756B8] shrink-0" />
          <span>Profile details saved successfully! Your profile completion status has been updated.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Demographics & Address (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#071426] flex items-center space-x-2">
                <User className="w-4 h-4 text-[#0756B8]" />
                <span>Personal & Demographic Information</span>
              </h3>
              {isEditing ? (
                <span className="text-[11px] font-semibold text-[#0756B8] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  Editing Mode
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Read-Only</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Full Legal Name *</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Alice Wonderland"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                    required
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    <span className="text-[#071426] font-semibold">{formData.full_name || 'Complete Your Profile'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.date_of_birth ? (
                      <span className="text-slate-800">{formData.date_of_birth}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Gender</label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.gender ? (
                      <span className="text-slate-800">{formData.gender}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 42 Park Street, Apartment 3B"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.address ? (
                      <span className="text-slate-800">{formData.address}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">City / District</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter your city"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.city ? (
                      <span className="text-slate-800">{formData.city}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">State / Province</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. West Bengal"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.state ? (
                      <span className="text-slate-800">{formData.state}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">PIN / Postal Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                    placeholder="e.g. 700016"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.pin_code ? (
                      <span className="text-slate-800">{formData.pin_code}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Emergency Contact</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="e.g. +91 98300 XXXXX (Relation)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8]"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium min-h-[36px] flex items-center">
                    {formData.emergency_contact ? (
                      <span className="text-slate-800">{formData.emergency_contact}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Bio / Personal Medical Notes</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share any pertinent ocular history, glasses prescription, or lifestyle details..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium outline-none focus:ring-1 focus:ring-[#0756B8] resize-none"
                  />
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium min-h-[50px] flex items-start">
                    {formData.bio ? (
                      <span className="text-slate-800 whitespace-pre-wrap">{formData.bio}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Linked Account Credentials Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-[#071426] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Linked Account Credentials (Secure)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email Address</div>
                      <div className="text-slate-800 font-semibold truncate">{profile?.email || user?.email || 'Not linked'}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0756B8] border border-blue-200">
                    Verified
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Phone Number</div>
                      <div className="text-slate-800 font-semibold truncate">{profile?.phone || user?.phone || 'Not linked'}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0756B8] border border-blue-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#0756B8] hover:bg-[#064696] disabled:opacity-50 text-white font-semibold text-xs shadow-md flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* ABDM & National Health ID Card (Patient & Admin only) */}
          {user?.role !== 'doctor' && (
            <AyushmanCardSection userFullName={formData.full_name || profile?.full_name || user?.name} />
          )}
        </div>


        {/* Right Column: Health Summary & Quick Navigation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ocular Health Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Eye className="w-4 h-4 text-[#0756B8]" />
              <h3 className="text-sm font-bold text-[#071426]">Ocular Health Profile</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="text-[11px] font-semibold text-blue-900">Monitored Condition</div>
                <div className="text-sm font-bold text-[#071426] mt-0.5">Diabetic Retinopathy Screening</div>
                <div className="text-[10px] text-slate-500 mt-1">Recommended annual fundus checkup frequency</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-700">Primary Ophthalmologist</div>
                <div className="text-xs font-bold text-[#071426] mt-0.5">Dr. Ananya Sengupta</div>
                <div className="text-[10px] text-slate-500">Vitreo-Retinal Surgeon • Sankara Nethralaya</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-700">Systemic Health Factors</div>
                <div className="text-xs text-slate-600 mt-0.5 font-medium">
                  {formData.bio || 'None recorded. Add medical notes in your profile.'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="bg-[#071426] text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#19C7E8]" />
              <span>Direct Care Access</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {user?.role === 'patient' 
                ? 'Quickly jump to your patient dashboard, clinical reports, or consult verified eye doctors.' 
                : 'Quickly jump to your main dashboard, clinical screening tools, or manage patient consultations.'}
            </p>

            <div className="space-y-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0756B8] hover:bg-[#064696] text-white transition-colors text-center font-bold shadow-xs cursor-pointer"
              >
                Go to Home Section
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(user?.role === 'doctor' ? 'doctor-portal' : 'dashboard')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors text-center cursor-pointer"
              >
                {user?.role === 'doctor' ? 'Doctor Portal' : 'Patient Dashboard'}
              </button>
              {user?.role === 'patient' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors text-center cursor-pointer"
                >
                  My Clinical Reports
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('screening')}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors text-center cursor-pointer"
                >
                  Start New Screening
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
