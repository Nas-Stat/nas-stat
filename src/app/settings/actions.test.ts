import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { updatePreferences } from './actions';
import { createClient } from '@/utils/supabase/server';

function makeClient(userId: string | null, dbError: object | null = null) {
  const mockEq = vi.fn().mockReturnValue({ error: dbError });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: mockFrom,
  } as never);

  return { mockEq, mockUpdate, mockFrom };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updatePreferences', () => {
  test('returns success for valid kraj preferences', async () => {
    makeClient('user-1');
    const result = await updatePreferences({
      territory_level: 'kraj',
      territories: ['Středočeský kraj'],
      categories: ['dopravni-infrastruktura'],
    });
    expect(result).toEqual({ success: true });
  });

  test('returns success for empty preferences (skip onboarding)', async () => {
    makeClient('user-1');
    const result = await updatePreferences({
      territory_level: '',
      territories: [],
      categories: [],
    });
    expect(result).toEqual({ success: true });
  });

  test('returns success for orp level', async () => {
    makeClient('user-1');
    const result = await updatePreferences({
      territory_level: 'orp',
      territories: ['Praha'],
      categories: ['bezpecnost', 'zivotni-prostredi'],
    });
    expect(result).toEqual({ success: true });
  });

  test('throws when not authenticated', async () => {
    makeClient(null);
    await expect(
      updatePreferences({ territory_level: '', territories: [], categories: [] }),
    ).rejects.toThrow('Musíte být přihlášeni.');
  });

  test('throws when DB update fails', async () => {
    makeClient('user-1', { message: 'DB error' });
    await expect(
      updatePreferences({ territory_level: 'kraj', territories: [], categories: [] }),
    ).rejects.toThrow('Nepodařilo se uložit nastavení.');
  });

  test('defaults missing fields to empty via Zod', async () => {
    makeClient('user-1');
    const result = await updatePreferences({} as never);
    expect(result).toEqual({ success: true });
  });
});
