import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "Since implementing the smart system, finding a spot for my morning lectures takes less than 2 minutes. The mobile notifications are a lifesaver.",
    author: "Minh Nguyen",
    role: "Computer Science Senior",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"
  },
  {
    quote: "The administrative dashboard provides insights we never had before. Managing traffic flow during campus events is now a data-driven process.",
    author: "Dr. Thao Le",
    role: "Campus Operations Director",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
  },
  {
    quote: "The automated NFC entry means no more queuing at the gate. It's the technical sophistication we expect from a school like Bach Khoa.",
    author: "Anh Tran",
    role: "Graduate Researcher",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 px-8 bg-surface-container-low" id="Reviews">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="max-w-xl space-y-4">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight">
              Voices of the <span className="text-gradient">Community</span>
            </h2>
            <p className="text-on-surface-variant font-medium">Hear from the people who keep Bach Khoa moving forward every single day.</p>
          </div>
          <div className="flex gap-2">
            <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
              <ChevronLeft size={24} />
            </button>
            <button className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-xl hover:shadow-blue-900/5 transition-all"
            >
              <div className="absolute -top-4 left-8 text-primary text-6xl opacity-10 font-serif group-hover:opacity-30 transition-opacity">“</div>
              <p className="text-on-surface-variant mb-8 leading-relaxed italic relative z-10 font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img 
                  alt={t.author} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/10" 
                  src={t.image}
                />
                <div>
                  <p className="font-bold text-slate-800">{t.author}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
