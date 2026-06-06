import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { NameCell } from '../types';
import { normalizeLetter } from '../names';

type NameRowProps = {
  name: string;
  cells: NameCell[];
  selectedLetters: string[];
  inputs: Record<string, string>;
  isCompleted: boolean;
  onChange: (cellIndex: number, value: string) => void;
};

type CellStatus = 'green' | 'yellow' | 'absent';

/**
 * Wordle-style scoring, computed only once every letter of the name is filled.
 * Returns null while the word is incomplete so partial typing stays neutral.
 */
const computeFeedback = (
  cells: NameCell[],
  selectedLetters: string[],
  inputs: Record<string, string>,
): Map<number, CellStatus> | null => {
  const letterCells = cells.filter((cell) => cell.isLetter);
  const targets = letterCells.map((cell) => normalizeLetter(cell.char));
  const guesses = letterCells.map((cell) => {
    const target = normalizeLetter(cell.char);
    if (selectedLetters.includes(target)) {
      return target;
    }
    return normalizeLetter(inputs[cell.index] ?? '');
  });

  if (guesses.some((guess) => !guess)) {
    return null;
  }

  const counts = new Map<string, number>();
  targets.forEach((target) => counts.set(target, (counts.get(target) ?? 0) + 1));

  const statuses: CellStatus[] = letterCells.map(() => 'absent');
  letterCells.forEach((_, index) => {
    if (guesses[index] === targets[index]) {
      statuses[index] = 'green';
      counts.set(guesses[index], (counts.get(guesses[index]) ?? 0) - 1);
    }
  });
  letterCells.forEach((_, index) => {
    if (statuses[index] === 'green') {
      return;
    }
    const remaining = counts.get(guesses[index]) ?? 0;
    if (remaining > 0) {
      statuses[index] = 'yellow';
      counts.set(guesses[index], remaining - 1);
    }
  });

  const map = new Map<number, CellStatus>();
  letterCells.forEach((cell, index) => map.set(cell.index, statuses[index]));
  return map;
};

const statusBoxClass = (status: CellStatus): string => {
  if (status === 'green') {
    return 'border-emerald-400/70 bg-emerald-400/20 text-emerald-50 focus:ring-emerald-300/30';
  }
  if (status === 'yellow') {
    return 'border-amber-400/70 bg-amber-400/20 text-amber-50 focus:ring-amber-300/30';
  }
  return 'border-white/10 bg-slate-800/70 text-slate-300 focus:ring-slate-300/20';
};

export function NameRow({
  name,
  cells,
  selectedLetters,
  inputs,
  isCompleted,
  onChange,
}: NameRowProps) {
  // Refs for the editable letter cells, kept in left-to-right order so we can
  // auto-advance focus as the player types.
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  let inputOrder = -1;

  // Feedback appears only when the whole word is filled but not yet correct.
  const feedback = isCompleted ? null : computeFeedback(cells, selectedLetters, inputs);

  const focusSibling = (order: number, direction: 1 | -1) => {
    const target = inputRefs.current[order + direction];
    if (target) {
      target.focus();
      target.select();
    }
  };

  return (
    <motion.div
      layout
      animate={
        isCompleted
          ? { scale: [1, 1.04, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-colors duration-300 sm:px-4 ${
        isCompleted
          ? 'border-emerald-400/70 bg-emerald-400/15 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
          : 'border-white/10 bg-slate-950/40'
      }`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {cells.map((cell) => {
          if (!cell.isLetter) {
            // Spaces render as a gap; punctuation (e.g. the dot in "F.") shows as-is.
            if (cell.char.trim() === '') {
              return <span key={cell.index} className="w-2" aria-hidden="true" />;
            }
            return (
              <span
                key={cell.index}
                className="px-0.5 text-lg font-medium text-slate-300"
                aria-hidden="true"
              >
                {cell.char}
              </span>
            );
          }

          const target = normalizeLetter(cell.char);
          const isRevealed = selectedLetters.includes(target);

          if (isRevealed || isCompleted) {
            const display = isRevealed ? target : normalizeLetter(inputs[cell.index] ?? cell.char);
            // Revealed letters are correct, so they turn green while feedback shows.
            const revealedClass =
              isCompleted || feedback
                ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-50'
                : 'border-sky-400/40 bg-sky-400/10 text-sky-100';
            return (
              <span
                key={cell.index}
                className={`flex h-9 w-8 items-center justify-center rounded-md border text-base font-semibold uppercase sm:h-10 sm:w-9 ${revealedClass}`}
              >
                {display}
              </span>
            );
          }

          inputOrder += 1;
          const order = inputOrder;
          const status = feedback?.get(cell.index) ?? null;
          const inputClass = status
            ? statusBoxClass(status)
            : 'border-white/15 bg-slate-900/70 text-slate-50 caret-sky-300 focus:border-sky-400/70 focus:bg-slate-900 focus:ring-sky-400/30';
          return (
            <input
              key={cell.index}
              ref={(element) => {
                inputRefs.current[order] = element;
              }}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={1}
              value={normalizeLetter(inputs[cell.index] ?? '')}
              aria-label={`${name} burts ${cell.index + 1}`}
              onChange={(event) => {
                const raw = event.target.value;
                const lastChar = raw ? Array.from(raw).pop() ?? '' : '';
                const normalized = normalizeLetter(lastChar);
                onChange(cell.index, normalized);
                if (normalized) {
                  focusSibling(order, 1);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !(inputs[cell.index] ?? '')) {
                  focusSibling(order, -1);
                }
              }}
              className={`h-9 w-8 rounded-md border text-center text-base font-semibold uppercase outline-none transition focus:ring-2 sm:h-10 sm:w-9 ${inputClass}`}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {isCompleted ? (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-950"
            aria-label="Pareizi"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.3a1 1 0 0 1-1.42.005l-3.8-3.8a1 1 0 1 1 1.414-1.414l3.09 3.09 6.494-6.59a1 1 0 0 1 1.416-.006Z"
                clipRule="evenodd"
              />
            </svg>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
