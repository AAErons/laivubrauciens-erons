import { AnimatePresence, motion } from 'framer-motion';

import type { ActivityPhoto } from '../types';

type ActivitiesLightboxProps = {
  photos: ActivityPhoto[];
  activeIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function ActivitiesLightbox({ photos, activeIndex, onClose, onNext, onPrev }: ActivitiesLightboxProps) {
  const photo = activeIndex !== null ? photos[activeIndex] : null;
  const dateLabel = photo
    ? new Date(photo.createdAt).toLocaleDateString('lv-LV', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <AnimatePresence>
      {photo ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
            aria-label="Aizvērt"
          />
          <motion.div
            className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/65 p-4 shadow-[0_40px_80px_rgba(0,0,0,0.55)] sm:p-6"
            initial={{ scale: 0.95, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 18 }}
            transition={{ type: 'spring', stiffness: 130, damping: 18 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <motion.img
                layoutId={`activity-photo-${photo.id}`}
                src={photo.url}
                alt={photo.category}
                className="max-h-[72vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">{photo.category}</p>
                <p className="text-sm text-slate-300">{dateLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  className="rounded-full border border-white/15 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 transition hover:border-white/30"
                >
                  ← Iepriekšējā
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-full border border-white/15 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 transition hover:border-white/30"
                >
                  Nākamā →
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/15 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 transition hover:border-white/30"
                >
                  Aizvērt
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
