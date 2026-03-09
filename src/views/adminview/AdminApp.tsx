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

  if (!loading && (!profile || profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium p-8 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-xs text-slate-500 mb-6">Unauthorized access or session expired.</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Priority 2: Standard Skeleton Loading
    if (loading && !profile) return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-10"></div>
        <div className="h-32 bg-slate-100 rounded-2xl shadow-sm"></div>
        <div className="grid grid-cols-4 gap-6">
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
          <div className="h-28 bg-slate-100 rounded-2xl"></div>
        </div>
        <div className="h-64 bg-slate-50 rounded-2xl border border-slate-100"></div>
      </div>
    );
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
    <div className="flex min-h-screen bg-background-light">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
}

