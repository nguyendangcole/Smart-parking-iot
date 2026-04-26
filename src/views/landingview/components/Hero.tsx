import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, MapPin, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../../../assets/images/hcmut_building.jpg';
import LiveMapModal from './LiveMapModal';
import { fadeUp, scaleIn, staggerParent } from '../animations';

export default function Hero() {
  const navigate = useNavigate();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-driven parallax: scrollYProgress runs 0 → 1 from "hero pinned at
  // the top of the viewport" to "hero fully scrolled past". useTransform maps
  // that into the actual pixel/opacity values so each layer drifts at its own
  // pace, producing a sense of depth as the user leaves the hero behind.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.45]);
  const blobUpY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blobDownY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center px-8 max-w-7xl mx-auto overflow-hidden pt-20"
    >
      <div className="grid md:grid-cols-2 gap-12 items-center z-10">
        {/*
          Hero is above the fold so it animates on page-load (`animate`) rather
          than `whileInView`. Children stagger via the parent's `visible` state.
        */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent(0.1, 0.12)}
          className="space-y-8"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase"
          >
            <Zap size={14} className="fill-current" />
            HCMUT Smart City Initiative
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-8xl font-headline font-extrabold tracking-tighter leading-none text-on-background"
          >
            Smart <br /> <span className="text-gradient">Campus Parking</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-xl text-on-surface-variant max-w-lg leading-relaxed"
          >
            Experience the future of HCMUT parking. Seamless IoT integration, real-time slot availability, and automated access for the smartest technical community at Bach Khoa.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold shadow-2xl shadow-primary/40 flex items-center gap-2 hover:shadow-primary/60 hover:-translate-y-1 transition-all active:scale-95"
            >
              Enter Portal
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-8 py-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-container-high hover:-translate-y-1 transition-all active:scale-95 border border-slate-200 flex items-center gap-2"
            >
              <MapPin size={20} />
              Live Map
            </button>
          </motion.div>
        </motion.div>

        {/*
          Outer wrapper handles scroll-linked parallax (style with MotionValues).
          Inner motion.div handles the page-load scaleIn reveal via variants.
          Splitting them avoids a property fight on `opacity` between variant
          animation and the parallax transform.
        */}
        <motion.div
          style={{ y: imageY, opacity: imageOpacity }}
          className="relative hidden md:block"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
          <motion.div
            style={{ y: blobUpY }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          />
          <motion.div
            style={{ y: blobDownY }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          />
          <div className="glass-panel p-8 rounded-3xl border border-white/40 shadow-2xl relative overflow-hidden group">
            <img 
              alt="HCMUT Campus Parking" 
              className="rounded-2xl w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-110" 
              src={heroImage}
            />
            <div className="absolute bottom-10 right-10 glass-panel px-3 py-2 rounded-xl shadow-lg border border-white/40">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
                  <MapPin size={16} className="text-white" />
                  {/*
                    Pulsing live-status dot — the outer ping animates a soft halo
                    while the inner solid dot stays put. The white ring keeps it
                    readable against the primary-blue icon backdrop.
                  */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
                  </span>
                </div>
                <div className="leading-tight pr-1">
                  <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.15em]">Zone A · Live</p>
                  <p className="text-base font-headline font-extrabold text-on-background leading-none mt-0.5">94% Full</p>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </div>
      <LiveMapModal open={isMapOpen} onClose={() => setIsMapOpen(false)} />
    </section>
  );
}
