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
    
    // Default mock for from()
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      insert: mockSupabase.insert,
      upsert: mockSupabase.upsert,
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
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

    it('successfully inserts a vote if none exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await voteTopic('topic-123', 'up');
      
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });

    it('removes a vote if it already exists with the same type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { id: 'vote-1', vote_type: 'up' }, 
          error: null 
        }),
        delete: vi.fn().mockReturnValue({ eq: mockDelete }),
      } as any);

      const result = await voteTopic('topic-123', 'up');
      
      expect(result).toEqual({ success: true });
      expect(mockDelete).toHaveBeenCalledWith('id', 'vote-1');
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });

    it('updates a vote if it exists with a different type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: { id: 'vote-1', vote_type: 'down' }, 
          error: null 
        }),
        upsert: mockUpsert,
      } as any);

      const result = await voteTopic('topic-123', 'up');
      
      expect(result).toEqual({ success: true });
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          profile_id: 'user-123',
          topic_id: 'topic-123',
          vote_type: 'up',
        },
        { onConflict: 'profile_id,topic_id' }
      );
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
      const topicId = '123e4567-e89b-12d3-a456-426614174000';
      const formData = new FormData();
      formData.append('topic_id', topicId);
      formData.append('content', 'To je zajímavé.');
      
      const result = await addComment(formData);
      expect(result).toEqual({ success: true });
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        profile_id: 'user-123',
        topic_id: topicId,
        content: 'To je zajímavé.',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/topics');
    });
  });
});
