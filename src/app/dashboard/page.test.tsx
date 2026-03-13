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
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  MessageSquare: () => <div data-testid="message-square-icon">MessageSquare</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}));

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: ({ center }: { center?: [number, number] }) => (
    <div data-testid="mock-map" data-center={center ? center.join(',') : ''}>Map</div>
  ),
}));

function makeReportsSelect(mockReports: unknown[]) {
  return {
    select: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
  };
}

function makeTopicsSelect(mockTopics: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockTopics, error: null }),
    }),
  };
}

function makeProfilesSelect(profile: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profile, error: null }),
      }),
    }),
  };
}

const mockReport = (overrides = {}) => ({
  id: '1',
  title: 'Díra v silnici',
  description: null,
  rating: 2,
  category: 'doprava',
  status: 'pending',
  created_at: '2026-01-01T10:00:00Z',
  location: { type: 'Point', coordinates: [14.4, 50.1] },
  region_kraj: 'Jihomoravský kraj',
  ...overrides,
});

test('renders Dashboard page with header, map and sections', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const mockTopics = [
    { id: '1', title: 'Nová reforma', comments: [{ id: '1' }], created_at: new Date().toISOString() },
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([mockReport()]);
      if (table === 'topics') return makeTopicsSelect(mockTopics);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText(/Pulse Dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Geografický pulz/i)).toBeInTheDocument();
  expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  expect(screen.getByText(/Nejnovější hlášení/i)).toBeInTheDocument();
  expect(screen.getByText(/Populární témata/i)).toBeInTheDocument();
  expect(screen.getByText(/Díra v silnici/i)).toBeInTheDocument();
  expect(screen.getByText(/Nová reforma/i)).toBeInTheDocument();
});

test('renders empty state when no data is available', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText(/Zatím žádná hlášení/i)).toBeInTheDocument();
  expect(screen.getByText(/Zatím žádná témata/i)).toBeInTheDocument();
  expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/0.0 \/ 5/)).toBeInTheDocument();
});

test('calculates and displays correct statistics', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const mockReports = [
    mockReport({ id: '1', title: 'R1', rating: 5, category: 'C1', created_at: '2026-01-01', status: 'resolved', region_kraj: null }),
    mockReport({ id: '2', title: 'R2', rating: 1, category: 'C2', created_at: '2026-01-02', status: 'pending', region_kraj: null }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(mockReports);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText(/3.0 \/ 5/)).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('1')).toBeInTheDocument();
});

test('renders Czech status labels for reports in the dashboard', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const statuses = [
    mockReport({ id: '1', title: 'R1', rating: 3, created_at: '2026-01-01', status: 'pending', region_kraj: null }),
    mockReport({ id: '2', title: 'R2', rating: 3, created_at: '2026-01-02', status: 'in_review', region_kraj: null }),
    mockReport({ id: '3', title: 'R3', rating: 3, created_at: '2026-01-03', status: 'resolved', region_kraj: null }),
    mockReport({ id: '4', title: 'R4', rating: 3, created_at: '2026-01-04', status: 'rejected', region_kraj: null }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(statuses);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText('Čeká')).toBeInTheDocument();
  expect(screen.getByText('V řešení')).toBeInTheDocument();
  expect(screen.getByText('Vyřešeno')).toBeInTheDocument();
  expect(screen.getByText('Zamítnuto')).toBeInTheDocument();
});

test('sorts popular topics by comment count', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'topics') {
        return makeTopicsSelect([
          { id: '1', title: 'Less Popular', comments: [{ id: 'c1' }], created_at: new Date().toISOString() },
          { id: '2', title: 'More Popular', comments: [{ id: 'c2' }, { id: 'c3' }], created_at: new Date().toISOString() },
        ]);
      }
      return makeReportsSelect([]);
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const topicElements = screen.getAllByText(/Popular/);
  expect(topicElements[0]).toHaveTextContent('More Popular');
  expect(topicElements[1]).toHaveTextContent('Less Popular');
});

test('derives latest 5 reports sorted by created_at descending from single query', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const mockReports = [
    mockReport({ id: '1', title: 'Old Report', rating: 3, created_at: '2026-01-01T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '2', title: 'Very Old Report', rating: 3, created_at: '2025-12-01T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '3', title: 'Newest Report', rating: 3, created_at: '2026-03-01T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '4', title: 'Second Report', rating: 3, created_at: '2026-02-20T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '5', title: 'Third Report', rating: 3, created_at: '2026-02-10T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '6', title: 'Fourth Report', rating: 3, created_at: '2026-02-05T00:00:00Z', status: 'pending', region_kraj: null }),
    mockReport({ id: '7', title: 'Fifth Report', rating: 3, created_at: '2026-01-15T00:00:00Z', status: 'pending', region_kraj: null }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(mockReports);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByText('Newest Report')).toBeInTheDocument();
  expect(screen.getByText('Second Report')).toBeInTheDocument();
  expect(screen.getByText('Third Report')).toBeInTheDocument();
  expect(screen.getByText('Fourth Report')).toBeInTheDocument();
  expect(screen.getByText('Fifth Report')).toBeInTheDocument();
  expect(screen.queryByText('Old Report')).not.toBeInTheDocument();
  expect(screen.queryByText('Very Old Report')).not.toBeInTheDocument();
});

test('renders h1 heading "Pulse Dashboard" (redesign: no inline header)', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const heading = screen.getByRole('heading', { level: 1 });
  expect(heading).toHaveTextContent('Pulse Dashboard');
});

test('renders all four stat cards with data-testid attributes (redesign)', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByTestId('stat-card-reports')).toBeInTheDocument();
  expect(screen.getByTestId('stat-card-rating')).toBeInTheDocument();
  expect(screen.getByTestId('stat-card-resolved')).toBeInTheDocument();
  expect(screen.getByTestId('stat-card-status')).toBeInTheDocument();
});

