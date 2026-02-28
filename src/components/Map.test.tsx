import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Map from './Map';

// Mock maplibregl
const onMock = vi.fn();
const removeMock = vi.fn();
const addControlMock = vi.fn();
const setCenterMock = vi.fn();
const jumpToMock = vi.fn();
const getCenterMock = vi.fn(() => ({ lng: 14.4378, lat: 50.0755 }));
const getZoomMock = vi.fn(() => 12);

vi.mock('maplibre-gl', () => {
  class MapMock {
    on = onMock;
    remove = removeMock;
    addControl = addControlMock;
    setCenter = setCenterMock;
    jumpTo = jumpToMock;
    getCenter = getCenterMock;
    getZoom = getZoomMock;
    project = vi.fn(() => ({ x: 0, y: 0 }));
  }

  class NavigationControlMock {}

  class MarkerMock {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn().mockReturnThis();
    setPopup = vi.fn().mockReturnThis();
    on = vi.fn().mockReturnThis();
    getElement = vi.fn(() => document.createElement('div'));
  }

  class PopupMock {
    setHTML = vi.fn().mockReturnThis();
  }

  return {
    default: {
      Map: MapMock,
      NavigationControl: NavigationControlMock,
      Marker: MarkerMock,
      Popup: PopupMock,
    },
    Map: MapMock,
    NavigationControl: NavigationControlMock,
    Marker: MarkerMock,
    Popup: PopupMock,
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

  it('does not re-create map when unrelated props change', () => {
    const { rerender } = render(<Map reports={[]} />);
    
    // Rerender with new reports
    rerender(<Map reports={[{ 
      id: '1', 
      title: 'Test', 
      location: { lng: 0, lat: 0 }, 
      status: 'pending', 
      description: 'Desc', 
      category: 'Cat', 
      rating: 5 
    }]} />);
    
    // Should NOT call remove (which happens on cleanup of initialization effect)
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('updates selection marker without re-creating map', () => {
    const { rerender } = render(<Map selectedLocation={null} />);
    
    rerender(<Map selectedLocation={[14.4, 50.1]} />);
    
    expect(removeMock).not.toHaveBeenCalled();
  });
});
