import { supabase } from '../../../shared/supabase';
import { useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';

import { useProfile } from '../../../shared/hooks/useProfile';

export default function Settings() {
  const { profile, logout } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-8">
      {/* ... existing header and sections ... */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your operator profile and system preferences</p>
      </header>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className="text-primary" size={20} /> Profile Settings
            </h3>
            <button className="text-sm font-bold text-primary hover:underline">Edit Profile</button>
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
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">
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
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="font-bold">Dark Mode</p>
                <p className="text-sm text-slate-500">Switch between light and dark visual themes</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-sm font-bold text-primary">Light</button>
                <button className="px-4 py-2 rounded-lg bg-transparent text-sm font-bold text-slate-500 hover:text-slate-700">Dark</button>
              </div>
            </div>
            {/* Notifications Toggle */}
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="font-bold">Notification Sounds</p>
                <p className="text-sm text-slate-500">Play alert sounds for high-priority gate events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-xl border border-slate-100 transition-all group">
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
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-primary/5 rounded-xl border border-slate-100 transition-all group">
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
          <button className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors">Reset Defaults</button>
          <button className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">Save All Changes</button>
        </div>
      </div>
    </div>
  );
}
