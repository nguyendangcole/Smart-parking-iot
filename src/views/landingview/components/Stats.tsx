import React from 'react';
import { motion } from 'motion/react';

const stats = [
  { label: 'Parking Zones', value: '12+' },
  { label: 'Smart Slots', value: '2,500+' },
  { label: 'Active Sensors', value: '850+' },
  { label: 'Time Saved', value: '25%' },
];

export default function Stats() {
  return (
    <section className="py-20 bg-surface-container-low px-8" id="Stats">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="p-8 bg-surface-container-lowest rounded-xl shadow-sm space-y-2 text-center"
          >
            <p className="text-4xl md:text-5xl font-headline font-extrabold text-primary">{stat.value}</p>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
