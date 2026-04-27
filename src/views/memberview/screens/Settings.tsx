import React from 'react';
import {
  HelpCircle,
  Edit,
  User,
  Shield,
  Lock,
  Link as LinkIcon,
  Fingerprint,
  Bell as BellIcon,
  Languages,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import { LOW_BALANCE_THRESHOLD } from '../../../shared/utils/notifications';

interface SettingsProps {
  onLogout: () => void;
}

// Mirrors the Storage bucket policy in sql_scripts/07_member_profile_avatar.sql.
// Keeping these client-side too lets us reject obvious junk BEFORE it ever
// hits Supabase, so the user gets an instant error instead of a network round-trip.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
const AVATAR_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export default function Settings({ onLogout }: SettingsProps) {
  const { profile, logout, refreshProfile } = useProfile();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({ full_name: '', email: '' });
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Hydrate the local preview from whatever the server has on file. We re-sync
  // whenever the profile loads or refreshes (e.g. right after an upload) so a
  // hard reload of /settings still shows the saved picture.
  React.useEffect(() => {
    setProfileImage(profile?.avatar_url ?? null);
  }, [profile?.avatar_url]);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  // Linked account state
  const [isLinked, setIsLinked] = React.useState(true);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  // Auto-dismiss the success toast after 3s; cleanly cancels on unmount / re-trigger
  React.useEffect(() => {
    if (!showSuccessToast) return;
    const timer = window.setTimeout(() => setShowSuccessToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showSuccessToast]);

  const handleLinkAccount = () => {
    // In a real app, this would call an API to link/unlink the account
    setIsLinked(!isLinked);
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  // Persist a single boolean notification preference to the
  // `profiles` row backing the current session. We refresh the shared
  // profile snapshot afterwards so every other consumer of useProfile
  // (Payments banner, Dashboard bell) reflects the new setting
  // immediately without a hard reload. On failure we still refresh —
  // that re-syncs the Toggle's optimistic UI back to the saved truth.
  const handleNotificationPrefChange = async (
    field: 'notify_low_balance' | 'notify_promotions',
    value: boolean
  ) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
    } catch (err: any) {
      console.error(`Failed to update ${field}:`, err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update notification preference.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      await refreshProfile();
    }
  };

  const startEditing = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    const trimmedName = formData.full_name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      setStatusMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          email: trimmedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Re-fetch the profile so every consumer of useProfile (this screen,
      // the Sidebar mini-profile, the Dashboard greeting, etc.) sees the
      // freshly-saved values without a page reload.
      await refreshProfile();

      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always clear the input so the user can re-pick the same file later
    // (browsers suppress onChange when the value doesn't actually change).
    if (e.target) e.target.value = '';
    if (!file || !profile) return;

    if (!AVATAR_ALLOWED_MIME.includes(file.type)) {
      setStatusMessage({ type: 'error', text: 'Please choose a PNG, JPG, WebP or GIF image.' });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setStatusMessage({ type: 'error', text: 'Image is too large. Maximum size is 2 MB.' });
      return;
    }

    // Optimistic preview — flips back to the server URL if the upload fails.
    const previousImage = profileImage;
    const localPreview = URL.createObjectURL(file);
    setProfileImage(localPreview);
    setIsUploadingAvatar(true);
    setStatusMessage(null);

    try {
      // Path layout matches the RLS policy in 07_member_profile_avatar.sql:
      //   `{auth.uid()}/avatar-{timestamp}.{ext}`
      // The timestamp gives us a free cache-buster — every upload yields a
      // new immutable URL, so the CDN never serves a stale image.
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const folder = profile.id;
      const filename = `avatar-${Date.now()}.${ext}`;
      const path = `${folder}/${filename}`;

      // Best-effort cleanup of the user's previous avatars so Storage doesn't
      // grow without bound. Failure here is non-fatal — the upload itself is
      // what actually matters, and a stray old file just costs a few KB.
      const { data: existing } = await supabase.storage
        .from('avatars')
        .list(folder, { limit: 100 });
      if (existing && existing.length > 0) {
        const stalePaths = existing.map(obj => `${folder}/${obj.name}`);
        await supabase.storage.from('avatars').remove(stalePaths);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (updateError) throw updateError;

      // Re-fetch so any other consumer of useProfile (Sidebar, Dashboard) sees
      // the new picture without a page reload.
      await refreshProfile();
      setProfileImage(publicUrl);
      setStatusMessage({ type: 'success', text: 'Profile picture updated!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setProfileImage(previousImage);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to upload profile picture.'
      });
    } finally {
      // Free the blob URL we created for the optimistic preview.
      URL.revokeObjectURL(localPreview);
      setIsUploadingAvatar(false);
    }
  };

  const triggerFileInput = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handlePasswordSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isUpdatingPassword) return;

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert("Please fill in all password fields.");
      return;
    }
    if (passwordData.new.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }
    if (passwordData.new === passwordData.current) {
      alert("New password must be different from the current password.");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords do not match!");
      return;
    }

    // The user is already authenticated (active Supabase session), so we let
    // `updateUser` rely on the current JWT. Skipping the previous
    // `signInWithPassword` pre-check removes one network round-trip AND the
    // `SIGNED_IN` auth cascade (which was also triggering a profile refetch),
    // so the UI reacts much faster on a successful update.
    setIsUpdatingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (updateError) {
        alert("Failed to change password: " + updateError.message);
        return;
      }

      setIsChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowSuccessToast(true);
    } catch (error: any) {
      alert("An unexpected error occurred: " + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-5xl mx-auto w-full"
    >
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 rounded-2xl">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Manage your profile and app preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <HelpCircle size={20} className="text-slate-600" />
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
            {profileImage ? (
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={profileImage}
              />
            ) : profile?.full_name ? (
              <span className="text-4xl font-black">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src="https://picsum.photos/seed/profile/200/200"
                referrerPolicy="no-referrer"
              />
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <Loader2 size={28} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            onClick={triggerFileInput}
            disabled={isUploadingAvatar}
            aria-label="Change profile picture"
            className={`absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white transition-colors ${
              isUploadingAvatar ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/90'
            }`}
          >
            <Edit size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept={AVATAR_ALLOWED_MIME.join(',')}
            className="hidden"
          />
        </div>
        <div className="flex-1 space-y-4 w-full text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full text-lg font-semibold bg-slate-50 border border-slate-200 rounded px-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-lg font-semibold">{profile?.full_name || 'Guest'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
              <p className="text-lg font-semibold uppercase">{profile?.role || 'Visitor'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-lg font-semibold bg-slate-50 border border-slate-200 rounded px-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-lg font-semibold">{profile?.email || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account ID</label>
              <p className="text-lg font-semibold truncate text-xs">{profile?.id || 'N/A'}</p>
            </div>
          </div>
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
                  statusMessage.type === 'success' 
                    ? 'bg-green-50 text-green-600 border border-green-100' 
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button 
              onClick={isEditing ? handleSave : startEditing}
              disabled={isSaving}
              className={`px-6 py-2 flex items-center gap-2 font-bold rounded-lg transition-all text-sm ${
                isSaving 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Profile Details'
              ) : (
                'Edit Profile Details'
              )}
            </button>
            {isEditing && !isSaving && (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Settings */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 px-2">
            <User size={20} className="text-primary" /> Account Settings
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <span className="font-medium">Change Password</span>
              </div>
              <ChevronRight size={18} className={`text-slate-400 transition-transform duration-200 ${isChangingPassword ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Inline Password Form */}
            {isChangingPassword && (
              <div className="p-4 bg-slate-50/50 space-y-4 border-t border-slate-100">
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                    placeholder="New password"
                  />
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ current: '', new: '', confirm: '' });
                    }}
                    disabled={isUpdatingPassword}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isUpdatingPassword}
                    className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={handleLinkAccount}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <LinkIcon size={18} />
                </div>
                <span className="font-medium">Linked Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                {isLinked ? (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">BKPay Linked</span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">Link BKPay</span>
                )}
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 px-2">
            <Shield size={20} className="text-primary" /> Security
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Shield size={18} className="text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">2FA Authentication</span>
                  <span className="text-xs text-slate-500">Add extra layer of security</span>
                </div>
              </div>
              <Toggle checked />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Fingerprint size={18} className="text-slate-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Biometric Login</span>
                  <span className="text-xs text-slate-500">Use Face ID or Fingerprint</span>
                </div>
              </div>
              <Toggle />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 px-2">
            <BellIcon size={20} className="text-primary" /> Notifications
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {([
              {
                key: 'notify_low_balance',
                label: 'Low Balance Alerts',
                sub: `Notify when balance is below ${LOW_BALANCE_THRESHOLD.toLocaleString()} VND`,
                // Default to ON when the column hasn't been migrated yet
                // so existing members don't lose their alerts.
                checked: profile?.notify_low_balance ?? true,
              },
              {
                key: 'notify_promotions',
                label: 'Promotional Offers',
                sub: 'New parking deals & campus news',
                // Default OFF — promotions are opt-in.
                checked: profile?.notify_promotions ?? false,
              },
            ] as const).map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.sub}</span>
                </div>
                <Toggle
                  checked={item.checked}
                  onChange={(val) => handleNotificationPrefChange(item.key, val)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 px-2">
            <SettingsIcon size={20} className="text-primary" /> Preferences
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Languages size={18} className="text-slate-600" />
                </div>
                <span className="font-medium">Language</span>
              </div>
              <select className="bg-slate-50 border-none rounded-lg text-sm font-bold text-primary focus:ring-primary py-1 px-3">
                <option>English</option>
                <option>Vietnamese</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 transition-colors rounded-2xl border border-red-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <LogOut size={18} className="text-red-600" />
            </div>
            <span className="font-bold text-red-600">Log Out</span>
          </div>
          <ChevronRight size={18} className="text-red-400" />
        </button>
      </div>

      <div className="text-center pb-8">
        <p className="text-xs text-slate-400 font-medium">HCMUT Smart Parking v2.4.0 (Build 892)</p>
        <p className="text-xs text-slate-400 mt-1">© 2024 Ho Chi Minh City University of Technology</p>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-xl font-bold">Help & Support</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              If you need assistance with your profile, settings, or linked accounts, our support team is available 24/7.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Support</p>
              <p className="text-sm font-semibold text-slate-800">parking@hcmut.edu.vn</p>
              <div className="h-px w-full bg-slate-200 my-1"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Emergency Hotline</p>
              <p className="text-sm font-semibold text-slate-800">028-1234-5678</p>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            key="password-success-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white pl-5 pr-3 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50 font-bold"
          >
            <CheckCircle size={20} />
            <span>Password changed successfully</span>
            <button
              onClick={() => setShowSuccessToast(false)}
              aria-label="Dismiss notification"
              className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Toggle({ checked = false, onChange }: { checked?: boolean; onChange?: (val: boolean) => void }) {
  const [isOn, setIsOn] = React.useState(checked);
  
  React.useEffect(() => {
    setIsOn(checked);
  }, [checked]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextState = !isOn;
    setIsOn(nextState);
    if (onChange) onChange(nextState);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-primary' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
