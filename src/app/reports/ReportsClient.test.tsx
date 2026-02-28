import { render, screen, fireEvent } from '@testing-library/react';
import ReportsClient from './ReportsClient';
import { expect, test, vi, beforeEach } from 'vitest';

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: ({ onMapClick }: any) => (
    <div data-testid="mocked-map" onClick={() => onMapClick?.(14.4378, 50.0755)}>
      Mocked Map
    </div>
  ),
}));

// Mock Server Actions
vi.mock('./actions', () => ({
  createReport: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Lucide-react
vi.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon">Star</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('ReportsClient', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders map and initial state', () => {
    render(<ReportsClient initialReports={[]} user={null} />);
    expect(screen.getByTestId('mocked-map')).toBeInTheDocument();
    expect(screen.getByText(/Pro nahlášení podnětu se prosím/i)).toBeInTheDocument();
  });

  test('shows form when map is clicked (logged in)', () => {
    render(<ReportsClient initialReports={[]} user={mockUser} />);
    
    const map = screen.getByTestId('mocked-map');
    fireEvent.click(map);

    expect(screen.getByText(/Nový podnět/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Název podnětu/i)).toBeInTheDocument();
  });

  test('does not show form when map is clicked (logged out)', () => {
    render(<ReportsClient initialReports={[]} user={null} />);
    
    const map = screen.getByTestId('mocked-map');
    fireEvent.click(map);

    expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
  });

  test('closes form when X is clicked', () => {
    render(<ReportsClient initialReports={[]} user={mockUser} />);
    
    // Open form
    fireEvent.click(screen.getByTestId('mocked-map'));
    expect(screen.getByText(/Nový podnět/i)).toBeInTheDocument();

    // Close form
    fireEvent.click(screen.getByTestId('x-icon'));
    expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
  });
});
