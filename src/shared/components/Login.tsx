import React, { useState } from 'react';
import {
  Fingerprint,
  UserPlus,
  ArrowRight,
  ParkingCircle,
  Zap,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface LoginProps {
  onLogin: () => void;
  onVisitor: () => void;
}

export default function Login({ onLogin, onVisitor }: LoginProps) {
  const [showSSOForm, setShowSSOForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Empty by default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both Email and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (data.user) {
        onLogin();
      }
    } catch (err: any) {
      console.error('🛠 [Login Debug] Error full:', err);
      console.error('🛠 [Login Debug] Message:', err?.message);
      console.error('🛠 [Login Debug] Status:', err?.status);
      console.error('🛠 [Login Debug] Code:', err?.code);

      if (err.message === 'Invalid login credentials') {
        setError('Incorrect Email or Password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-slate-50">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2070')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/90 to-transparent"></div>
        </div>
        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ParkingCircle size={32} className="text-primary" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">HCMUT Smart Parking</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md p-10 rounded-2xl max-w-lg border border-white/20"
          >
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">Fast. Secure. Campus-Ready.</h1>
            <p className="text-white/90 text-lg leading-relaxed">Experience a smarter way to park. AI-driven vacancy tracking for a seamless campus arrival.</p>
          </motion.div>

          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Zap size={14} />
            Powered by HCMUT Tech Services
          </div>
        </div>
      </div>

      {/* Right Side: Login Controls */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-16 lg:px-20 relative bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-slate-800">Welcome back!</h2>
            <p className="text-slate-500">Log in with your HCMUT identifier.</p>
          </div>

          <AnimatePresence mode="wait">
            {!showSSOForm ? (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  onClick={() => setShowSSOForm(true)}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 px-6 rounded-2xl font-bold text-lg mb-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                  <Fingerprint size={24} />
                  Login with HCMUT SSO
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleLogin}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 mb-8"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">HCMUT Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="email@hcmut.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-semibold border border-red-100">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSSOForm(false);
                      setError(null);
                    }}
                    className="px-6 py-3.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In Now'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="relative flex items-center justify-center mb-8">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            onClick={onVisitor}
            className="w-full group cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 p-6 rounded-2xl transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-slate-100">
                  <UserPlus size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 underline-offset-4 group-hover:underline">Continue as Visitor</h3>
                  <p className="text-slate-500 text-sm">Check spot availability instantly</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
