import type { ActivityPhoto } from './types';

const MOCK_CATEGORIES = [
  'Pārgājiens',
  'Riteņbrauciens',
  'Skriešana',
  'SUPošana',
  'Joga',
  'Kempings',
  'Pastaiga',
  'Sporta spēles',
];

export const MOCK_ACTIVITY_PHOTOS: ActivityPhoto[] = Array.from({ length: 50 }).map((_, index) => {
  const day = (index % 28) + 1;
  const month = index < 25 ? 4 : 5;
  const seed = `boat-${index + 1}`;
  return {
    id: `mock-${index + 1}`,
    url: `https://picsum.photos/seed/${seed}/900/1100`,
    category: MOCK_CATEGORIES[index % MOCK_CATEGORIES.length] ?? 'Aktivitāte',
    createdAt: new Date(2026, month, day, 9 + (index % 8), (index * 7) % 60).toISOString(),
  };
});
