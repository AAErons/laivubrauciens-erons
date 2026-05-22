import { useAnimationFrame, useMotionValue, useSpring, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import type { RefObject } from 'react';

const EFFECT_RADIUS = 220;
const MAX_SHIFT = 12;

export function useCardRepulsion(
  cardRef: RefObject<HTMLElement | null>,
  pointerX: MotionValue<number>,
  pointerY: MotionValue<number>,
) {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 120, damping: 20, mass: 0.8 });
  const y = useSpring(targetY, { stiffness: 120, damping: 20, mass: 0.8 });
  const cachedBounds = useRef<DOMRect | null>(null);
  const frameCounter = useRef(0);

  useAnimationFrame(() => {
    frameCounter.current += 1;
    const node = cardRef.current;
    if (!node) {
      return;
    }

    if (!cachedBounds.current || frameCounter.current % 14 === 0) {
      cachedBounds.current = node.getBoundingClientRect();
    }
    const bounds = cachedBounds.current;
    if (!bounds) {
      return;
    }

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const diffX = centerX - pointerX.get();
    const diffY = centerY - pointerY.get();
    const distance = Math.hypot(diffX, diffY);

    if (distance > EFFECT_RADIUS || distance === 0) {
      targetX.set(0);
      targetY.set(0);
      return;
    }

    const force = (EFFECT_RADIUS - distance) / EFFECT_RADIUS;
    const shift = force * MAX_SHIFT;
    targetX.set((diffX / distance) * shift);
    targetY.set((diffY / distance) * shift);
  });

  return { x, y };
}
