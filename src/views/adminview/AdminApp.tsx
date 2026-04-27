import React, { useState } from 'react';
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
  const { profile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Chờ load xong profile để tránh hiện Access Denied nhầm
  if (loading) return null;

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-red-100">
          <h2 className="text-red-600 font-bold text-xl mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have permission to view this page.</p>
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
