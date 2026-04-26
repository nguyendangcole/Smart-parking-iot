import React from 'react';
import { motion } from 'motion/react';
import { Globe, GraduationCap, Settings, ShieldCheck } from 'lucide-react';
import { REVEAL_VIEWPORT, fadeUp, staggerParent } from '../animations';
import TiltCard from './TiltCard';

const roles = [
  {
    title: 'Visitors',
    description: 'Instant entry for campus guests with QR-based payments, real-time navigation, and flexible hourly rates.',
    icon: Globe,
  },
  {
    title: 'Members',
    description: 'Students and Faculty enjoy priority zones, digital permit management, and seamless monthly billing integration.',
    icon: GraduationCap,
  },
  {
    title: 'Operators',
    description: 'Real-time gate status monitoring, occupancy management, and rapid incident response tools.',
    icon: Settings,
  },
  {
    title: 'Administrators',
    description: 'Comprehensive data analytics, revenue reporting, and system-wide policy management for campus mobility.',
    icon: ShieldCheck,
  },
];

export default function Roles() {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto scroll-mt-24" id="Roles">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        variants={staggerParent(0, 0.1)}
        className="text-center mb-20 space-y-4"
      >
        <motion.h2
          variants={fadeUp}
          className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight"
        >
          Tailored for <span className="text-gradient">Bach Khoa Community</span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-on-surface-variant max-w-2xl mx-auto text-lg"
        >
          One unified platform serving every stakeholder in the HCMUT ecosystem with precision and security.
        </motion.p>
      </motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        variants={staggerParent(0.1, 0.08)}
        className="grid md:grid-cols-4 gap-6"
      >
        {roles.map((role, index) => (
          // Outer motion.div drives the entrance reveal; TiltCard handles the
          // mouse-tracking 3D tilt + lift on hover. Splitting them keeps each
          // layer's transform isolated so they compose cleanly.
          <motion.div key={index} variants={fadeUp}>
            <TiltCard
              maxTilt={7}
              lift={6}
              className="group h-full bg-surface-container-lowest p-8 rounded-3xl hover:bg-primary transition-colors duration-500 shadow-sm hover:shadow-2xl hover:shadow-primary/30 cursor-pointer"
            >
              <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white/20 transition-colors">
                <role.icon size={30} className="text-primary group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-headline font-bold mb-4 group-hover:text-white">{role.title}</h3>
              <p className="text-on-surface-variant group-hover:text-white/80 leading-relaxed text-sm">{role.description}</p>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
