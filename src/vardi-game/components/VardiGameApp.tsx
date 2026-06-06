import { useMemo, useState } from 'react';

import { useGameProgress } from '../hooks/useGameProgress';
import { AVAILABLE_LETTERS, NAMES, normalizeLetter, splitNameIntoCells } from '../names';
import type { GameProgress } from '../types';
import { LetterPicker } from './LetterPicker';
import { NameRow } from './NameRow';

type VardiGameAppProps = {
  apiBaseUrl: string;
  authToken: string;
};

const MAX_SELECTED_LETTERS = 3;

const isNameComplete = (
  name: string,
  selectedLetters: string[],
  inputsForName: Record<string, string>,
): boolean => {
  const cells = splitNameIntoCells(name);
  return cells.every((cell) => {
    if (!cell.isLetter) {
      return true;
    }
    const target = normalizeLetter(cell.char);
    if (selectedLetters.includes(target)) {
      return true;
    }
    const value = inputsForName[cell.index];
    return Boolean(value) && normalizeLetter(value) === target;
  });
};

export function VardiGameApp({ apiBaseUrl, authToken }: VardiGameAppProps) {
  const { progress, isLoading, loadError, isSaving, saveError, updateProgress } = useGameProgress(
    apiBaseUrl,
    authToken,
  );
  const [draftLetters, setDraftLetters] = useState<string[]>([]);

  // Each row is tracked by its position in NAMES (a stable slot key), so two
  // participants who share the same name (e.g. two "Mārtiņš") never collide.
  const nameCells = useMemo(
    () => NAMES.map((name, index) => ({ name, slot: String(index), cells: splitNameIntoCells(name) })),
    [],
  );

  const completedSet = useMemo(
    () => new Set(progress.completedNames),
    [progress.completedNames],
  );

  const toggleDraftLetter = (letter: string) => {
    setDraftLetters((previous) => {
      if (previous.includes(letter)) {
        return previous.filter((item) => item !== letter);
      }
      if (previous.length >= MAX_SELECTED_LETTERS) {
        return previous;
      }
      return [...previous, letter];
    });
  };

  const confirmLetters = () => {
    if (draftLetters.length !== MAX_SELECTED_LETTERS) {
      return;
    }
    updateProgress((previous) => {
      const selectedLetters = draftLetters.map((letter) => normalizeLetter(letter));
      const autoCompleted = NAMES.map((_, index) => String(index)).filter((slot) =>
        isNameComplete(NAMES[Number(slot)], selectedLetters, previous.currentInputs[slot] ?? {}),
      );
      const completedNames = Array.from(
        new Set([...previous.completedNames, ...autoCompleted]),
      );
      return {
        ...previous,
        selectedLetters,
        lettersLocked: true,
        completedNames,
      } satisfies GameProgress;
    });
  };

  const handleCellChange = (slot: string, cellIndex: number, value: string) => {
    if (completedSet.has(slot)) {
      return;
    }
    updateProgress((previous) => {
      const slotInputs = { ...(previous.currentInputs[slot] ?? {}) };
      if (value) {
        slotInputs[cellIndex] = value;
      } else {
        delete slotInputs[cellIndex];
      }
      const currentInputs = { ...previous.currentInputs, [slot]: slotInputs };
      let completedNames = previous.completedNames;
      if (
        !completedNames.includes(slot) &&
        isNameComplete(NAMES[Number(slot)], previous.selectedLetters, slotInputs)
      ) {
        completedNames = [...completedNames, slot];
      }
      return { ...previous, currentInputs, completedNames } satisfies GameProgress;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-10 text-center text-slate-300">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-sky-300" />
        <p className="mt-4 text-sm uppercase tracking-[0.25em] text-slate-400">
          Ielādējam spēli...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center">
        <p className="text-sm text-rose-200">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full border border-rose-300/40 px-5 py-2 text-sm text-rose-100 transition hover:border-rose-200"
        >
          Mēģināt vēlreiz
        </button>
      </div>
    );
  }

  const completedCount = progress.completedNames.length;
  const totalCount = NAMES.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount >= totalCount && totalCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-white/5 bg-white/5 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Jauna spēle</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Vārdi</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Uzmini dalībnieku vārdus pa burtam. Tavs progress tiek automātiski saglabāts.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-emerald-300">
              {completedCount}
              <span className="text-base text-slate-400">/{totalCount}</span>
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">uzminēti</p>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
          <div
            className="h-2 rounded-full bg-emerald-300/80 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-3 flex h-4 items-center gap-2 text-xs text-slate-500">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300" />
              Saglabā...
            </span>
          ) : saveError ? (
            <span className="text-rose-300">{saveError}</span>
          ) : progress.lettersLocked ? (
            <span>Progress saglabāts</span>
          ) : null}
        </div>
      </div>

      {allDone ? (
        <div className="rounded-3xl border border-emerald-400/50 bg-emerald-400/10 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-200">Visi vārdi uzminēti!</p>
          <p className="mt-1 text-sm text-emerald-100/80">
            Tavs rezultāts ir saglabāts un parādīsies sadaļā Rezultāti — 4. uzdevums.
          </p>
        </div>
      ) : null}

      {!progress.lettersLocked ? (
        <LetterPicker
          availableLetters={AVAILABLE_LETTERS}
          selected={draftLetters}
          maxLetters={MAX_SELECTED_LETTERS}
          onToggle={toggleDraftLetter}
          onConfirm={confirmLetters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {nameCells.map(({ name, slot, cells }) => (
            <NameRow
              key={slot}
              name={name}
              cells={cells}
              selectedLetters={progress.selectedLetters}
              inputs={progress.currentInputs[slot] ?? {}}
              isCompleted={completedSet.has(slot)}
              onChange={(cellIndex, value) => handleCellChange(slot, cellIndex, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
