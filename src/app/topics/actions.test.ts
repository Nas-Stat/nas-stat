import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTopic, voteTopic, addComment } from './actions';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Topic Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
  });

  describe('createTopic', () => {
    it('throws error if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const formData = new FormData();
      await expect(createTopic(formData)).rejects.toThrow('Pro vytvoření tématu se musíte přihlásit.');
    });

    it('returns validation errors for invalid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const formData = new FormData();
      formData.append('title', 'Ab'); // Too short
      
      const result = await createTopic(formData);
      expect(result).toHaveProperty('errors');
      expect(result.errors?.title).toBeDefined();
    });

    it('successfully creates a topic', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const formData = new FormData();
      formData.append('title', 'Nová reforma');
      formData.append('description', 'Popis reformy školství.');
      
      const result = await createTopic(formData);
      expect(result).toEqual({ success: true });
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        title: 'Nová reforma',
        description: 'Popis reformy školství.',
        created_by: 'user-123',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });

  describe('voteTopic', () => {
    it('throws error if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      await expect(voteTopic('topic-123', 'up')).rejects.toThrow('Pro hlasování se musíte přihlásit.');
    });

    it('successfully upserts a vote', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const result = await voteTopic('topic-123', 'up');
      
      expect(result).toEqual({ success: true });
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        {
          profile_id: 'user-123',
          topic_id: 'topic-123',
          vote_type: 'up',
        },
        { onConflict: 'profile_id,topic_id' }
      );
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });

  describe('addComment', () => {
    it('throws error if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const formData = new FormData();
      await expect(addComment(formData)).rejects.toThrow('Pro přidání komentáře se musíte přihlásit.');
    });

    it('successfully adds a comment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const formData = new FormData();
      formData.append('topic_id', 'topic-123');
      formData.append('content', 'To je zajímavé.');
      
      const result = await addComment(formData);
      expect(result).toEqual({ success: true });
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        profile_id: 'user-123',
        topic_id: 'topic-123',
        content: 'To je zajímavé.',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });
});
