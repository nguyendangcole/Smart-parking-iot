import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useProfile } from './shared/hooks/useProfile';
import MemberApp from './views/memberview/MemberApp';
import AdminApp from './views/adminview/AdminApp';
import OperatorApp from './views/operatorview/OperatorApp';
import Login from './shared/components/Login';

function App() {
  const { profile, loading, fetchError } = useProfile();
  const [showVisitorView, setShowVisitorView] = useState(false);

  // Splash Screen / Loading State
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-8 text-slate-500 font-bold tracking-widest uppercase text-xs">HCMUT SMART PARKING</p>
      </div>
    );
  }

  // Handle Shared Login (If not logged in and not choosing visitor mode)
  if (!profile && !showVisitorView) {
    return (
      <Login
        onLogin={() => window.location.reload()}
        onVisitor={() => setShowVisitorView(true)}
      />
    );
  }

  // Unified Auth Router
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={
          profile?.role === 'admin' ? <AdminApp /> :
            profile?.role === 'operator' ? <OperatorApp /> :
              <MemberApp />
        } />

        {/* Redirect any other path to the root auth logic */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
