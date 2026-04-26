import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts up from 0 to `value` when the element scrolls into view. Uses
 * motion's MotionValue + animate() under the hood so the count happens on the
 * GPU-friendly side of motion's render loop instead of via React re-renders
 * per frame. The number is formatted with locale grouping (so 2500 → "2,500").
 *
 * Triggers exactly once per page-load — `useInView({ once: true })` ensures
 * scrolling away and back doesn't restart the count.
 */
export default function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 1.8,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  // Round + format on each frame; React only re-renders this leaf node.
  const display = useTransform(motionValue, (latest) =>
    `${prefix}${Math.round(latest).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionValue, value, {
      duration,
      // Mirror the landing page's REVEAL_EASE so this counts up with the same
      // visual character as the surrounding entrance animations.
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [isInView, motionValue, value, duration]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
