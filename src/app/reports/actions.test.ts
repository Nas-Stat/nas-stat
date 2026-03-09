import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReport, claimReport, escalateReport, resolveReport, rejectReport } from './actions';
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

  const mockSupabaseOfficial = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

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

    it('successfully creates a report with location and revalidates', async () => {
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

    it('successfully creates a report without location', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.append('title', 'Celostátní téma');
      formData.append('rating', '3');
      formData.append('category', 'Jiné');
      // No lng/lat appended

      const result = await createReport(formData);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ location: null })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });

    it('throws validation error when only lng is provided without lat', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const formData = new FormData();
      formData.append('title', 'Díra v silnici');
      formData.append('rating', '1');
      formData.append('category', 'Doprava');
      formData.append('lng', '14.4378');
      // lat intentionally omitted

      await expect(createReport(formData)).rejects.toThrow(
        'Musíte zadat obě souřadnice, nebo žádnou.'
      );
    });

    it('throws validation error when only lat is provided without lng', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const formData = new FormData();
      formData.append('title', 'Díra v silnici');
      formData.append('rating', '1');
      formData.append('category', 'Doprava');
      formData.append('lat', '50.0755');
      // lng intentionally omitted

      await expect(createReport(formData)).rejects.toThrow(
        'Musíte zadat obě souřadnice, nebo žádnou.'
      );
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

    it('throws error if Supabase insert fails for report without location', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mockSupabase.insert.mockResolvedValue({
        error: { message: 'Database error' },
      });

      const formData = new FormData();
      formData.append('title', 'Celostátní podnět');
      formData.append('rating', '2');
      formData.append('category', 'Úřad');

      await expect(createReport(formData)).rejects.toThrow(
        'Nepodařilo se uložit hlášení.'
      );
    });
  });

  // Helper: build a chain mock for .from().select().eq().single()
  function makeChain(result: unknown) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(result),
    };
    return chain;
  }

  function setupOfficial(userId: string, role: string, roleVerified: boolean) {
    mockSupabaseOfficial.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
    });
    vi.mocked(createClient).mockResolvedValue(mockSupabaseOfficial as never);
  }

  describe('claimReport', () => {
    it('throws if user not logged in', async () => {
      mockSupabaseOfficial.auth.getUser.mockResolvedValue({ data: { user: null } });
      vi.mocked(createClient).mockResolvedValue(mockSupabaseOfficial as never);
      await expect(claimReport('r1')).rejects.toThrow('Musíte být přihlášeni.');
    });

    it('throws if user role is citizen', async () => {
      setupOfficial('u1', 'citizen', false);
      const profileChain = makeChain({ data: { id: 'u1', role: 'citizen', role_verified: true }, error: null });
      mockSupabaseOfficial.from.mockReturnValue(profileChain);
      await expect(claimReport('r1')).rejects.toThrow('Nemáte oprávnění k této akci.');
    });

    it('throws if role_verified is false', async () => {
      setupOfficial('u1', 'obec', false);
      const profileChain = makeChain({ data: { id: 'u1', role: 'obec', role_verified: false }, error: null });
      mockSupabaseOfficial.from.mockReturnValue(profileChain);
      await expect(claimReport('r1')).rejects.toThrow('Nemáte oprávnění k této akci.');
    });

    it('throws if report status is not pending or escalated', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        }
        return makeChain({ data: { status: 'in_review', escalated_to_role: null }, error: null });
      });
      await expect(claimReport('r1')).rejects.toThrow('Hlášení nelze převzít v tomto stavu.');
    });

    it('throws if escalated but wrong role', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        }
        return makeChain({ data: { status: 'escalated', escalated_to_role: 'kraj' }, error: null });
      });
      await expect(claimReport('r1')).rejects.toThrow('Toto hlášení není eskalováno na vaši roli.');
    });

    it('claims a pending report successfully', async () => {
      setupOfficial('u1', 'obec', true);
      const updateChain = { ...makeChain(null), update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        if (callCount === 2) return makeChain({ data: { status: 'pending', escalated_to_role: null }, error: null });
        return updateChain;
      });
      const result = await claimReport('r1');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });

    it('claims an escalated report if role matches', async () => {
      setupOfficial('u1', 'kraj', true);
      const updateChain = { ...makeChain(null), update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'kraj', role_verified: true }, error: null });
        if (callCount === 2) return makeChain({ data: { status: 'escalated', escalated_to_role: 'kraj' }, error: null });
        return updateChain;
      });
      const result = await claimReport('r1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('escalateReport', () => {
    it('throws if not assigned to report', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        return makeChain({ data: { status: 'in_review', assigned_to: 'other-user' }, error: null });
      });
      await expect(escalateReport('r1')).rejects.toThrow('Nejste přiřazeni k tomuto hlášení.');
    });

    it('throws if role cannot escalate (ministerstvo)', async () => {
      setupOfficial('u1', 'ministerstvo', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'ministerstvo', role_verified: true }, error: null });
        return makeChain({ data: { status: 'in_review', assigned_to: 'u1' }, error: null });
      });
      await expect(escalateReport('r1')).rejects.toThrow('Vaše role nemůže eskalovat dále.');
    });

    it('escalates report successfully', async () => {
      setupOfficial('u1', 'obec', true);
      const updateChain = { ...makeChain(null), update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        if (callCount === 2) return makeChain({ data: { status: 'in_review', assigned_to: 'u1' }, error: null });
        return updateChain;
      });
      const result = await escalateReport('r1');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });
  });

  describe('resolveReport', () => {
    it('throws if not assigned', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        return makeChain({ data: { status: 'in_review', assigned_to: 'other' }, error: null });
      });
      await expect(resolveReport('r1')).rejects.toThrow('Nejste přiřazeni k tomuto hlášení.');
    });

    it('throws if not in_review', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        return makeChain({ data: { status: 'pending', assigned_to: 'u1' }, error: null });
      });
      await expect(resolveReport('r1')).rejects.toThrow('Hlášení není ve stavu in_review.');
    });

    it('resolves report successfully', async () => {
      setupOfficial('u1', 'obec', true);
      const updateChain = { ...makeChain(null), update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        if (callCount === 2) return makeChain({ data: { status: 'in_review', assigned_to: 'u1' }, error: null });
        return updateChain;
      });
      const result = await resolveReport('r1');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });
  });

  describe('rejectReport', () => {
    it('throws if not assigned', async () => {
      setupOfficial('u1', 'obec', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'obec', role_verified: true }, error: null });
        return makeChain({ data: { status: 'in_review', assigned_to: 'other' }, error: null });
      });
      await expect(rejectReport('r1')).rejects.toThrow('Nejste přiřazeni k tomuto hlášení.');
    });

    it('throws if not in_review', async () => {
      setupOfficial('u1', 'kraj', true);
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'kraj', role_verified: true }, error: null });
        return makeChain({ data: { status: 'resolved', assigned_to: 'u1' }, error: null });
      });
      await expect(rejectReport('r1')).rejects.toThrow('Hlášení není ve stavu in_review.');
    });

    it('rejects report successfully', async () => {
      setupOfficial('u1', 'kraj', true);
      const updateChain = { ...makeChain(null), update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
      let callCount = 0;
      mockSupabaseOfficial.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeChain({ data: { id: 'u1', role: 'kraj', role_verified: true }, error: null });
        if (callCount === 2) return makeChain({ data: { status: 'in_review', assigned_to: 'u1' }, error: null });
        return updateChain;
      });
      const result = await rejectReport('r1');
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/reports');
    });
  });
});
