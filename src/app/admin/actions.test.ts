import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateReportStatus } from './actions';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Admin Actions', () => {
  const mockEq = vi.fn();
  const mockMaybeSingle = vi.fn();

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Default: from('admins').select(...).eq(...).maybeSingle()
    // Default: from('reports').update(...).eq(...)
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'admins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        };
      }
      if (table === 'reports') {
        return {
          update: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        };
      }
    });
  });

  describe('updateReportStatus', () => {
    it('throws if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        updateReportStatus('00000000-0000-0000-0000-000000000001', 'in_review')
      ).rejects.toThrow('Musíte být přihlášeni.');
    });

    it('throws if user is not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: null });

      await expect(
        updateReportStatus('00000000-0000-0000-0000-000000000001', 'in_review')
      ).rejects.toThrow('Přístup odepřen. Pouze administrátoři mohou měnit status hlášení.');
    });

    it('throws for invalid reportId UUID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });

      await expect(
        updateReportStatus('not-a-uuid', 'in_review')
      ).rejects.toThrow('Neplatné ID hlášení');
    });

    it('throws for invalid status value', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });

      await expect(
        updateReportStatus('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'invalid_status')
      ).rejects.toThrow('Neplatný status hlášení');
    });

    it('successfully updates status for a valid admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockEq.mockResolvedValue({ error: null });

      const result = await updateReportStatus(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'resolved'
      );

      expect(result).toEqual({ success: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });

    it('throws if Supabase update fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockEq.mockResolvedValue({ error: { message: 'DB error' } });

      await expect(
        updateReportStatus('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'in_review')
      ).rejects.toThrow('Nepodařilo se aktualizovat status hlášení.');
    });

    it.each([
      ['pending'],
      ['in_review'],
      ['resolved'],
      ['rejected'],
    ] as const)('accepts valid status "%s"', async (status) => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockEq.mockResolvedValue({ error: null });

      const result = await updateReportStatus(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status
      );

      expect(result).toEqual({ success: true });
    });
  });
});
