import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import TopicsClient from './TopicsClient';
import { User } from '@supabase/supabase-js';
import { createTopic, voteTopic, addComment } from './actions';

// Mock Server Actions
vi.mock('./actions', () => ({
  createTopic: vi.fn().mockResolvedValue({ success: true }),
  voteTopic: vi.fn().mockResolvedValue({ success: true }),
  addComment: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock next/navigation
const mockRefresh = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  ThumbsUp: ({ className }: { className?: string }) => <div data-testid="thumb-up" className={className}>Up</div>,
  ThumbsDown: ({ className }: { className?: string }) => <div data-testid="thumb-down" className={className}>Down</div>,
  MessageSquare: () => <div data-testid="message-square">Msg</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  X: () => <div data-testid="x-icon">X</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
}));

describe('TopicsClient', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' } as Partial<User> as User;
  const mockTopics = [
    {
      id: 'topic-1',
      title: 'First Topic',
      description: 'First Description',
      created_at: new Date().toISOString(),
      profiles: { username: 'user1' },
      votes: [
        { vote_type: 'up', profile_id: 'user-123' },
        { vote_type: 'down', profile_id: 'user-456' },
      ],
      comments: [
        { id: 'comment-1', content: 'Comment 1', created_at: new Date().toISOString(), profiles: { username: 'user2' } },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders topics and initial state', () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    expect(screen.getByText('First Topic')).toBeInTheDocument();
    expect(screen.getByText('First Description')).toBeInTheDocument();
    expect(screen.getByText(/Pro přidání tématu se/i)).toBeInTheDocument();
  });

  test('shows login message if not logged in', () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    expect(screen.getByText(/přihlaste/i)).toBeInTheDocument();
  });

  test('shows creation button if logged in', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    expect(screen.getByText('Nové téma')).toBeInTheDocument();
  });

  test('handles voting (logged in)', async () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const upButton = screen.getAllByTestId('thumb-up')[0];
    fireEvent.click(upButton);

    await waitFor(() => {
      expect(voteTopic).toHaveBeenCalledWith('topic-1', 'up');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('redirects to login if voting (logged out)', async () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    const upButton = screen.getAllByTestId('thumb-up')[0];
    fireEvent.click(upButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('toggles comments section', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const commentBtn = screen.getByTestId('message-square');
    
    // Comments are initially hidden? Wait, I should check the code.
    // In my code: {commentingOn === topic.id && (...)}
    // Initially commentingOn is null.
    expect(screen.queryByText('Comment 1')).not.toBeInTheDocument();

    fireEvent.click(commentBtn);
    expect(screen.getByText('Comment 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Napište komentář...')).toBeInTheDocument();

    fireEvent.click(commentBtn);
    expect(screen.queryByText('Comment 1')).not.toBeInTheDocument();
  });

  test('submits a comment and resets form', async () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    fireEvent.click(screen.getByTestId('message-square'));
    
    const input = screen.getByPlaceholderText('Napište komentář...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Comment', name: 'content' } });
    
    const form = input.closest('form')!;
    const resetSpy = vi.spyOn(form, 'reset');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(addComment).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('displays error message when voting fails', async () => {
    const { voteTopic } = await import('./actions');
    vi.mocked(voteTopic).mockRejectedValueOnce(new Error('Chyba při hlasování'));

    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const upButton = screen.getAllByTestId('thumb-up')[0];
    fireEvent.click(upButton);

    await waitFor(() => {
      expect(screen.getByText('Chyba při hlasování.')).toBeInTheDocument();
    });
  });

  test('submits a new topic', async () => {
    render(<TopicsClient initialTopics={[]} user={mockUser} />);
    fireEvent.click(screen.getByText('Nové téma'));
    
    fireEvent.change(screen.getByLabelText(/Název tématu/i), { target: { value: 'New Topic Title', name: 'title' } });
    fireEvent.change(screen.getByLabelText(/Popis/i), { target: { value: 'New Topic Description', name: 'description' } });
    
    const form = screen.getByText('Vytvořit téma').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createTopic).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
