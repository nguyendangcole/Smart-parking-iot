import React, { useState, useEffect } from 'react';
import { Screen } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import History from './screens/History';
import Payments from './screens/Payments';
import Settings from './screens/Settings';
import Support from './screens/Support';
import Login from './screens/Login';
import ExitPayment from './screens/ExitPayment';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/supabase';
import { useProfile } from '../../shared/hooks/useProfile';

export default function MemberApp() {
  const { profile, loading, fetchError } = useProfile();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isVisitor, setIsVisitor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'admin') {
        window.location.href = '/admin';
      } else if (profile.role === 'operator') {
        window.location.href = '/operator';
      } else {
        setCurrentScreen('dashboard');
      }
    }
  }, [profile, loading]);

  const handlePostLogin = async (user: any) => {
    // This is called from Login component right after signing in
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      window.location.href = '/admin';
    } else if (profile?.role === 'operator') {
      window.location.href = '/operator';
    } else {
      setCurrentScreen('dashboard');
    }
  };

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium p-8 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 max-w-sm w-full mx-auto">
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">HCMUT SMART PARKING</p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Checking secure connection...</p>
        </div>
      </div>
    );
  }

  if (currentScreen === 'login') {
    return <Login onLogin={handlePostLogin} onVisitor={() => setCurrentScreen('exit')} />;
  }

  if (currentScreen === 'exit') {
    return (
      <div className="min-h-screen bg-background-light p-8 overflow-y-auto">
        <ExitPayment onBack={() => setCurrentScreen('login')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      <main className="ml-72 flex-1 p-8 min-h-screen overflow-y-auto">
        {currentScreen === 'dashboard' && <Dashboard onNavigate={setCurrentScreen} />}
        {currentScreen === 'history' && <History />}
        {currentScreen === 'payments' && <Payments />}
        {currentScreen === 'support' && <Support />}
        {currentScreen === 'settings' && (
          <Settings
            onLogout={() => {
              setCurrentScreen('login');
            }}
          />
        )}
      </main>
    </div>
  );
}
