import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  History,
  Wallet,
  Settings as SettingsIcon,
  Headset,
  LogOut,
  ParkingCircle,
  X
} from 'lucide-react';
import { Screen } from '../types';
import { useProfile } from '../../../shared/hooks/useProfile';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  // Mobile drawer state. The sidebar is always rendered; on screens below
  // `lg` it slides off-canvas unless `isOpen` is true. On `lg+` viewports
  // these props are effectively ignored since the sidebar is permanently
  // anchored.
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentScreen, onNavigate, isOpen = false, onClose }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Parking History', icon: History },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'support', label: 'Support', icon: Headset },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const { profile, logout } = useProfile();

  // ESC closes the mobile drawer. The listener is attached only when the
  // drawer is open so it doesn't fire on `lg+` viewports where the sidebar
  // is permanent.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    // Auto-close the drawer after navigation on mobile so the user lands
    // directly on the new screen without an extra tap to dismiss.
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop — only rendered while the drawer is open AND we're below
          `lg`. The class set keeps it inert on desktop so it never intercepts
          clicks on the main content. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white/95 lg:bg-white/80 backdrop-blur-xl border-r border-slate-200/50 p-6 flex flex-col justify-between z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <ParkingCircle size={24} />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-none text-primary">HCMUT</h1>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Smart Parking</p>
              </div>
            </div>
            {/* Close button — visible only on mobile/tablet so desktop users
                aren't shown a redundant control. */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="size-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as Screen)}
                className={currentScreen === item.id ? "sidebar-link-active w-full text-left" : "sidebar-link w-full text-left"}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

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
    </>
  );
}
