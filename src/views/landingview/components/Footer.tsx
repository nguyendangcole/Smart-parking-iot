import React from 'react';
import { Share2, ParkingCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full pt-16 pb-8 bg-slate-50 flex flex-col md:flex-row justify-between items-center px-8 border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <ParkingCircle className="text-primary" size={24} />
            <p className="text-xl font-bold text-primary font-headline">HCMUT Parking</p>
          </div>
          <p className="font-body text-sm text-slate-500 max-w-xs">
            © 2026 HCMUT Smart Parking System. Engineering the Future of Campus Mobility.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-body text-sm font-semibold">
          <a className="text-slate-600 hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-slate-600 hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-slate-600 hover:text-primary transition-colors" href="#">Campus Map</a>
          <a className="text-slate-600 hover:text-primary transition-colors" href="#">Support</a>
        </div>
        <div className="flex gap-4">
          <a className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm" href="#">
            <Share2 size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
