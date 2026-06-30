import React, { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number; // in seconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  className = '',
  duration = 1.0,
  prefix = '',
  suffix = '',
  decimals = 0
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    // Animate from 0 (or current value) to the target value
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1], // premium custom cubic-bezier
    });

    // Directly update textContent at 60fps, bypassing React render ticks
    const unsubscribe = motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={`${className} tabular-nums`} id={`animated-counter-${Math.random().toString(36).substring(2, 6)}`}>
      {prefix}0{suffix}
    </span>
  );
}