test('renders heatmap section with card wrapper (redesign)', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const heatmapSection = screen.getByTestId('heatmap-section');
  expect(heatmapSection).toBeInTheDocument();
  expect(heatmapSection.tagName).toBe('SECTION');
  expect(heatmapSection.className).toContain('bg-white');
});

test('issues only one query to reports table per page load', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const fromSpy = vi.fn().mockImplementation((table: string) => {
    if (table === 'reports') return makeReportsSelect([]);
    if (table === 'topics') return makeTopicsSelect([]);
    if (table === 'profiles') return makeProfilesSelect(null);
    return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
  });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: fromSpy,
  } as unknown as ReturnType<typeof createClient>);

  await Page();

  const reportsCallCount = fromSpy.mock.calls.filter(([table]: [string]) => table === 'reports').length;
  expect(reportsCallCount).toBe(1);
});

test('shows preferences banner for logged-in user with no preferences', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      if (table === 'profiles') return makeProfilesSelect({ preferences: {} });
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByTestId('preferences-banner')).toBeInTheDocument();
  expect(screen.getByText(/Nastavte si preference/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Nastavit preference/i })).toHaveAttribute('href', '/settings');
});

test('does not show preferences banner for anonymous user', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect([]);
      if (table === 'topics') return makeTopicsSelect([]);
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.queryByTestId('preferences-banner')).not.toBeInTheDocument();
});

test('shows personalized sections for logged-in user with territory preferences', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  // CZ064 = Jihomoravský kraj
  const userPrefs = { territories: ['CZ064'], categories: [], territory_level: 'kraj' };
  const reportsData = [
    mockReport({ id: '1', title: 'Brno Report', region_kraj: 'Jihomoravský kraj', category: 'doprava', created_at: '2026-03-01T00:00:00Z' }),
    mockReport({ id: '2', title: 'Praha Report', region_kraj: 'Hlavní město Praha', category: 'zelen', created_at: '2026-03-02T00:00:00Z' }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(reportsData);
      if (table === 'topics') return makeTopicsSelect([]);
      if (table === 'profiles') return makeProfilesSelect({ preferences: userPrefs });
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByTestId('my-reports-section')).toBeInTheDocument();
  expect(screen.getByTestId('other-reports-section')).toBeInTheDocument();
  expect(screen.getByText('Vaše oblasti')).toBeInTheDocument();
  expect(screen.getByText('Ostatní hlášení')).toBeInTheDocument();
  expect(screen.getByText('Brno Report')).toBeInTheDocument();
  expect(screen.getByText('Praha Report')).toBeInTheDocument();
  // Heatmap title should be personalized
  expect(screen.getByText('Heatmapa vašich oblastí')).toBeInTheDocument();
});

test('shows personalized sections for logged-in user with category preferences', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const userPrefs = { territories: [], categories: ['doprava'], territory_level: '' };
  const reportsData = [
    mockReport({ id: '1', title: 'Doprava Report', region_kraj: 'Jihomoravský kraj', category: 'doprava', created_at: '2026-03-01T00:00:00Z' }),
    mockReport({ id: '2', title: 'Zelen Report', region_kraj: 'Jihomoravský kraj', category: 'zelen', created_at: '2026-03-02T00:00:00Z' }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(reportsData);
      if (table === 'topics') return makeTopicsSelect([]);
      if (table === 'profiles') return makeProfilesSelect({ preferences: userPrefs });
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByTestId('my-reports-section')).toBeInTheDocument();
  expect(screen.getByText('Doprava Report')).toBeInTheDocument();
  expect(screen.getByText('Zelen Report')).toBeInTheDocument();
});

test('heatmap is centered on filtered reports region', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  const userPrefs = { territories: ['CZ064'], categories: [], territory_level: 'kraj' };
  const reportsData = [
    mockReport({ id: '1', title: 'Brno Report', region_kraj: 'Jihomoravský kraj', category: 'doprava', created_at: '2026-03-01T00:00:00Z', location: { type: 'Point', coordinates: [16.6, 49.2] } }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(reportsData);
      if (table === 'topics') return makeTopicsSelect([]);
      if (table === 'profiles') return makeProfilesSelect({ preferences: userPrefs });
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  const map = screen.getByTestId('mock-map');
  // Center should be around Brno's coordinates
  expect(map).toHaveAttribute('data-center');
  const center = map.getAttribute('data-center');
  expect(center).toContain('16.6');
  expect(center).toContain('49.2');
});

test('shows empty state in my-reports when no reports match preferences', async () => {
  const { createClient } = await import('@/utils/supabase/server');
  // User prefers Praha but all reports are in Brno
  const userPrefs = { territories: ['CZ010'], categories: [], territory_level: 'kraj' };
  const reportsData = [
    mockReport({ id: '1', title: 'Brno Report', region_kraj: 'Jihomoravský kraj', category: 'doprava', created_at: '2026-03-01T00:00:00Z' }),
  ];
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reports') return makeReportsSelect(reportsData);
      if (table === 'topics') return makeTopicsSelect([]);
      if (table === 'profiles') return makeProfilesSelect({ preferences: userPrefs });
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    }),
  } as unknown as ReturnType<typeof createClient>);

  const PageComponent = await Page();
  render(PageComponent);

  expect(screen.getByTestId('my-reports-section')).toBeInTheDocument();
  expect(screen.getByText(/Žádná hlášení odpovídající vašim preferencím/i)).toBeInTheDocument();
  expect(screen.getByText('Brno Report')).toBeInTheDocument(); // in "Ostatní"
});
