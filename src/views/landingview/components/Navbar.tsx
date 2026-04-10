import { motion } from 'motion/react';
import { ParkingCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-xl shadow-blue-900/5">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ParkingCircle className="text-primary" size={32} strokeWidth={2.5} />
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">HCMUT<span className="text-on-surface-variant font-medium">Parking</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-headline font-bold tracking-tight">
          <a className="text-primary border-b-2 border-primary hover:opacity-80 transition-all duration-300" href="#Features">Features</a>
          <a className="text-on-surface-variant hover:text-primary hover:opacity-80 transition-all duration-300" href="#Roles">Roles</a>
          <a className="text-on-surface-variant hover:text-primary hover:opacity-80 transition-all duration-300" href="#Stats">Stats</a>
          <a className="text-on-surface-variant hover:text-primary hover:opacity-80 transition-all duration-300" href="#Reviews">Reviews</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-bold text-on-surface-variant hover:opacity-80 scale-95 active:scale-90 transition-all duration-300"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 text-sm font-bold bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-80 scale-95 active:scale-90 transition-all duration-300"
          >
            Portal
          </button>
        </div>
      </div>
    </nav>
  );
}
