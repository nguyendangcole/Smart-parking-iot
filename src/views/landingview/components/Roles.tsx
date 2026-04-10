import React from 'react';
import { motion } from 'motion/react';
import { Globe, GraduationCap, Settings, ShieldCheck } from 'lucide-react';

const roles = [
  {
    title: 'Visitors',
    description: 'Instant entry for campus guests with QR-based payments and real-time navigation.',
    icon: Globe,
  },
  {
    title: 'Members',
    description: 'Students and Faculty enjoy priority zones, digital permits, and monthly billing.',
    icon: GraduationCap,
  },
  {
    title: 'Operators',
    description: 'Monitor gate status, manage occupancy, and respond to incidents in real-time.',
    icon: Settings,
  },
  {
    title: 'Administrators',
    description: 'Data-driven insights, revenue analytics, and system-wide policy management.',
    icon: ShieldCheck,
  },
];

export default function Roles() {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto" id="Roles">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
          Tailored for <span className="text-gradient">Bach Khoa Community</span>
        </h2>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
          One unified platform serving every stakeholder in the HCMUT ecosystem with precision and security.
        </p>
      </div>
      <div className="grid md:grid-cols-4 gap-6">
        {roles.map((role, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group bg-surface-container-lowest p-8 rounded-3xl hover:bg-primary transition-all duration-500 hover:-translate-y-4 shadow-sm hover:shadow-2xl hover:shadow-primary/20"
          >
            <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-8 group-hover:bg-white/20 transition-colors">
              <role.icon size={30} className="text-primary group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-headline font-bold mb-4 group-hover:text-white">{role.title}</h3>
            <p className="text-on-surface-variant group-hover:text-white/80 leading-relaxed text-sm">{role.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
