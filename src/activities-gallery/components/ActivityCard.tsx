import { memo, useMemo, useRef } from 'react';
import { motion, type MotionValue } from 'framer-motion';

import { useCardRepulsion } from '../hooks/useCardRepulsion';
import type { ActivityPhoto } from '../types';

type ActivityCardProps = {
  photo: ActivityPhoto;
  index: number;
  activeIndex: number | null;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  onHover: (index: number | null) => void;
  onOpen: (index: number) => void;
};

export const ActivityCard = memo(function ActivityCard({
  photo,
  index,
  activeIndex,
  pointerX,
  pointerY,
  onHover,
  onOpen,
}: ActivityCardProps) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const { x, y } = useCardRepulsion(cardRef, pointerX, pointerY);

  const baseRotation = useMemo(() => ((index * 17) % 9) - 4, [index]);
  const idleDuration = useMemo(() => 9 + (index % 5), [index]);
  const isNeighbor = activeIndex !== null && activeIndex !== index && Math.abs(activeIndex - index) <= 2;
  const cardHeightClass = index % 7 === 0 ? 'aspect-[4/6]' : index % 5 === 0 ? 'aspect-[5/6]' : 'aspect-[4/5]';
  const dateLabel = new Date(photo.createdAt).toLocaleDateString('lv-LV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      className="mb-4 break-inside-avoid"
      initial={{ opacity: 0, y: 36, rotate: baseRotation - 10 }}
      animate={{ opacity: 1, y: 0, rotate: baseRotation }}
      transition={{ delay: (index % 12) * 0.035, type: 'spring', stiffness: 95, damping: 18 }}
      style={{ x, y }}
    >
      <motion.button
        ref={cardRef}
        type="button"
        onClick={() => onOpen(index)}
        onHoverStart={() => onHover(index)}
        onHoverEnd={() => onHover(null)}
        className="group relative w-full origin-center overflow-hidden rounded-[1.1rem] border border-amber-100/20 bg-[#f9f3e7] p-2 text-left shadow-[0_18px_50px_rgba(0,0,0,0.34)]"
        whileHover={{
          scale: 1.03,
          zIndex: 70,
          boxShadow: '0 26px 60px rgba(0,0,0,0.48)',
          rotate: baseRotation * 0.35,
        }}
        animate={{
          rotate: isNeighbor ? baseRotation * 0.65 : baseRotation,
          y: [0, -2, 1, 0],
        }}
        transition={{
          y: { repeat: Infinity, repeatType: 'mirror', duration: idleDuration, ease: 'easeInOut' },
          rotate: { type: 'spring', stiffness: 90, damping: 16 },
        }}
      >
        <div className="pointer-events-none absolute left-4 top-2 h-2 w-14 rotate-[-8deg] rounded-sm bg-amber-100/55 blur-[0.4px]" />
        <div className={`relative overflow-hidden rounded-lg bg-slate-900 ${cardHeightClass}`}>
          <motion.img
            layoutId={`activity-photo-${photo.id}`}
            src={photo.url}
            alt={photo.category}
            loading="lazy"
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.07 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent px-3 pb-2 pt-12">
            <p className="truncate text-sm font-medium tracking-wide text-slate-100">{photo.category}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-1.5 pb-0.5 pt-2">
          <p className="text-[11px] italic tracking-wide text-[#4c3f2c]">{dateLabel}</p>
          <span className="rounded-full border border-amber-900/25 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.14em] text-[#7c5f2f]">
            apstiprināts
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
});
