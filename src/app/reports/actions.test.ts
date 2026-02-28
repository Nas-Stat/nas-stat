import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReport } from './actions';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Report Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  describe('createReport', () => {
    it('throws error if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const formData = new FormData();

      await expect(createReport(formData)).rejects.toThrow(
        'Musíte být přihlášeni pro vytvoření hlášení.'
      );
    });

    it('throws validation error for invalid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      const formData = new FormData();
      formData.append('title', 'Ab'); // Too short

      await expect(createReport(formData)).rejects.toThrow(
        'Název musí mít alespoň 3 znaky'
      );
    });

    it('successfully creates a report and revalidates', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.append('title', 'Díra v silnici');
      formData.append('description', 'Velká díra uprostřed ulice.');
      formData.append('rating', '1');
      formData.append('category', 'Doprava');
      formData.append('lng', '14.4378');
      formData.append('lat', '50.0755');

      const result = await createReport(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('reports');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        profile_id: 'user-123',
        title: 'Díra v silnici',
        description: 'Velká díra uprostřed ulice.',
        rating: 1,
        category: 'Doprava',
        location: 'POINT(14.4378 50.0755)',
        status: 'pending',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });

    it('throws error if Supabase insert fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSupabase.insert.mockResolvedValue({
        error: { message: 'Database error' },
      });

      const formData = new FormData();
      formData.append('title', 'Díra v silnici');
      formData.append('rating', '1');
      formData.append('category', 'Doprava');
      formData.append('lng', '14.4378');
      formData.append('lat', '50.0755');

      await expect(createReport(formData)).rejects.toThrow(
        'Nepodařilo se uložit hlášení.'
      );
    });
  });
});
