import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

// Mock TopicsClient component
vi.mock('./TopicsClient', () => ({
  default: ({ initialTopics }: { initialTopics: unknown[] }) => (
    <div data-testid="mocked-topics-client">
      Mocked TopicsClient ({initialTopics.length} topics)
      {initialTopics.length > 0 && (
        <span data-testid="first-topic-title">{(initialTopics[0] as { title: string }).title}</span>
      )}
    </div>
  ),
}));

test('renders Topics page with topics client', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              title: 'Nová reforma školství',
              description: 'Diskuse o změnách v osnovách.',
              created_at: new Date().toISOString(),
              profiles: { username: 'testuser' },
              votes: [],
              comments: [],
            },
          ],
          error: null,
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const topicsClient = screen.getByTestId('mocked-topics-client');
  expect(topicsClient).toBeInTheDocument();
  expect(screen.getByText(/Mocked TopicsClient \(1 topics\)/i)).toBeInTheDocument();
  expect(screen.getByTestId('first-topic-title')).toHaveTextContent('Nová reforma školství');
});
