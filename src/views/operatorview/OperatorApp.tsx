import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GateControl from './components/GateControl';
import ManualHandling from './components/ManualHandling';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { useProfile } from '../../shared/hooks/useProfile';

export default function OperatorApp() {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!profile || profile.role !== 'operator') {
    return <div className="p-10">Access Denied</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'gate-control':
        return <GateControl />;
      case 'manual-handling':
        return <ManualHandling />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
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
