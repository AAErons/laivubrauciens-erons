import { useEffect, useMemo, useState } from 'react';

import type { ActivityPhoto } from '../types';

type PublicApiEntry = {
  id?: string;
  url?: string;
  category?: string;
  createdAt?: string;
};

export function useActivitiesData(apiBaseUrl: string) {
  const [entries, setEntries] = useState<ActivityPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBaseUrl}/selfie/public/today`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load');
        }
        const data = (await response.json()) as { entries?: PublicApiEntry[] };
        const normalized = (data.entries ?? [])
          .filter((entry) => Boolean(entry.url))
          .map((entry, index) => ({
            id: entry.id?.trim() || `${entry.createdAt ?? 'activity'}-${index}`,
            url: entry.url as string,
            category: entry.category?.trim() || 'Aktivitāte',
            createdAt: entry.createdAt ?? new Date().toISOString(),
          }));

        if (cancelled) {
          return;
        }
        setEntries(normalized);
      } catch {
        if (cancelled) {
          return;
        }
        setEntries([]);
        setError('Neizdevās ielādēt aktivitāšu foto no servera.');
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

  return { entries: sortedEntries, isLoading, error };
}
