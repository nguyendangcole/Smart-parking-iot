import React from 'react';
import { motion } from 'motion/react';

export default function CTA() {
  return (
    <section className="py-24 px-8">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">Ready to modernize your parking experience?</h2>
          <p className="text-xl text-blue-100 leading-relaxed opacity-90">Join thousands of students and faculty members who have already switched to the smart way of campus life.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button className="px-10 py-5 bg-white text-primary rounded-2xl font-extrabold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95">
              Access Student Portal
            </button>
            <button className="px-10 py-5 bg-primary-dark text-white border border-white/20 rounded-2xl font-extrabold text-lg hover:bg-white/10 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
