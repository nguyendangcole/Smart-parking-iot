import { supabase } from '../../../shared/supabase';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User,
  Camera,
  Settings as SettingsIcon,
  Moon,
  Volume2,
  RefreshCw,
  Lock,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Headset,
  ChevronRight,
  ExternalLink,
  Mail,
  LogOut,
  Eye,
  EyeOff,
  X,
  Check
} from 'lucide-react';

import { useProfile } from '../../../shared/hooks/useProfile';

export default function Settings() {
  const { profile, logout } = useProfile();
  const navigate = useNavigate();

  // State Management
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notificationSounds: true
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  });

  const [editForm, setEditForm] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: ''
  });

  const [changes, setChanges] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handlers
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setPreferences(prev => ({ ...prev, theme }));
    if (!changes.includes('Theme')) setChanges(prev => [...prev, 'Theme']);
    setSaveSuccess(false);
  };

  const handleNotificationToggle = () => {
    setPreferences(prev => ({ ...prev, notificationSounds: !prev.notificationSounds }));
    if (!changes.includes('Notifications')) setChanges(prev => [...prev, 'Notifications']);
    setSaveSuccess(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword.trim()) {
      alert('Please enter your current password');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // TODO: Replace with actual API call
    alert('✓ Password changed successfully');
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false
    });
  };

  const handleEditProfile = async () => {
    if (!editForm.fullName.trim()) {
      alert('Please enter a full name');
      return;
    }
    
    // TODO: Replace with actual API call
    alert('✓ Profile updated successfully');
    if (!changes.includes('Profile')) setChanges(prev => [...prev, 'Profile']);
    setShowEditModal(false);
  };

  const handleSaveAllChanges = () => {
    if (changes.length === 0) {
      alert('No changes to save');
      return;
    }

    // TODO: Replace with actual API call
    setSaveSuccess(true);
    setChanges([]);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      setPreferences({
        theme: 'light',
        notificationSounds: true
      });
      setEditForm({
        fullName: profile?.full_name || '',
        email: profile?.email || '',
        phone: ''
      });
      setChanges([]);
      alert('✓ Settings reset to defaults');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-primary to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock size={24} />
                <h2 className="text-xl font-bold">Change Password</h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-primary/80 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={passwordData.showCurrent ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {passwordData.showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={passwordData.showNew ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (min 8 chars)"
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData(prev => ({ ...prev, showNew: !prev.showNew }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {passwordData.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={passwordData.showConfirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {passwordData.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-primary to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={24} />
                <h2 className="text-xl font-bold">Edit Profile</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-primary/80 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleEditProfile(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed. Contact admin if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+84 XXX XXX XXXX"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your operator profile and system preferences</p>
      </header>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-in slide-in-from-top">
          <Check className="text-emerald-600" size={20} />
          <p className="text-emerald-700 font-semibold">✓ All changes saved successfully</p>
        </div>
      )}

      <div className="grid gap-8">
        {/* Profile Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className="text-primary" size={20} /> Profile Settings
            </h3>
            <button 
              onClick={() => setShowEditModal(true)}
              className="text-sm font-bold text-primary hover:underline"
            >
              Edit Profile
            </button>
          </div>
          <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 flex items-center justify-center bg-primary/10 text-primary">
                {profile?.full_name ? (
                  <span className="text-4xl font-black">
                    {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                ) : (
                  <img
                    src="https://picsum.photos/seed/profile/200/200"
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <button 
                onClick={() => alert('Profile picture upload coming soon')}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <p className="text-base font-semibold">{profile?.full_name || 'Operator'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Operator ID</label>
                <p className="text-base font-semibold text-xs truncate">{profile?.id || '#00000'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role</label>
                <p className="text-base font-semibold uppercase">{profile?.role || 'Staff'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact Email</label>
                <p className="text-base font-semibold text-primary">{profile?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* System Preferences */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <SettingsIcon className="text-primary" size={20} /> System Preferences
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Appearance Toggle */}
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold">Dark Mode</p>
                <p className="text-sm text-slate-500">Switch between light and dark visual themes</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    preferences.theme === 'light'
                      ? 'bg-white shadow-sm text-primary'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Light
                </button>
                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    preferences.theme === 'dark'
                      ? 'bg-white shadow-sm text-primary'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
            {/* Notifications Toggle */}
            <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-bold">Notification Sounds</p>
                <p className="text-sm text-slate-500">Play alert sounds for high-priority gate events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notificationSounds}
                  onChange={handleNotificationToggle}
                />
                <div className={`w-11 h-6 rounded-full peer transition-all ${
                  preferences.notificationSounds ? 'bg-primary' : 'bg-slate-200'
                } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2`}>
                  <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    preferences.notificationSounds ? 'translate-x-5' : ''
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Security & Access */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Lock className="text-primary" size={20} />
              <h3 className="font-bold text-lg">Security</h3>
            </div>
            <p className="text-sm text-slate-500 mb-2">Ensure your account stays protected with regular password updates.</p>
            <div className="space-y-3">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-xl border border-slate-100 transition-all group"
              >
                <span className="text-sm font-bold">Change Password</span>
                <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="text-primary" size={20} />
              <h3 className="font-bold text-lg">Help & Feedback</h3>
            </div>
            <p className="text-sm text-slate-500 mb-2">Need assistance or want to report an issue with the system?</p>
            <div className="space-y-3">
              <button 
                onClick={() => alert('Operator manual opening in new tab')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-xl border border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                  <span className="text-sm font-bold">Operator Manual</span>
                </div>
                <ExternalLink className="text-primary" size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col gap-4 mb-12">
          <div className="flex items-center gap-3">
            <LogOut className="text-rose-600" size={20} />
            <h3 className="font-bold text-lg text-rose-900">Account Access</h3>
          </div>
          <p className="text-sm text-rose-700/70 mb-2">Sign out from the operator console safely.</p>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-white border border-rose-200 rounded-xl text-rose-600 font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
          >
            Sign Out Now
          </button>
        </section>

        <div className="flex justify-end gap-4 pb-12">
          <button 
            onClick={handleResetDefaults}
            className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Reset Defaults
          </button>
          <button 
            onClick={handleSaveAllChanges}
            disabled={changes.length === 0}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
              changes.length > 0
                ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {changes.length > 0 ? `Save All Changes (${changes.length})` : 'No Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
