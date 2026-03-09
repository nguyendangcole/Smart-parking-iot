import React from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Hand,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

import { useProfile } from '../../../shared/hooks/useProfile';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { profile, logout } = useProfile();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gate-control', label: 'Gate Control', icon: DoorOpen },
    { id: 'manual-handling', label: 'Manual Handling', icon: Hand },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
          <span className="font-bold text-xl">P</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-primary font-bold text-lg leading-tight">HCMUT</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Smart Parking</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {profile?.full_name ? (
              <span className="font-bold text-sm tracking-tighter">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            ) : (
              <img
                src="https://picsum.photos/seed/operator/100/100"
                alt="Operator"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold truncate">{profile?.full_name || 'Operator'}</span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">{profile?.role || 'Staff'}</span>
          </div>
          <button
            onClick={logout}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
