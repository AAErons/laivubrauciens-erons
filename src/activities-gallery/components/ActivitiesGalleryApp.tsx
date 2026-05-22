import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useActivitiesData } from '../hooks/useActivitiesData';
import { usePointerField } from '../hooks/usePointerField';
import { ActivityCard } from './ActivityCard';
import { ActivitiesLightbox } from './ActivitiesLightbox';

type ActivitiesGalleryAppProps = {
  apiBaseUrl: string;
};

export function ActivitiesGalleryApp({ apiBaseUrl }: ActivitiesGalleryAppProps) {
  const { entries, isLoading, error, isMockData } = useActivitiesData(apiBaseUrl);
  const { pointerX, pointerY } = usePointerField();
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        id: `particle-${index}`,
        left: (index * 17) % 100,
        delay: (index % 7) * 0.6,
        duration: 8 + (index % 5) * 1.3,
      })),
    [],
  );

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
      } else if (event.key === 'ArrowRight') {
        setActiveIndex((previous) => {
          if (previous === null || !entries.length) {
            return previous;
          }
          return (previous + 1) % entries.length;
        });
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((previous) => {
          if (previous === null || !entries.length) {
            return previous;
          }
          return (previous - 1 + entries.length) % entries.length;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, entries.length]);

  const openPhoto = (index: number) => setActiveIndex(index);
  const closeLightbox = () => setActiveIndex(null);
  const nextPhoto = () =>
    setActiveIndex((previous) => {
      if (previous === null || !entries.length) {
        return previous;
      }
      return (previous + 1) % entries.length;
    });
  const prevPhoto = () =>
    setActiveIndex((previous) => {
      if (previous === null || !entries.length) {
        return previous;
      }
      return (previous - 1 + entries.length) % entries.length;
    });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-500/20 bg-gradient-to-br from-[#0d1a2f] via-[#111f38] to-[#060c18] p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(209,167,86,0.1),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(51,95,168,0.22),transparent_46%),radial-gradient(circle_at_90%_80%,rgba(171,127,66,0.16),transparent_42%)]" />
        <div className="gallery-noise absolute inset-0 opacity-25" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.66)]" />
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute top-full h-[2px] w-[2px] rounded-full bg-amber-200/50"
            style={{ left: `${particle.left}%` }}
            animate={{ y: [-8, -520], opacity: [0, 0.6, 0] }}
            transition={{
              duration: particle.duration,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-slate-800/40 p-2"
              >
                <div className="aspect-[4/5] animate-pulse rounded-lg bg-slate-700/60" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-700/50" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-6 text-center text-slate-200">
            Pašlaik nav pieejamu aktivitāšu foto.
          </div>
        ) : (
          <>
            {error ? (
              <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                {error}
              </p>
            ) : null}
            {isMockData ? (
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-amber-100/70">Demo režīms</p>
            ) : null}
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
              {entries.map((entry, index) => (
                <ActivityCard
                  key={entry.id}
                  photo={entry}
                  index={index}
                  activeIndex={activeHoverIndex}
                  pointerX={pointerX}
                  pointerY={pointerY}
                  onHover={setActiveHoverIndex}
                  onOpen={openPhoto}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <ActivitiesLightbox
        photos={entries}
        activeIndex={activeIndex}
        onClose={closeLightbox}
        onNext={nextPhoto}
        onPrev={prevPhoto}
      />
    </div>
  );
}
