import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { REVEAL_VIEWPORT, fadeLeft, fadeRight, staggerParent } from '../animations';

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
  },
  {
    quote: "Knowing Khu B has open slots before I even leave home changed my entire commute. I save almost fifteen minutes every single morning.",
    author: "Linh Pham",
    role: "Chemical Engineering Junior",
    image: "https://i.pravatar.cc/200?img=47"
  },
  {
    quote: "Less time circling for parking means more time in the lab. Small change, but the cumulative effect on faculty productivity is genuinely real.",
    author: "Prof. Hieu Vo",
    role: "Faculty, Electronics Department",
    image: "https://i.pravatar.cc/200?img=12"
  },
  {
    quote: "Audit logs and gate override controls give my team confidence. We can investigate any incident with full evidence trail in seconds, not hours.",
    author: "Quang Bui",
    role: "Security Operations Lead",
    image: "https://i.pravatar.cc/200?img=33"
  },
  {
    quote: "I'm only on campus for a semester, but the visitor pass flow felt as smooth as anywhere I've worked in Singapore or Tokyo. Impressed.",
    author: "Mai Tran",
    role: "Visiting Scholar",
    image: "https://i.pravatar.cc/200?img=44"
  },
  {
    quote: "The monthly student plan is a no-brainer. I top up once and forget about it — no more digging for cash or QR codes at the booth.",
    author: "Khoa Le",
    role: "Mechanical Engineering Sophomore",
    image: "https://i.pravatar.cc/200?img=68"
  },
  {
    quote: "Uptime has been incredible since rollout. We've held 99.97% over the last quarter — better than half the systems we run on campus.",
    author: "Nguyen Hoang",
    role: "IT Infrastructure Manager",
    image: "https://i.pravatar.cc/200?img=59"
  }
];

// Carousel transitions are direction-aware: a "next" click slides the new page
// in from the right and the old one out to the left; "prev" mirrors it. Using
// motion variants with a `custom` prop is the canonical way to flip those signs
// without duplicating the variant definitions.
const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -direction * 60 }),
};

const CARDS_PER_VIEW = 3;

export default function Testimonials() {
  const [startIndex, setStartIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = testimonials.length;

  const handlePrev = () => {
    setDirection(-1);
    setStartIndex((i) => (i - 1 + total) % total);
  };

  const handleNext = () => {
    setDirection(1);
    setStartIndex((i) => (i + 1) % total);
  };

  const jumpTo = (i: number) => {
    if (i === startIndex) return;
    setDirection(i > startIndex ? 1 : -1);
    setStartIndex(i);
  };

  // Always render exactly CARDS_PER_VIEW items. Modulo wraps the tail of the
  // array back to the head so the carousel is effectively infinite — users
  // never bottom out on a half-empty page even when total isn't a multiple
  // of CARDS_PER_VIEW.
  const visible = Array.from({ length: CARDS_PER_VIEW }, (_, i) => ({
    ...testimonials[(startIndex + i) % total],
    slot: i,
  }));

  return (
    <section className="py-24 px-8 bg-surface-container-low scroll-mt-24" id="Testimonials">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={REVEAL_VIEWPORT}
          variants={staggerParent(0, 0.1)}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
        >
          <motion.div variants={fadeRight} className="max-w-xl space-y-4">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight">
              Voices of the <span className="text-gradient">Community</span>
            </h2>
            <p className="text-on-surface-variant font-medium">Hear from the people who keep Bach Khoa moving forward every single day.</p>
          </motion.div>
          <motion.div variants={fadeLeft} className="flex items-center gap-4">
            <p className="text-sm font-bold text-slate-500 tabular-nums hidden sm:block">
              <span className="text-slate-900">{String(startIndex + 1).padStart(2, '0')}</span>
              <span className="text-slate-300"> / {String(total).padStart(2, '0')}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next testimonial"
                className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/*
          overflow-x-clip clips horizontal slide-in/out while letting overflow-y
          stay visible — so the decorative quote glyph can extend above the card
          border without being cropped. Mixing overflow-x:hidden with
          overflow-y:visible would normalize both axes to auto, hence "clip".
          pt-8 gives the upward-peeking glyph room to render inside the
          wrapper's box rather than hanging entirely above it.
        */}
        <div className="relative overflow-x-clip pt-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={startIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid md:grid-cols-3 gap-8"
            >
              {visible.map((t) => (
                <div
                  key={`${startIndex}-${t.slot}`}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-xl hover:shadow-blue-900/5 transition-all"
                >
                  <div className="absolute -top-4 left-8 text-primary text-6xl leading-none opacity-10 font-serif select-none pointer-events-none group-hover:opacity-30 transition-opacity">“</div>
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
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === startIndex
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
