import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max tilt angle in degrees on each axis. Default 8°. */
  maxTilt?: number;
  /** Lift on hover (px). Combined with the 3D tilt for a "rising-toward-cursor" feel. */
  lift?: number;
}

/**
 * Wrapper that gives its children a 3D tilt + lift toward the cursor on hover.
 * Uses spring-smoothed MotionValues so the motion feels physical, not jittery,
 * and ensures the tilt eases back to neutral when the cursor leaves.
 *
 * Pure-transform implementation — no layout thrash, GPU-accelerated, and the
 * children's own hover styles (e.g. group-hover) keep working untouched.
 */
const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(function TiltCard(
  { children, className, style, maxTilt = 8, lift = 8, onMouseMove, onMouseLeave, ...rest },
  forwardedRef,
) {
  // Cursor position, normalized to [-0.5, 0.5] within the card so the math is
  // symmetric around the center.
  const xNorm = useMotionValue(0);
  const yNorm = useMotionValue(0);

  // Springs smooth the raw cursor signal so quick mouse jiggles don't make the
  // card vibrate. stiffness/damping are tuned to feel responsive but settled.
  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const xSpring = useSpring(xNorm, springConfig);
  const ySpring = useSpring(yNorm, springConfig);

  // Map normalized cursor to rotation. We negate the y-axis mapping because in
  // 3D, tilting "up" toward the top of the card means a negative rotateX.
  const rotateX = useTransform(ySpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    xNorm.set((e.clientX - rect.left) / rect.width - 0.5);
    yNorm.set((e.clientY - rect.top) / rect.height - 0.5);
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    xNorm.set(0);
    yNorm.set(0);
    onMouseLeave?.(e);
  };

  return (
    <motion.div
      ref={forwardedRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -lift }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
        ...style,
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

export default TiltCard;
