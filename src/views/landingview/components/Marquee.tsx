import React from 'react';
import {
  Cpu,
  Cloud,
  Radio,
  ScanLine,
  Wifi,
  Lock,
  CircleDot,
  ShieldCheck,
  Activity,
  Zap,
} from 'lucide-react';

interface MarqueeItem {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const TICKER_ITEMS: MarqueeItem[] = [
  { label: 'Real-Time IoT', Icon: Radio },
  { label: 'AI License Plate Recognition', Icon: ScanLine },
  { label: 'NFC Access Control', Icon: Lock },
  { label: 'Cloud Sync', Icon: Cloud },
  { label: '99.9% Uptime', Icon: Activity },
  { label: 'Edge Computing', Icon: Cpu },
  { label: 'Encrypted Channels', Icon: ShieldCheck },
  { label: 'Wireless Mesh', Icon: Wifi },
  { label: 'Smart Sensors', Icon: CircleDot },
  { label: 'Instant Updates', Icon: Zap },
];

/**
 * Infinite horizontal ticker. The track is duplicated and animated from
 * translateX(0) to translateX(-50%) — the seam where copy A ends and copy B
 * begins is invisible because their content is identical, producing a
 * seamless loop. Hovering the strip pauses the animation so users can read.
 *
 * The `animate-marquee-fast` utility + `marquee-fast` keyframes are already
 * defined in src/index.css from previous work; we re-use them here.
 */
export default function Marquee() {
  return (
    <div className="relative overflow-hidden bg-primary text-on-primary py-4 group">
      {/* soft fade masks at each edge so items appear to dissolve in/out */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-primary to-transparent z-10" />

      <div
        className="flex gap-12 whitespace-nowrap animate-marquee-fast group-hover:[animation-play-state:paused]"
        // ARIA: present this as a static list to screen readers — the visual
        // animation is purely decorative.
        role="list"
        aria-label="Platform capabilities"
      >
        {/*
          Render the items twice. The first copy is what the user reads; the
          second copy seamlessly back-fills the viewport as the first scrolls
          off, completing the infinite loop.
        */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-12 shrink-0" aria-hidden={copy === 1}>
            {TICKER_ITEMS.map(({ label, Icon }, i) => (
              <span
                key={`${copy}-${i}`}
                role="listitem"
                className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em]"
              >
                <Icon size={16} className="text-accent-cyan shrink-0" />
                {label}
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
