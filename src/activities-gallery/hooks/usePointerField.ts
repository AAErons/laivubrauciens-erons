import { useEffect } from 'react';
import { motionValue, type MotionValue } from 'framer-motion';

export function usePointerField(): { pointerX: MotionValue<number>; pointerY: MotionValue<number> } {
  const pointerX = motionValue(-10_000);
  const pointerY = motionValue(-10_000);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };

    const onLeave = () => {
      pointerX.set(-10_000);
      pointerY.set(-10_000);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [pointerX, pointerY]);

  return { pointerX, pointerY };
}
