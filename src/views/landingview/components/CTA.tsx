import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ContactSupportModal from './ContactSupportModal';
import { REVEAL_VIEWPORT, fadeUp, staggerParent } from '../animations';

export default function CTA() {
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <section className="py-24 px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        variants={fadeUp}
        className="max-w-7xl mx-auto bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        {/*
          Inner stagger fires once "visible" propagates from the outer banner.
          delayChildren waits ~0.25s so the banner's own slide-up reads first
          before its contents start layering in — gives a nice "the box opens,
          then the contents arrive" cadence.
        */}
        <motion.div
          variants={staggerParent(0.25, 0.12)}
          className="relative z-10 space-y-8 max-w-3xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight"
          >
            Ready to modernize your parking experience?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-xl text-blue-100 leading-relaxed opacity-90"
          >
            Join thousands of students and faculty members who have already switched to the smart way of campus life.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-white text-primary rounded-2xl font-extrabold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              Access Portal Now
            </button>
            <button
              onClick={() => setIsContactOpen(true)}
              className="px-10 py-5 bg-primary-dark text-white border border-white/20 rounded-2xl font-extrabold text-lg hover:bg-white/10 transition-colors active:scale-95"
            >
              Contact Support
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
      <ContactSupportModal
        open={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </section>
  );
}
