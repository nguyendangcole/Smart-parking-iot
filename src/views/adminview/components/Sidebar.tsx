import React from 'react';
import { useProfile } from '../../../shared/hooks/useProfile';

type Tab = 'dashboard' | 'pricing' | 'users' | 'audit' | 'iot' | 'signage' | 'settings';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile, logout } = useProfile();
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'pricing', label: 'Pricing', icon: 'payments' },
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'audit', label: 'Audit', icon: 'analytics' },
    { id: 'iot', label: 'IoT Devices', icon: 'router' },
    { id: 'signage', label: 'Signage', icon: 'tv' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col py-6 overflow-y-auto">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">local_parking</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">HCMUT</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Smart Parking</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === item.id
                ? 'bg-primary/10 text-primary font-semibold border-r-4 border-primary'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'filled-icon' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          <div className="my-4 border-t border-slate-100"></div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Logout</span>
          </button>
        </nav>
      </div>

      <div className="p-4 space-y-3">
        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
            {profile?.full_name ? (
              <span className="font-bold text-xs tracking-tighter">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <span className="material-symbols-outlined text-xl">person</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold truncate text-slate-800">{profile?.full_name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">{profile?.role || 'Admin'}</span>
          </div>
        </div>
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
          <p className="text-xs font-bold text-primary mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-600 font-medium tracking-tight">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
