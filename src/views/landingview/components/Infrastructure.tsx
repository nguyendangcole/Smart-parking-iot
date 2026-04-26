import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Radio, Shield } from 'lucide-react';
import iotImg from '../../../assets/images/infra_iot.png';
import cloudImg from '../../../assets/images/infra_cloud.png';
import {
  REVEAL_VIEWPORT,
  fadeLeft,
  fadeRight,
  fadeUp,
  scaleIn,
  staggerParent,
} from '../animations';

const featurePoints = [
  'Smart ultrasonic sensors for real-time slot tracking',
  'AI-powered license plate recognition (ALPR) at gates',
  'NFC-based access control for faculty and students',
  'Redundant cloud sync with 99.9% uptime guarantee',
];

export default function Infrastructure() {
  const sectionRef = useRef<HTMLElement>(null);

  // Update CSS custom properties on every mousemove. Doing this via direct DOM
  // mutation (rather than React state) keeps mousemove off the React render
  // path entirely — no re-renders, no jank, and the GPU compositor handles
  // the gradient repaint cheaply since only a custom property changed.
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    sectionRef.current.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    sectionRef.current.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="group/spotlight relative py-24 bg-slate-900 text-white overflow-hidden scroll-mt-24"
      id="Infrastructure"
    >
      {/*
        Cyan spotlight that follows the cursor. Hidden by default (opacity-0),
        fades in on hover via CSS group-hover. The radial-gradient origin
        reads from --spotlight-x/y custom properties set by handleMouseMove,
        with sensible 50% fallbacks so the gradient is centered on first paint.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/spotlight:opacity-100 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle 480px at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0, 180, 216, 0.18), transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          variants={staggerParent(0, 0.1)}
          className="order-2 lg:order-1"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.04, rotate: -1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="aspect-square bg-white/5 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 text-center border border-white/10 hover:border-accent-cyan/40 hover:bg-white/10 transition-colors"
              >
                <Radio size={48} className="text-accent-cyan" />
                <p className="font-bold text-lg">IoT Grid</p>
              </motion.div>
              <motion.div
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="aspect-[4/5] bg-white/5 rounded-3xl p-8 flex flex-col justify-end gap-4 border border-white/10 hover:border-accent-cyan/40 overflow-hidden relative transition-colors"
              >
                <img
                  alt="Infrastructure"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  src={iotImg}
                />
                <p className="relative font-bold text-lg">Edge Nodes</p>
              </motion.div>
            </div>
            <div className="space-y-4 pt-8">
              <motion.div
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="aspect-[4/5] bg-white/5 rounded-3xl p-8 flex flex-col justify-end gap-4 border border-white/10 hover:border-accent-cyan/40 overflow-hidden relative transition-colors"
              >
                <img
                  alt="Cloud"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  src={cloudImg}
                />
                <p className="relative font-bold text-lg">Realtime Sync</p>
              </motion.div>
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.04, rotate: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="aspect-square bg-white/5 rounded-3xl p-8 flex flex-col justify-center items-center gap-4 text-center border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-colors"
              >
                <Shield size={48} className="text-primary" />
                <p className="font-bold text-lg">Secure Core</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          variants={staggerParent(0.1, 0.1)}
          className="order-1 lg:order-2 space-y-8"
        >
          <motion.h2
            variants={fadeLeft}
            className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight"
          >
            Integrated <br /><span className="text-accent-cyan">IoT Infrastructure</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-slate-400 text-lg leading-relaxed"
          >
            Leveraging HCMUT's technical edge, our system connects high-precision sensors to a high-speed cloud backend, providing millisecond-accurate updates across the entire Bach Khoa network.
          </motion.p>
          <motion.ul
            variants={staggerParent(0, 0.07)}
            className="space-y-4"
          >
            {featurePoints.map((item, i) => (
              <motion.li
                key={i}
                variants={fadeRight}
                className="flex items-center gap-3"
              >
                <CheckCircle2 size={24} className="text-accent-cyan shrink-0" />
                <span className="font-medium text-slate-200">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
