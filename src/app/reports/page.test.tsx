import { render, screen } from '@testing-library/react';
import Page from './page';
import { expect, test, vi } from 'vitest';

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: () => <div data-testid="mocked-map">Mocked Map</div>,
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
}));

test('renders Reports page with header and map', () => {
  render(<Page />);
  const header = screen.getByText(/Hlášení podnětů/i);
  expect(header).toBeInTheDocument();

  const map = screen.getByTestId('mocked-map');
  expect(map).toBeInTheDocument();

  const backButton = screen.getByRole('link', { name: /zpět/i });
  expect(backButton).toHaveAttribute('href', '/');
});
