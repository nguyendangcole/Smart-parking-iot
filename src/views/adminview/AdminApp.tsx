import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Pricing } from './pages/Pricing';
import { Users } from './pages/Users';
import { Audit } from './pages/Audit';
import { IoTMonitoring } from './pages/IoTMonitoring';
import { Signage } from './pages/Signage';
import { Settings } from './pages/Settings';

import { useProfile } from '../../shared/hooks/useProfile';

type Tab = 'dashboard' | 'pricing' | 'users' | 'audit' | 'iot' | 'signage' | 'settings';

export default function AdminApp() {
  const { profile, loading, fetchError } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    // Only redirect if loading is complete and no admin profile exists AND no network error
    if (!loading && !fetchError && (!profile || profile.role !== 'admin')) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile, loading, fetchError]);

  if (fetchError) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-6 admin-theme">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center">
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

  if (loading || !profile || profile.role !== 'admin') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 admin-theme">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {loading ? 'Entering Infrastructure Console' : 'Access Denied'}
          </h2>
          <p className="text-sm text-slate-500">
            {loading ? 'Authenticating secure connection...' : 'Redirecting to home page...'}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'pricing':
        return <Pricing />;
      case 'users':
        return <Users />;
      case 'audit':
        return <Audit />;
      case 'iot':
        return <IoTMonitoring />;
      case 'signage':
        return <Signage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light admin-theme">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
}
