import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Car, 
  Bike, 
  CheckCircle, 
  ArrowLeft, 
  HelpCircle,
  Building2,
  Clock,
  Navigation,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../shared/supabase';

type VisitorStep = 'selection' | 'session_info' | 'payment' | 'success';

interface VisitorSession {
  ticket_id: string;
  vehicle_type: 'Motorbike' | 'Car';
  entry_time: string;
  fee: number;
  status: 'active' | 'unpaid' | 'not exited';
  plate: string;
}

export default function VisitorApp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<VisitorStep>('selection');
  const [session, setSession] = useState<VisitorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [plate, setPlate] = useState('');

  const generateTicketId = () => {
    return 'TIC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const startSession = async (type: 'Motorbike' | 'Car') => {
    if (!plate) {
      alert('Please enter your license plate');
      return;
    }

    setLoading(true);
    const ticketId = generateTicketId();
    const entryTime = new Date().toISOString();
    const fee = type === 'Motorbike' ? 5000 : 20000;

    const newSession: VisitorSession = {
      ticket_id: ticketId,
      vehicle_type: type,
      entry_time: entryTime,
      fee: fee,
      status: 'unpaid', // user said: active, unpaid, not exited. 
      plate: plate
    };

    try {
      // Logic for saving to DB
      const { error } = await supabase.from('parking_sessions').insert([{
        id: ticketId,
        vehicle_plate: plate,
        entry_time: entryTime,
        fee: fee,
        status: 'unpaid',
        zone_name: 'Visitor Lot A1',
        user_id: null // Visitor has no user_id
      }]);

      if (error) {
        console.error('Error saving visitor session:', error);
        // Fallback to local state if DB table doesn't support null user_id yet
      }

      setSession(newSession);
      setStep('payment');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('parking_sessions')
        .update({ status: 'Paid' })
        .eq('id', session.ticket_id);
      
      if (error) console.error(error);
      setStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full flex flex-col gap-8 bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100"
          >
            <div className="text-center">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                <Navigation size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Visitor Parking</h1>
              <p className="text-slate-500 mt-2">Get your instant parking ticket below.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">License Plate</label>
                <input 
                  type="text"
                  placeholder="e.g. 59-A1 123.45"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-bold text-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => startSession('Motorbike')}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Bike size={32} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-slate-800">Motorbike</span>
                    <span className="text-xs font-bold text-primary">5.000 VND</span>
                  </div>
                </button>

                <button 
                  onClick={() => startSession('Car')}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-50 border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Car size={32} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-slate-800">Car</span>
                    <span className="text-xs font-bold text-primary">20.000 VND</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                <h3 className="font-bold mb-1">Already have a ticket?</h3>
                <p className="text-white/60 text-xs mb-4">Pay in advance to save time at exit.</p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="TIC-XXXXXX"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none focus:bg-white/20 transition-all font-mono"
                  />
                  <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-all">
                    Find
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors py-2"
            >
              Back to Corporate Login
            </button>
          </motion.div>
        )}

        {step === 'payment' && session && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[480px] w-full flex flex-col gap-8 py-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setStep('selection')} 
                className="flex size-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-1 group">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">P</div>
                <div>
                   <span className="font-extrabold text-slate-800 block leading-none text-sm">HCMUT Smart</span>
                   <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Visitor Exit</span>
                </div>
              </div>
              <button className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
                <HelpCircle size={24} />
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-primary text-[10px] font-black uppercase tracking-widest">Waiting for payment...</span>
              </div>
            </div>

            {/* Amount Section */}
            <div className="text-center flex flex-col gap-3">
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Total Amount Due</p>
              <h1 className="text-7xl font-black tracking-tighter text-slate-900 drop-shadow-sm flex items-center justify-center">
                {session.fee.toLocaleString()}<span className="text-3xl ml-2 text-slate-300">VND</span>
              </h1>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Duration</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <Clock size={14} className="text-primary" /> 15m
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Lane</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <Building2 size={14} className="text-primary" /> B2 - Exit 04
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10 rounded-[3rem] blur-xl opacity-50"></div>
              <div className="relative flex flex-col items-center bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5">
                <div className="relative w-full aspect-square max-w-[260px] bg-slate-50/50 rounded-3xl overflow-hidden flex items-center justify-center p-6 border border-slate-100">
                  <img 
                    alt="Payment QR Code" 
                    className="w-full h-full object-contain mix-blend-multiply" 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=PARK-${session.ticket_id}`} 
                    referrerPolicy="no-referrer"
                  />
                  {/* Digital Framing */}
                  <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl opacity-40"></div>
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl opacity-40"></div>
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl opacity-40"></div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl opacity-40"></div>
                  
                  {/* QR Overlay Label */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-100 font-black text-[8px] uppercase tracking-tighter text-primary">
                    Payment
                  </div>
                </div>
                <p className="mt-8 text-xs font-bold text-slate-400 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <QrCode size={18} />
                  Scan to pay instantly
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Other Methods</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'MoMo', color: '#ae2070', label: 'MoMo' },
                  { name: 'Zalo', color: '#0081ff', label: 'ZaloPay' },
                  { name: 'Bank', color: '#f8fafc', label: 'Banking', icon: true },
                ].map((method, i) => (
                  <button key={i} className="flex flex-col items-center justify-center p-5 rounded-[2rem] bg-white border border-slate-100 hover:border-primary/50 hover:bg-primary/5 transition-all group shadow-sm">
                    <div 
                      style={{ backgroundColor: method.color }}
                      className={`size-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg transition-transform group-hover:scale-110 ${method.icon ? 'text-slate-900 border border-slate-100' : ''}`}
                    >
                      {method.icon ? <Clock size={24} /> : <span className="font-black text-[12px]">{method.name}</span>}
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-4">
              <button 
                onClick={handleConfirmPaid}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/95 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-xl"
              >
                Confirm Paid
                <CheckCircle size={28} />
              </button>
              <button className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-2 text-sm">
                <AlertCircle size={18} />
                Need assistance?
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && session && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center flex flex-col gap-6"
          >
            <div className="size-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
              <CheckCircle size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">Payment Successful</h1>
              <p className="text-slate-500 mt-2">Your ticket <span className="font-bold text-primary">#{session.ticket_id}</span> is now active. Please exit within 15 minutes.</p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plate</span>
                <span className="font-black text-slate-800">{session.plate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-black text-slate-800">{session.vehicle_type}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Paid</span>
                <span className="font-black text-primary text-lg">{session.fee.toLocaleString()} VND</span>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-800 text-white font-black py-5 rounded-2xl hover:bg-slate-900 transition-all font-bold text-lg"
            >
              Finish & Return
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
