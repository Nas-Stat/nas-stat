import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Map from './Map';

// Mock @maptiler/sdk
const onMock = vi.fn();
const onceMock = vi.fn();
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
const setStyleMock = vi.fn();

const setPopupMock = vi.fn().mockReturnThis();
const setHTMLMock = vi.fn().mockReturnThis();

vi.mock('@maptiler/sdk', () => {
  class MapMock {
    on = onMock;
    once = onceMock;
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
    setStyle = setStyleMock;
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
    config: { apiKey: '' },
    MapStyle: {
      STREETS: 'streets-v4',
      HYBRID: 'hybrid-v4',
      DATAVIZ: 'dataviz-v4',
    },
    Map: MapMock,
    NavigationControl: NavigationControlMock,
    Marker: MarkerMock,
    Popup: PopupMock,
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
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

  it('includes status label in marker popups', async () => {
    // Trigger map load
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    const reports = [{
      id: '1',
      title: 'Test Report',
      location: { lng: 14.4, lat: 50.1 },
      status: 'resolved' as const,
      description: 'Desc',
      category: 'Cat',
      rating: 5
    }];

    render(<Map reports={reports} />);

    // Trigger map load
    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    // Check if setHTML was called with the status label "Vyřešeno"
    expect(setHTMLMock).toHaveBeenCalledWith(expect.stringContaining('Vyřešeno'));
  });

  it('escapes HTML in popup content to prevent XSS', async () => {
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    const reports = [{
      id: '1',
      title: '<script>alert("xss")</script>',
      location: { lng: 14.4, lat: 50.1 },
      status: 'pending' as const,
      description: '<img src=x onerror=alert(1)>',
      category: '<b>Hack</b>',
      rating: 3,
    }];

    render(<Map reports={reports} />);

    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    const html: string = setHTMLMock.mock.calls[0][0];
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;');
  });

  // === Layer switcher tests ===

  it('shows style switcher after map loads', async () => {
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    render(<Map />);

    // Style switcher should not be visible before load
    expect(screen.queryByTestId('style-switcher')).toBeNull();

    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    // Style switcher should be visible after load
    expect(screen.getByTestId('style-switcher')).toBeDefined();
    expect(screen.getByText('Ulice')).toBeDefined();
    expect(screen.getByText('Satelit')).toBeDefined();
    expect(screen.getByText('Data')).toBeDefined();
  });

  it('calls setStyle when switching layers', async () => {
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    render(<Map />);

    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    fireEvent.click(screen.getByText('Satelit'));

    expect(setStyleMock).toHaveBeenCalledWith('hybrid-v4');
  });

  it('persists selected style to localStorage', async () => {
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event, callback) => {
      if (event === 'load') onMapLoad = callback;
    });

    render(<Map />);

    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    fireEvent.click(screen.getByText('Data'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('nasstat-map-style', 'dataviz');
  });

  it('does not show style switcher when showHeatmap is true', async () => {
    let onMapLoad: () => void = () => {};
    onMock.mockImplementation((event: string, callback: () => void) => {
      if (event === 'load') onMapLoad = callback;
    });

    render(<Map showHeatmap={true} />);

    await import('react').then((React) => {
      React.act(() => {
        onMapLoad();
      });
    });

    expect(screen.queryByTestId('style-switcher')).toBeNull();
  });

  it('reads saved style from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('hybrid');

    render(<Map />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('nasstat-map-style');
  });

  // === API key configuration tests (issue #73) ===

  it('applies real API key to maptilersdk.config when env var is set', async () => {
    const maptilersdk = await import('@maptiler/sdk');
    const originalKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    try {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = 'y9bRvFcitlLGhZuveNzL';
      render(<Map />);
      expect(maptilersdk.config.apiKey).toBe('y9bRvFcitlLGhZuveNzL');
    } finally {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = originalKey;
    }
  });

  it('uses empty apiKey when env var is "placeholder"', async () => {
    const maptilersdk = await import('@maptiler/sdk');
    const originalKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    try {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = 'placeholder';
      render(<Map />);
      expect(maptilersdk.config.apiKey).toBe('');
    } finally {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = originalKey;
    }
  });

  it('uses empty apiKey when env var is "your-maptiler-key-here"', async () => {
    const maptilersdk = await import('@maptiler/sdk');
    const originalKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    try {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = 'your-maptiler-key-here';
      render(<Map />);
      expect(maptilersdk.config.apiKey).toBe('');
    } finally {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = originalKey;
    }
  });

  it('uses empty apiKey when env var is undefined', async () => {
    const maptilersdk = await import('@maptiler/sdk');
    const originalKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    try {
      delete process.env.NEXT_PUBLIC_MAPTILER_KEY;
      render(<Map />);
      expect(maptilersdk.config.apiKey).toBe('');
    } finally {
      process.env.NEXT_PUBLIC_MAPTILER_KEY = originalKey;
    }
  });
});
