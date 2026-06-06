import { useCallback, useEffect, useRef, useState } from 'react';

import type { GameProgress } from '../types';

const EMPTY_PROGRESS: GameProgress = {
  selectedLetters: [],
  lettersLocked: false,
  completedNames: [],
  currentInputs: {},
  completedAt: null,
};

const SAVE_DEBOUNCE_MS = 700;

type UseGameProgressResult = {
  progress: GameProgress;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  /** Update local progress and schedule a debounced persist to the server. */
  updateProgress: (updater: (previous: GameProgress) => GameProgress) => void;
};

const normalizeProgress = (raw: Partial<GameProgress> | null | undefined): GameProgress => ({
  selectedLetters: Array.isArray(raw?.selectedLetters) ? raw!.selectedLetters : [],
  lettersLocked: Boolean(raw?.lettersLocked),
  completedNames: Array.isArray(raw?.completedNames) ? raw!.completedNames : [],
  currentInputs:
    raw?.currentInputs && typeof raw.currentInputs === 'object' ? raw.currentInputs : {},
  completedAt: typeof raw?.completedAt === 'string' ? raw.completedAt : null,
});

export function useGameProgress(apiBaseUrl: string, authToken: string): UseGameProgressResult {
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hasLoaded.current = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/game-progress`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to load');
        }
        const data = (await response.json()) as Partial<GameProgress>;
        if (cancelled) {
          return;
        }
        setProgress(normalizeProgress(data));
      } catch {
        if (!cancelled) {
          setLoadError('Neizdevās ielādēt spēles progresu. Lūdzu, mēģini vēlreiz.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          hasLoaded.current = true;
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [apiBaseUrl, authToken]);

  const persist = useCallback(
    async (next: GameProgress) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/game-progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(next),
        });
        if (!response.ok) {
          throw new Error('Failed to save');
        }
      } catch {
        setSaveError('Neizdevās saglabāt progresu.');
      } finally {
        setIsSaving(false);
      }
    },
    [apiBaseUrl, authToken],
  );

  const updateProgress = useCallback(
    (updater: (previous: GameProgress) => GameProgress) => {
      setProgress((previous) => {
        const next = updater(previous);
        if (hasLoaded.current) {
          if (saveTimer.current) {
            clearTimeout(saveTimer.current);
          }
          saveTimer.current = setTimeout(() => {
            void persist(next);
          }, SAVE_DEBOUNCE_MS);
        }
        return next;
      });
    },
    [persist],
  );

  return { progress, isLoading, loadError, isSaving, saveError, updateProgress };
}
