import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemberApp from './views/memberview/MemberApp';
import AdminApp from './views/adminview/AdminApp';
import OperatorApp from './views/operatorview/OperatorApp';

function App() {
  React.useEffect(() => {
    // Global dark mode initialization
    const savedTheme = localStorage.getItem('theme');
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('bg-slate-900', 'text-white');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('bg-slate-900', 'text-white');
    }

    // Observer to keep body classes in sync with html class
    const updateBodyTheme = () => {
      if (root.classList.contains('dark')) {
        document.body.classList.add('bg-slate-900', 'text-white');
        document.body.classList.remove('bg-gray-50', 'bg-white', 'text-gray-900');
      } else {
        document.body.classList.remove('bg-slate-900', 'text-white');
      }
    };
    
    updateBodyTheme();
    
    const observer = new MutationObserver(updateBodyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin View */}
        <Route path="/admin/*" element={<AdminApp />} />
        
        {/* Operator View */}
        <Route path="/operator/*" element={<OperatorApp />} />
        
        {/* Member View (Default) */}
        <Route path="/*" element={<MemberApp />} />
        
        {/* Catch all - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
