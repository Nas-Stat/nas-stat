import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportsClient from './ReportsClient';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import { User } from '@supabase/supabase-js';

// Mock Map component
vi.mock('@/components/Map', () => ({
  default: ({ onMapClick }: { onMapClick?: (lng: number, lat: number) => void }) => (
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

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe('ReportsClient', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' } as Partial<User> as User;

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

  test('submits form successfully', async () => {
    const { createReport } = await import('./actions');
    render(<ReportsClient initialReports={[]} user={mockUser} />);
    
    // Open form
    fireEvent.click(screen.getByTestId('mocked-map'));
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Název podnětu/i), { target: { value: 'Test report', name: 'title' } });
    fireEvent.change(screen.getByLabelText(/Popis/i), { target: { value: 'Test description', name: 'description' } });
    
    // Submit
    const form = screen.getByText(/Odeslat hlášení/i).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createReport).toHaveBeenCalled();
    });

    const formData = vi.mocked(createReport).mock.calls[0][0];
    expect(formData.get('title')).toBe('Test report');
    expect(formData.get('description')).toBe('Test description');
    expect(formData.get('lng')).toBe('14.4378');
    expect(formData.get('lat')).toBe('50.0755');

    // Check if form is closed and refresh is called
    await waitFor(() => {
      expect(screen.queryByText(/Nový podnět/i)).not.toBeInTheDocument();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
