import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useProfile } from './shared/hooks/useProfile';
import MemberApp from './views/memberview/MemberApp';
import AdminApp from './views/adminview/AdminApp';
import OperatorApp from './views/operatorview/OperatorApp';
import Login from './shared/components/Login';
import VisitorApp from './views/visitorview/VisitorApp';
import LandingPage from './views/landingview/LandingPage';

function App() {
  const { profile, loading } = useProfile();

  // Splash Screen / Loading State
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-8 text-slate-500 font-bold tracking-widest uppercase text-xs">HCMUT SMART PARKING</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Routes */}
        {!profile ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login onLogin={() => window.location.reload()} />} />
            <Route path="/visitor" element={<VisitorApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* Authenticated Dashboard Router */
          <>
            <Route 
              path="/*" 
              element={
                profile.role === 'admin' ? <AdminApp /> :
                profile.role === 'operator' ? <OperatorApp /> :
                <MemberApp />
              } 
            />
            {/* Redirect root to current dashboard if logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/visitor" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
