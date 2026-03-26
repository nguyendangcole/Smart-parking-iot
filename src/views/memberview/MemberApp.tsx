import React, { useState } from 'react';
import { Screen } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import History from './screens/History';
import Payments from './screens/Payments';
import Settings from './screens/Settings';
import Support from './screens/Support';
import ExitPayment from './screens/ExitPayment';
import { useProfile } from '../../shared/hooks/useProfile';

export default function MemberApp() {
  const { profile } = useProfile();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

  // Visitor might start with Exit payment or Dashboard
  // If we came from App.tsx as visitor, there's no profile.
  // In that case, we can just show dashboard or exit payment.

  if (!profile && currentScreen === 'dashboard') {
    // Default for visitor is exit payment as shown in original
  }

  return (
    <div className="flex min-h-screen bg-background-light">
      <Sidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      <main className="ml-72 flex-1 p-8 min-h-screen overflow-y-auto">
        {currentScreen === 'dashboard' && <Dashboard />}
        {currentScreen === 'history' && <History />}
        {currentScreen === 'payments' && <Payments />}
        {currentScreen === 'support' && <Support />}
        {currentScreen === 'settings' && (
          <Settings
            onLogout={() => {
              window.location.reload();
            }}
          />
        )}
        {currentScreen === 'exit' && <ExitPayment onBack={() => setCurrentScreen('dashboard')} />}
      </main>
    </div>
  );
}
