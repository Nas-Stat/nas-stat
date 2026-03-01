import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateReportStatus, deleteTopic, deleteComment } from './actions';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStatusChangeEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendStatusChangeEmail: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Admin Actions', () => {
  const mockMaybeSingle = vi.fn();
  const mockReportsEq = vi.fn();
  const mockDeleteEq = vi.fn();
  const mockReportsSelectSingle = vi.fn();
  const mockGetUserById = vi.fn();

  const mockAdminClient = {
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);
    vi.mocked(sendStatusChangeEmail).mockResolvedValue(undefined);

    // Default: email lookup returns no report → email silently skipped
    mockReportsSelectSingle.mockResolvedValue({ data: null });
    mockGetUserById.mockResolvedValue({ data: { user: null } });

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
            eq: mockReportsEq,
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockReportsSelectSingle,
            }),
          }),
        };
      }
      // votes, comments, topics — used by delete actions
      return {
        delete: vi.fn().mockReturnValue({
          eq: mockDeleteEq,
        }),
      };
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
      mockReportsEq.mockResolvedValue({ error: null });

      const result = await updateReportStatus(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'resolved'
      );

      expect(result).toEqual({ success: true });
      expect(mockReportsEq).toHaveBeenCalledWith('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });

    it('throws if Supabase update fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockReportsEq.mockResolvedValue({ error: { message: 'DB error' } });

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
      mockReportsEq.mockResolvedValue({ error: null });

      const result = await updateReportStatus(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status
      );

      expect(result).toEqual({ success: true });
    });

    describe('email notification', () => {
      const REPORT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      beforeEach(() => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'admin-1' } },
        });
        mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
        mockReportsEq.mockResolvedValue({ error: null });
      });

      it('sends email to report author when status update succeeds', async () => {
        mockReportsSelectSingle.mockResolvedValue({
          data: { title: 'Rozbité hřiště', profile_id: 'user-profile-id' },
        });
        mockGetUserById.mockResolvedValue({
          data: { user: { email: 'author@example.com' } },
        });

        await updateReportStatus(REPORT_ID, 'in_review');

        expect(sendStatusChangeEmail).toHaveBeenCalledWith(
          'author@example.com',
          'Rozbité hřiště',
          'in_review',
          REPORT_ID
        );
      });

      it('still returns success when report lookup returns null (email skipped)', async () => {
        mockReportsSelectSingle.mockResolvedValue({ data: null });

        const result = await updateReportStatus(REPORT_ID, 'resolved');

        expect(result).toEqual({ success: true });
        expect(sendStatusChangeEmail).not.toHaveBeenCalled();
      });

      it('still returns success when user email is not available', async () => {
        mockReportsSelectSingle.mockResolvedValue({
          data: { title: 'Test', profile_id: 'user-id' },
        });
        mockGetUserById.mockResolvedValue({ data: { user: { email: null } } });

        const result = await updateReportStatus(REPORT_ID, 'resolved');

        expect(result).toEqual({ success: true });
        expect(sendStatusChangeEmail).not.toHaveBeenCalled();
      });

      it('still returns success when email sending throws', async () => {
        mockReportsSelectSingle.mockResolvedValue({
          data: { title: 'Test', profile_id: 'user-id' },
        });
        mockGetUserById.mockResolvedValue({
          data: { user: { email: 'user@example.com' } },
        });
        vi.mocked(sendStatusChangeEmail).mockRejectedValue(new Error('SMTP error'));

        const result = await updateReportStatus(REPORT_ID, 'rejected');

        expect(result).toEqual({ success: true });
      });

      it('does not send email when status update itself fails', async () => {
        mockReportsEq.mockResolvedValue({ error: { message: 'DB error' } });

        await expect(updateReportStatus(REPORT_ID, 'in_review')).rejects.toThrow();
        expect(sendStatusChangeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteTopic', () => {
    it('throws if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Musíte být přihlášeni.');
    });

    it('throws if user is not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: null });

      await expect(
        deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Přístup odepřen.');
    });

    it('throws for invalid topicId UUID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });

      await expect(deleteTopic('not-a-uuid')).rejects.toThrow('Neplatné ID tématu');
    });

    it('throws if deleting votes fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      // First delete (votes) fails
      mockDeleteEq.mockResolvedValueOnce({ error: { message: 'votes error' } });

      await expect(
        deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Nepodařilo se smazat hlasy tématu.');
    });

    it('throws if deleting comments fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      // votes delete succeeds, comments delete fails
      mockDeleteEq
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: 'comments error' } });

      await expect(
        deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Nepodařilo se smazat komentáře tématu.');
    });

    it('throws if deleting topic itself fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      // votes + comments succeed, topic fails
      mockDeleteEq
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: 'topic error' } });

      await expect(
        deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Nepodařilo se smazat téma.');
    });

    it('successfully deletes topic with cascade for a valid admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockDeleteEq.mockResolvedValue({ error: null });

      const result = await deleteTopic('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual({ success: true });
      expect(mockDeleteEq).toHaveBeenCalledTimes(3); // votes, comments, topic
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });

  describe('deleteComment', () => {
    it('throws if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        deleteComment('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Musíte být přihlášeni.');
    });

    it('throws if user is not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: null });

      await expect(
        deleteComment('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Přístup odepřen.');
    });

    it('throws for invalid commentId UUID', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });

      await expect(deleteComment('not-a-uuid')).rejects.toThrow('Neplatné ID komentáře');
    });

    it('throws if Supabase delete fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockDeleteEq.mockResolvedValue({ error: { message: 'DB error' } });

      await expect(
        deleteComment('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      ).rejects.toThrow('Nepodařilo se smazat komentář.');
    });

    it('successfully deletes comment for a valid admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
      });
      mockMaybeSingle.mockResolvedValue({ data: { user_id: 'admin-1' } });
      mockDeleteEq.mockResolvedValue({ error: null });

      const result = await deleteComment('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

      expect(result).toEqual({ success: true });
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(revalidatePath).toHaveBeenCalledWith('/admin');
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });
});
