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
const addSourceMock = vi.fn();
const addLayerMock = vi.fn();
const removeSourceMock = vi.fn();
const removeLayerMock = vi.fn();
const getLayerMock = vi.fn();
const getSourceMock = vi.fn();

const setPopupMock = vi.fn().mockReturnThis();
const setHTMLMock = vi.fn().mockReturnThis();

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
    addSource = addSourceMock;
    addLayer = addLayerMock;
    removeSource = removeSourceMock;
    removeLayer = removeLayerMock;
    getLayer = getLayerMock;
    getSource = getSourceMock;
  }

  class NavigationControlMock {}

  class MarkerMock {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn().mockReturnThis();
    setPopup = setPopupMock;
    on = vi.fn().mockReturnThis();
    getElement = vi.fn(() => document.createElement('div'));
  }

  class PopupMock {
    setHTML = setHTMLMock;
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

  it('handles heatmap layer correctly when showHeatmap changes', async () => {
    // We need to trigger the 'load' event
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    const reports = [{ 
      id: '1', 
      title: 'Test', 
      location: { lng: 14.4, lat: 50.1 }, 
      status: 'pending' as const, 
      description: 'Desc', 
      category: 'Cat', 
      rating: 5 
    }];

    const { rerender } = render(<Map reports={reports} showHeatmap={false} />);
    
    // Trigger map load
    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    // Rerender with showHeatmap=true
    rerender(<Map reports={reports} showHeatmap={true} />);

    
    expect(addSourceMock).toHaveBeenCalledWith('reports-source', expect.any(Object));
    expect(addLayerMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'reports-heatmap' }));

    // Rerender with showHeatmap=false
    getLayerMock.mockReturnValue({});
    getSourceMock.mockReturnValue({});
    rerender(<Map reports={reports} showHeatmap={false} />);
    
    expect(removeLayerMock).toHaveBeenCalledWith('reports-heatmap');
    expect(removeSourceMock).toHaveBeenCalledWith('reports-source');
  });

  it('sets up popups for markers', async () => {
    // Trigger map load
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    const reports = [{ 
      id: '1', 
      title: 'Díra v silnici', 
      location: { lng: 14.4, lat: 50.1 }, 
      status: 'pending' as const, 
      description: 'Velká díra', 
      category: 'Doprava', 
      rating: 5 
    }];

    render(<Map reports={reports} />);
    
    // Trigger map load
    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    // Check if setPopup was called
    expect(setPopupMock).toHaveBeenCalled();
    // Check if setHTML was called with title or description
    expect(setHTMLMock).toHaveBeenCalledWith(expect.stringContaining('Díra v silnici'));
  });
});

