import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Map from './Map';

// Mock maplibregl
vi.mock('maplibre-gl', () => {
  const onMock = vi.fn();
  const removeMock = vi.fn();
  const addControlMock = vi.fn();

  class MapMock {
    on = onMock;
    remove = removeMock;
    addControl = addControlMock;
  }

  class NavigationControlMock {}

  return {
    default: {
      Map: MapMock,
      NavigationControl: NavigationControlMock,
    },
    Map: MapMock,
    NavigationControl: NavigationControlMock,
  };
});

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container', () => {
    render(<Map />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeDefined();
  });

  it('shows loading indicator', () => {
    render(<Map />);
    const loadingText = screen.getByText('Načítám mapu...');
    expect(loadingText).toBeDefined();
  });
});
