import { useEffect, useMemo, useState } from 'react';

import { MOCK_ACTIVITY_PHOTOS } from '../mockData';
import type { ActivityPhoto } from '../types';

type PublicApiEntry = {
  url?: string;
  category?: string;
  createdAt?: string;
};

export function useActivitiesData(apiBaseUrl: string) {
  const [entries, setEntries] = useState<ActivityPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/selfie/public`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load');
        }
        const data = (await response.json()) as { entries?: PublicApiEntry[] };
        const normalized = (data.entries ?? [])
          .filter((entry) => Boolean(entry.url))
          .map((entry, index) => ({
            id: `${entry.createdAt ?? 'activity'}-${index}`,
            url: entry.url as string,
            category: entry.category?.trim() || 'Aktivitāte',
            createdAt: entry.createdAt ?? new Date().toISOString(),
          }));

        if (cancelled) {
          return;
        }
        if (!normalized.length) {
          setEntries(MOCK_ACTIVITY_PHOTOS);
          setIsMockData(true);
        } else {
          setEntries(normalized);
          setIsMockData(false);
        }
      } catch {
        if (cancelled) {
          return;
        }
        // Keep the gallery visually testable even if API is unavailable.
        setEntries(MOCK_ACTIVITY_PHOTOS);
        setIsMockData(true);
        setError('Neizdevās ielādēt aktivitāšu foto no servera, parādām demonstrācijas galeriju.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  );

  return { entries: sortedEntries, isLoading, error, isMockData };
}
