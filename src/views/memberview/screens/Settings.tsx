import React from 'react';
import {
  Bell,
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
  Settings as SettingsIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../../../shared/hooks/useProfile';

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const { profile, logout } = useProfile();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({ full_name: '', email: '' });
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({ current: '', new: '', confirm: '' });

  // Linked account state
  const [isLinked, setIsLinked] = React.useState(true);

  const handleLinkAccount = () => {
    // In a real app, this would call an API to link/unlink the account
    setIsLinked(!isLinked);
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const startEditing = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // In a real app, call your API/updateProfile here
    console.log('Saving profile data:', formData, 'Image:', profileImage ? 'Updated' : 'Unchanged');
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordSubmit = () => {
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords do not match!");
      return;
    }
    // In a real app, call your API to change password here
    console.log('Changing password to:', passwordData.new);
    setIsChangingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
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
          <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors relative">
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
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
          </div>
          <button 
            onClick={triggerFileInput}
            className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-primary/90 transition-colors"
          >
            <Edit size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
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
          <div className="flex gap-3">
            <button 
              onClick={isEditing ? handleSave : startEditing}
              className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all text-sm"
            >
              {isEditing ? 'Save Profile Details' : 'Edit Profile Details'}
            </button>
            {isEditing && (
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
              onClick={() => setIsChangingPassword(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <span className="font-medium">Change Password</span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
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
            {[
              { label: 'Parking Sessions', sub: 'Alerts when session starts or ends', checked: true },
              { label: 'Low Balance Alerts', sub: 'Notify when balance is below 50,000 VND', checked: true },
              { label: 'Promotional Offers', sub: 'New parking deals & campus news', checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.sub}</span>
                </div>
                <Toggle checked={item.checked} />
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

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-xl font-bold">Change Password</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => setIsChangingPassword(false)}
                className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
