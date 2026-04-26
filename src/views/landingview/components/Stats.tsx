import React from 'react';
import { motion } from 'motion/react';
import { REVEAL_VIEWPORT, scaleIn, staggerParent } from '../animations';
import AnimatedNumber from './AnimatedNumber';

// Numeric values are kept separate from prefix/suffix so the count-up animator
// can interpolate them. `display` falls back to a static string for cases the
// counter can't represent (none currently — keeping the field future-proof).
const stats = [
  { label: 'Parking Zones', value: 12, suffix: '+' },
  { label: 'Smart Slots', value: 2500, suffix: '+' },
  { label: 'Active Sensors', value: 850, suffix: '+' },
  { label: 'Time Saved', value: 25, suffix: '%' },
];

export default function Stats() {
  return (
    <section className="py-20 bg-surface-container-low px-8 scroll-mt-24" id="Stats">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        variants={staggerParent(0, 0.1)}
        className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            variants={scaleIn}
            className="p-8 bg-surface-container-lowest rounded-xl shadow-sm space-y-2 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <AnimatedNumber
              value={stat.value}
              suffix={stat.suffix}
              className="block text-4xl md:text-5xl font-headline font-extrabold text-primary tabular-nums"
            />
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
