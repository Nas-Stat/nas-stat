import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import LandingClient from './LandingClient';
import type { Report } from '@/components/Map';

// Mock dynamic import of Map component
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    // Return a simple stub; actual map is tested separately
    const Component = ({ reports }: { reports: Report[] }) => (
      <div data-testid="map-stub">map:{reports.length}</div>
    );
    Component.displayName = 'MapStub';
    void fn; // suppress unused warning
    return Component;
  },
}));

const mockReports: Report[] = [
  {
    id: 'r1',
    title: 'Výmol',
    description: null,
    location: { lng: 14.4, lat: 50.07 },
    rating: 3,
    category: 'roads',
    status: 'pending',
  },
  {
    id: 'r2',
    title: 'Skládka',
    description: 'popis',
    location: { lng: 14.5, lat: 50.08 },
    rating: 2,
    category: 'waste',
    status: 'resolved',
  },
];

const mockCategories = [
  { slug: 'roads', label: 'Komunikace' },
  { slug: 'waste', label: 'Odpady' },
];

const mockStatusCounts = [
  { status: 'pending', count: 10 },
  { status: 'in_review', count: 5 },
  { status: 'resolved', count: 20 },
  { status: 'rejected', count: 2 },
];

function renderLanding(overrides = {}) {
  return render(
    <LandingClient
      reports={mockReports}
      statusCounts={mockStatusCounts}
      categories={mockCategories}
      isLoggedIn={false}
      {...overrides}
    />,
  );
}

describe('LandingClient', () => {
  test('renders stats section with total count', () => {
    renderLanding();
    expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    expect(screen.getByTestId('total-count').textContent).toBe('37');
  });

  test('renders all status count pills', () => {
    renderLanding();
    expect(screen.getByTestId('status-count-pending')).toBeInTheDocument();
    expect(screen.getByTestId('status-count-in_review')).toBeInTheDocument();
    expect(screen.getByTestId('status-count-resolved')).toBeInTheDocument();
    expect(screen.getByTestId('status-count-rejected')).toBeInTheDocument();
  });

  test('renders filters section with category pills', () => {
    renderLanding();
    expect(screen.getByTestId('filters-section')).toBeInTheDocument();
    expect(screen.getByTestId('category-all')).toBeInTheDocument();
    expect(screen.getByTestId('category-roads')).toBeInTheDocument();
    expect(screen.getByTestId('category-waste')).toBeInTheDocument();
  });

  test('renders region dropdown with all kraje', () => {
    renderLanding();
    const select = screen.getByTestId('region-select');
    expect(select).toBeInTheDocument();
    // 14 kraje + 1 "Všechny kraje" option
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(15);
  });

  test('renders map section', () => {
    renderLanding();
    expect(screen.getByTestId('map-section')).toBeInTheDocument();
    expect(screen.getByTestId('map-stub')).toBeInTheDocument();
  });

  test('renders CTA section with correct links when not logged in', () => {
    renderLanding({ isLoggedIn: false });
    const reportCta = screen.getByTestId('cta-report');
    expect(reportCta).toHaveAttribute('href', '/login');
    const exploreCta = screen.getByTestId('cta-explore');
    expect(exploreCta).toHaveAttribute('href', '/reports');
  });

  test('renders CTA section with /reports link when logged in', () => {
    renderLanding({ isLoggedIn: true });
    const reportCta = screen.getByTestId('cta-report');
    expect(reportCta).toHaveAttribute('href', '/reports');
  });

  test('category filter — selecting a category filters map reports', () => {
    renderLanding();
    // Initially shows all 2 reports
    expect(screen.getByTestId('map-stub').textContent).toBe('map:2');

    // Click "Komunikace" (roads)
    fireEvent.click(screen.getByTestId('category-roads'));
    expect(screen.getByTestId('map-stub').textContent).toBe('map:1');
  });

  test('category filter — clicking "Vše" shows all reports', () => {
    renderLanding();
    // Select a category first
    fireEvent.click(screen.getByTestId('category-roads'));
    expect(screen.getByTestId('map-stub').textContent).toBe('map:1');

    // Click "Vše" to reset
    fireEvent.click(screen.getByTestId('category-all'));
    expect(screen.getByTestId('map-stub').textContent).toBe('map:2');
  });

  test('category filter — clicking same category pill again deselects it', () => {
    renderLanding();
    fireEvent.click(screen.getByTestId('category-roads'));
    expect(screen.getByTestId('map-stub').textContent).toBe('map:1');

    fireEvent.click(screen.getByTestId('category-roads'));
    expect(screen.getByTestId('map-stub').textContent).toBe('map:2');
  });

  test('renders with empty data gracefully', () => {
    render(
      <LandingClient
        reports={[]}
        statusCounts={[]}
        categories={[]}
        isLoggedIn={false}
      />,
    );
    expect(screen.getByTestId('total-count').textContent).toBe('0');
    expect(screen.getByTestId('map-stub').textContent).toBe('map:0');
  });
});
