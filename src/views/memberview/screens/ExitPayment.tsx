import React from 'react';
import { 
  HelpCircle, 
  QrCode, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ExitPaymentProps {
  onBack: () => void;
}

export default function ExitPayment({ onBack }: ExitPaymentProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[480px] mx-auto w-full flex flex-col gap-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-primary hover:text-white transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-all">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-primary text-xs font-bold uppercase tracking-wider">Waiting for payment...</span>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-center flex flex-col gap-2">
        <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Total Amount Due</p>
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-400 drop-shadow-sm">
          5.000<span className="text-2xl ml-1 text-slate-400">VND</span>
        </h1>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Duration</span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Clock size={12} /> 2h 15m
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Lane</span>
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Building2 size={12} /> B2 - Exit 04
            </span>
          </div>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative flex flex-col items-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          <div className="relative w-full aspect-square max-w-[240px] bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-4 border-2 border-primary/5">
            <img 
              alt="Payment QR Code" 
              className="w-full h-full object-contain" 
              src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=HCMUT-SMART-PARKING-PAYMENT-5000" 
              referrerPolicy="no-referrer"
            />
            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-sm"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-sm"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-sm"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-sm"></div>
          </div>
          <p className="mt-6 text-sm font-medium text-slate-500 flex items-center gap-2">
            <QrCode size={18} />
            Scan to pay instantly
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Other Methods</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'MoMo', color: '#ae2070', label: 'MoMo' },
            { name: 'Zalo', color: '#0081ff', label: 'ZaloPay' },
            { name: 'Bank', color: '#f1f5f9', label: 'Banking', icon: true },
          ].map((method, i) => (
            <button key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 hover:border-primary/50 transition-all group shadow-sm">
              <div 
                style={{ backgroundColor: method.color }}
                className={`size-10 rounded-lg flex items-center justify-center text-white mb-2 shadow-lg transition-transform group-hover:scale-110 ${method.icon ? 'text-slate-900' : ''}`}
              >
                {method.icon ? <Building2 size={20} /> : <span className="font-black text-[10px]">{method.name}</span>}
              </div>
              <span className="text-[10px] font-bold text-slate-600">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-4">
        <button 
          onClick={onBack}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-5 rounded-2xl shadow-[0_8px_0_0_#003a70] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-lg"
        >
          Confirm Paid
          <CheckCircle size={24} />
        </button>
        <button className="w-full py-4 text-slate-500 font-bold hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
          <AlertCircle size={20} />
          Need assistance?
        </button>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">HCMUT Smart Parking v2.4.0</p>
      </div>
    </motion.div>
  );
}
