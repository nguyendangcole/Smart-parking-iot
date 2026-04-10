import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Zap } from 'lucide-react';
import heroImage from '../../../assets/images/hcmut_building.jpg';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center px-8 max-w-7xl mx-auto overflow-hidden pt-20">
      <div className="grid md:grid-cols-2 gap-12 items-center z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase">
            <Zap size={14} className="fill-current" />
            HCMUT Smart City Initiative
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-none text-on-background">
            Smart <br /> <span className="text-gradient">Campus Parking</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
            Experience the future of HCMUT parking. Seamless IoT integration, real-time slot availability, and automated access for the smartest technical community at Bach Khoa.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-2xl shadow-primary/40 flex items-center gap-2 hover:opacity-90 transition-all">
              Reserve a Slot
              <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container-high transition-all">
              Live Map
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="glass-panel p-8 rounded-3xl border border-white/40 shadow-2xl relative overflow-hidden group">
            <img 
              alt="HCMUT Campus Parking" 
              className="rounded-2xl w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110" 
              src={heroImage}
            />
            <div className="absolute bottom-12 right-12 glass-panel p-6 rounded-2xl shadow-xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center">
                  <MapPin size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Zone A Status</p>
                  <p className="text-lg font-headline font-extrabold text-on-background">94% Capacity</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
