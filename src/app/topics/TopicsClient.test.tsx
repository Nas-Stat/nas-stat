import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  });

  test('shows floating login CTA if not logged in', () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    const cta = screen.getByTestId('login-cta');
    expect(cta).toBeInTheDocument();
    expect(within(cta).getByText(/Pro přidání tématu se/i)).toBeInTheDocument();
    expect(within(cta).getByRole('link', { name: /přihlaste/i })).toHaveAttribute('href', '/login');
  });

  test('shows FAB for logged-in user', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const fab = screen.getByTestId('new-topic-fab');
    expect(fab).toBeInTheDocument();
    expect(fab).toHaveAttribute('aria-label', 'Nové téma');
  });

  test('does not show FAB for logged-out user', () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    expect(screen.queryByTestId('new-topic-fab')).not.toBeInTheDocument();
  });

  test('does not show login CTA for logged-in user', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    expect(screen.queryByTestId('login-cta')).not.toBeInTheDocument();
  });

  test('FAB opens topic form modal', () => {
    render(<TopicsClient initialTopics={[]} user={mockUser} />);
    fireEvent.click(screen.getByTestId('new-topic-fab'));
    expect(screen.getByText('Nové téma')).toBeInTheDocument();
    // FAB should hide while form is open
    expect(screen.queryByTestId('new-topic-fab')).not.toBeInTheDocument();
  });

  test('handles voting (logged in)', async () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const upButton = screen.getAllByTestId('thumb-up')[0].closest('button')!;
    fireEvent.click(upButton);

    await waitFor(() => {
      expect(voteTopic).toHaveBeenCalledWith('topic-1', 'up');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('shows login link for votes when logged out', () => {
    render(<TopicsClient initialTopics={mockTopics} user={null} />);
    const loginLink = screen.getByText('Přihlaste se pro hlasování');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    // Vote buttons must not be rendered as interactive buttons
    expect(screen.queryByRole('button', { name: /up/i })).not.toBeInTheDocument();
  });

  test('toggles comments section', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const commentBtn = screen.getByTestId('message-square').closest('button')!;

    // Comments are initially hidden
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
    const upButton = screen.getAllByTestId('thumb-up')[0].closest('button')!;
    fireEvent.click(upButton);

    await waitFor(() => {
      expect(screen.getByText('Chyba při hlasování.')).toBeInTheDocument();
    });
  });

  test('submits a new topic via FAB', async () => {
    render(<TopicsClient initialTopics={[]} user={mockUser} />);
    fireEvent.click(screen.getByTestId('new-topic-fab'));

    fireEvent.change(screen.getByLabelText(/Název tématu/i), { target: { value: 'New Topic Title', name: 'title' } });
    fireEvent.change(screen.getByLabelText(/Popis/i), { target: { value: 'New Topic Description', name: 'description' } });

    const form = screen.getByText('Vytvořit téma').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createTopic).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('optimistically updates vote count when voting up', async () => {
    // Start with 1 upvote from user-123
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);

    // Upvote is currently 1. Clicking it should remove it (toggle).
    const upButton = screen.getAllByTestId('thumb-up')[0].closest('button')!;
    expect(within(upButton).getByText('1')).toBeInTheDocument();

    fireEvent.click(upButton);

    // Should immediately show 0 (optimistic)
    expect(within(upButton).getByText('0')).toBeInTheDocument();

    await waitFor(() => {
      expect(voteTopic).toHaveBeenCalledWith('topic-1', 'up');
    });
  });

  test('optimistically adds a comment to the list', async () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    fireEvent.click(screen.getByTestId('message-square'));

    const input = screen.getByPlaceholderText('Napište komentář...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Optimistic Comment', name: 'content' } });

    fireEvent.submit(input.closest('form')!);

    // Should immediately show the comment
    expect(screen.getByText('My Optimistic Comment')).toBeInTheDocument();

    await waitFor(() => {
      expect(addComment).toHaveBeenCalled();
    });
  });

  test('optimistically switches vote from up to down', async () => {
    // Start with 1 upvote from user-123
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);

    const upButton = screen.getAllByTestId('thumb-up')[0].closest('button')!;
    const downButton = screen.getAllByTestId('thumb-down')[0].closest('button')!;

    expect(within(upButton).getByText('1')).toBeInTheDocument();
    expect(within(downButton).getByText('1')).toBeInTheDocument(); // user-456 has downvoted

    // Switch to downvote
    fireEvent.click(downButton);

    // Upvote should become 0, Downvote should become 2
    expect(within(upButton).getByText('0')).toBeInTheDocument();
    expect(within(downButton).getByText('2')).toBeInTheDocument();

    await waitFor(() => {
      expect(voteTopic).toHaveBeenCalledWith('topic-1', 'down');
    });
  });

  test('voting buttons use pill style (rounded-full class)', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const upButton = screen.getAllByTestId('thumb-up')[0].closest('button')!;
    const downButton = screen.getAllByTestId('thumb-down')[0].closest('button')!;
    expect(upButton.className).toContain('rounded-full');
    expect(downButton.className).toContain('rounded-full');
  });

  test('card has shadow and hover transition', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    const card = screen.getByText('First Topic').closest('.rounded-xl')!;
    expect(card.className).toContain('shadow-sm');
    expect(card.className).toContain('transition-shadow');
    expect(card.className).toContain('hover:shadow-md');
  });

  test('comment input uses pill style', () => {
    render(<TopicsClient initialTopics={mockTopics} user={mockUser} />);
    fireEvent.click(screen.getByTestId('message-square'));
    const input = screen.getByPlaceholderText('Napište komentář...');
    expect(input.className).toContain('rounded-full');
  });

  test('shows empty state when no topics', () => {
    render(<TopicsClient initialTopics={[]} user={null} />);
    expect(screen.getByText('Zatím nebyla přidána žádná témata.')).toBeInTheDocument();
  });
});
