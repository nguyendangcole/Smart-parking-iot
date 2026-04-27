import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GateControl from './components/GateControl';
import ManualHandling from './components/ManualHandling';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../../shared/hooks/useProfile';

interface Gate {
  id: string;
  name: string;
  zone: string;
  laneType: 'two-wheel' | 'four-wheel';
  direction: 'entry' | 'exit';
  status: 'Online' | 'Alert' | 'Offline';
  img: string;
  recTime?: string;
  alert?: string;
  lockState: 'open' | 'closed' | 'locked';
}

export default function OperatorApp() {
  const { profile, loading, fetchError } = useProfile();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Shared Gate State - synced between Dashboard and GateControl
  const [gates, setGates] = useState<Gate[]>([
    { 
      id: 'A', 
      name: 'Motorbike Entry Lane', 
      zone: 'Motorbike Lot', 
      laneType: 'two-wheel',
      direction: 'entry',
      status: 'Online', 
      img: 'https://picsum.photos/seed/gateA_live/600/400',
      recTime: '10:45:22',
      lockState: 'open'
    },
    { 
      id: 'B', 
      name: 'Motorbike Exit Lane', 
      zone: 'Motorbike Lot', 
      laneType: 'two-wheel',
      direction: 'exit',
      status: 'Alert', 
      img: 'https://picsum.photos/seed/gateB_live/600/400',
      alert: 'Obstruction Detected',
      lockState: 'closed'
    },
    { 
      id: 'C', 
      name: 'Car Entry Lane', 
      zone: 'Car Lot', 
      laneType: 'four-wheel',
      direction: 'entry',
      status: 'Offline', 
      img: '',
      lockState: 'closed'
    },
    { 
      id: 'D', 
      name: 'Car Exit Lane', 
      zone: 'Car Lot', 
      laneType: 'four-wheel',
      direction: 'exit',
      status: 'Online', 
      img: 'https://picsum.photos/seed/gateD_live/600/400',
      lockState: 'open'
    },
  ]);
  
  // Manual Handling Action State
  const [pendingManualAction, setPendingManualAction] = useState<{
    type: 'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate' | null;
    data?: any;
  }>({ type: null });

  const handleManualAction = (actionType: 'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate' | 'manual_handling', actionData?: any) => {
    setPendingManualAction({ type: actionType, data: actionData });
    setActiveTab('manual-handling');
  };

  const handleReturnToDashboard = () => {
    setPendingManualAction({ type: null });
    setActiveTab('dashboard');
  };

  useEffect(() => {
    if (!loading && !fetchError && (!profile || profile.role !== 'operator')) {
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

  if (!loading && (!profile || profile.role !== 'operator')) {
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
    if (loading && !profile) return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-48 bg-slate-100 rounded-2xl shadow-sm"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-slate-100 rounded-2xl"></div>
          <div className="h-40 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onManualAction={handleManualAction}
            gates={gates}
          />
        );
      case 'gate-control':
        return <GateControl gates={gates} onGatesChange={setGates} />;
      case 'manual-handling':
        return (
          <ManualHandling 
            pendingAction={pendingManualAction}
            clearPendingAction={() => setPendingManualAction({ type: null })}
            onReturnToDashboard={handleReturnToDashboard}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onManualAction={handleManualAction} gates={gates} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-72 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
