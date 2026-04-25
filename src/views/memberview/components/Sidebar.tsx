import React from 'react';
import {
  LayoutDashboard,
  History,
  Wallet,
  Settings as SettingsIcon,
  Headset,
  LogOut,
  ParkingCircle
} from 'lucide-react';
import { Screen } from '../types';
import { useProfile } from '../../../shared/hooks/useProfile';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Parking History', icon: History },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'support', label: 'Support', icon: Headset },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const { profile, logout } = useProfile();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 p-6 flex flex-col justify-between z-50">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <ParkingCircle size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none text-primary">HCMUT</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Smart Parking</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className={currentScreen === item.id ? "sidebar-link-active w-full text-left" : "sidebar-link w-full text-left"}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Mini */}
      <div className="bg-slate-100 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {profile?.avatar_url ? (
              <img
                className="w-full h-full object-cover"
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                referrerPolicy="no-referrer"
              />
            ) : profile?.full_name ? (
              <span className="font-bold text-sm tracking-tighter">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <img
                className="w-full h-full object-cover"
                src="https://picsum.photos/seed/user/100/100"
                alt="User"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{profile?.full_name || 'Guest'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-medium">{profile?.role || 'Visitor'}</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
