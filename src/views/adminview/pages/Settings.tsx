import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../../shared/hooks/useProfile';

export const Settings: React.FC = () => {
  const { profile, logout } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your administrative profile and system preferences.</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg">Profile Information</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-3xl font-bold">
                {profile?.full_name?.[0] || 'A'}
              </div>
              <div>
                <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-all">Change Avatar</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" defaultValue={profile?.full_name || ''} type="text" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" defaultValue={profile?.email || ''} type="email" readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none text-slate-400" defaultValue={profile?.role || ''} type="text" readOnly />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account ID</label>
                <input className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none text-slate-400" defaultValue={profile?.id || ''} type="text" readOnly />
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">Save Changes</button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg">System Configuration</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <div>
                  <p className="text-sm font-bold">Dark Mode</p>
                  <p className="text-xs text-slate-500">Enable dark theme for the entire dashboard.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <div>
                  <p className="text-sm font-bold">System Notifications</p>
                  <p className="text-xs text-slate-500">Receive alerts for hardware malfunctions and peak occupancy.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">language</span>
                </div>
                <div>
                  <p className="text-sm font-bold">System Language</p>
                  <p className="text-xs text-slate-500">Choose your preferred language for the interface.</p>
                </div>
              </div>
              <select className="bg-white border border-slate-200 rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-0">
                <option>English (US)</option>
                <option>Vietnamese (VN)</option>
                <option>French (FR)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm overflow-hidden mb-12">
          <div className="p-6 border-b border-rose-100">
            <h3 className="font-bold text-lg text-rose-900">Account Actions</h3>
          </div>
          <div className="p-6">
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-white border border-rose-200 rounded-xl text-rose-600 font-bold hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined group-hover:rotate-180 transition-transform">logout</span>
              Sign Out from Infrastructure Console
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
