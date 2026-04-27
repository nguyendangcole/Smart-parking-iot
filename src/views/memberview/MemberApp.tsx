import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Screen } from './types';
import Sidebar from './components/Sidebar';
import AIChatbot from './components/AIChatbot';
import Dashboard from './screens/Dashboard';
import History from './screens/History';
import Payments from './screens/Payments';
import Settings from './screens/Settings';
import Support from './screens/Support';
import ExitPayment from './screens/ExitPayment';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useProfile } from '../../shared/hooks/useProfile';

export default function MemberApp() {
  const { profile, loading, fetchError } = useProfile();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  // Drawer state for the mobile/tablet sidebar. Desktop (`lg+`) ignores
  // this value because the sidebar is always rendered there.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium p-6 sm:p-8 text-center">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-rose-100 max-w-sm w-full mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">wifi_off</span>
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-2">Network Error</h2>
          <p className="text-xs text-slate-500 mb-6">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">HCMUT SMART PARKING</p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Checking secure connection...</p>
        </div>
      </div>
    );
  }

  if (currentScreen === 'exit') {
    return (
      <div className="min-h-screen bg-background-light p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <ExitPayment onBack={() => setCurrentScreen('dashboard')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        {/* Mobile/tablet top bar — hidden on `lg+` because the sidebar is
            always anchored there. The hamburger opens the off-canvas
            sidebar. The bar is sticky so the user always has access to
            navigation no matter how far they've scrolled into a screen. */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            className="size-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center shadow-sm"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-extrabold text-primary truncate">HCMUT Smart Parking</p>
          </div>
          {/* Spacer so the title stays optically centred between the
              hamburger and the right edge. Using a fixed-size element
              avoids the title shifting when long names truncate. */}
          <div className="size-10 shrink-0" aria-hidden="true" />
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {currentScreen === 'dashboard' && <Dashboard onNavigate={setCurrentScreen} />}
          {currentScreen === 'history' && <History />}
          {currentScreen === 'payments' && <Payments />}
          {currentScreen === 'support' && <Support />}
          {currentScreen === 'settings' && (
            <Settings
              onLogout={async () => {
                const { error } = await supabase.auth.signOut();
                if (!error) navigate('/');
              }}
            />
          )}
        </div>
      </main>

      <AIChatbot />
    </div>
  );
}
