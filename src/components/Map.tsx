'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/reportStatus';

export interface Report {
  id: string;
  title: string;
  description: string | null;
  location: {
    lng: number;
    lat: number;
  };
  rating: number | null;
  category: string | null;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
}

type MapStyleKey = 'streets' | 'hybrid' | 'dataviz';

const MAP_STYLES: Record<MapStyleKey, { style: string; label: string }> = {
  streets: { style: maptilersdk.MapStyle.STREETS as unknown as string, label: 'Ulice' },
  hybrid: { style: maptilersdk.MapStyle.HYBRID as unknown as string, label: 'Satelit' },
  dataviz: { style: maptilersdk.MapStyle.DATAVIZ as unknown as string, label: 'Data' },
};

const STYLE_STORAGE_KEY = 'nasstat-map-style';

interface MapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  reports?: Report[];
  selectedLocation?: [number, number] | null;
  onMapClick?: (lng: number, lat: number) => void;
  readOnly?: boolean;
  showHeatmap?: boolean;
}

const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
const DEFAULT_ZOOM = 12;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const Map: React.FC<MapProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  reports = [],
  selectedLocation = null,
  onMapClick,
  readOnly = false,
  showHeatmap = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);
  const selectionMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine initial style: heatmap defaults to dataviz, otherwise check localStorage
  const getInitialStyle = (): MapStyleKey => {
    if (showHeatmap) return 'dataviz';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STYLE_STORAGE_KEY);
      if (saved && saved in MAP_STYLES) return saved as MapStyleKey;
    }
    return 'streets';
  };

  const [activeStyle, setActiveStyle] = useState<MapStyleKey>(getInitialStyle);

  // Store callbacks in refs to avoid re-initializing the map when they change
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map - only once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    maptilersdk.config.apiKey =
      apiKey && apiKey !== 'your-maptiler-key-here' && apiKey !== 'placeholder'
        ? apiKey
        : '';

    const initialStyle = showHeatmap ? 'dataviz' : getInitialStyle();

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[initialStyle].style,
      center: center,
      zoom: zoom,
    });

    mapRef.current = map;

    map.addControl(new maptilersdk.NavigationControl(), 'top-right');

    map.on('load', () => {
      setIsLoaded(true);
    });

    map.on('click', (e) => {
      if (!readOnly && onMapClickRef.current) {
        onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle style changes after initialization
  const handleStyleChange = useCallback(
    (styleKey: MapStyleKey) => {
      if (!mapRef.current || styleKey === activeStyle) return;

      setActiveStyle(styleKey);
      localStorage.setItem(STYLE_STORAGE_KEY, styleKey);

      const map = mapRef.current;
      map.setStyle(MAP_STYLES[styleKey].style);

      // setStyle removes all custom layers — re-add them after the new style loads
      map.once('styledata', () => {
        // Re-add heatmap or markers by triggering the reports effect
        // We force this by temporarily setting isLoaded
        setIsLoaded(false);
        // Use microtask to let React flush the false state, then set true to re-trigger
        queueMicrotask(() => setIsLoaded(true));
      });
    },
    [activeStyle],
  );

  // Update map view when center or zoom changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Simple check to avoid unnecessary jumping
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();

    if (
      Math.abs(currentCenter.lng - center[0]) > 0.0001 ||
      Math.abs(currentCenter.lat - center[1]) > 0.0001 ||
      Math.abs(currentZoom - zoom) > 0.1
    ) {
      mapRef.current.jumpTo({
        center: center,
        zoom: zoom,
      });
    }
  }, [center, zoom, isLoaded]);

  // Update report markers and heatmap
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove heatmap layer and source if they exist
    if (map.getLayer('reports-heatmap')) map.removeLayer('reports-heatmap');
    if (map.getSource('reports-source')) map.removeSource('reports-source');

    if (showHeatmap && reports.length > 0) {
      // Add data source for heatmap
      map.addSource('reports-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: reports.map((report) => ({
            type: 'Feature',
            properties: {
              mag: 6 - (report.rating || 3), // Inverse rating for weight (lower rating = more "heat")
            },
            geometry: {
              type: 'Point',
              coordinates: [report.location.lng, report.location.lat],
            },
          })),
        },
      });

      // Add heatmap layer
      map.addLayer({
        id: 'reports-heatmap',
        type: 'heatmap',
        source: 'reports-source',
        maxzoom: 15,
        paint: {
          // Increase the heatmap weight based on frequency and property magnitude
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, 0,
            6, 1
          ],
          // Increase the heatmap color weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparancy color
          // to create a blur-like effect.
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            15, 0.5
          ],
        },
      });
    } else {
      // Add new markers for reports
      reports.forEach((report) => {
        const color = report.rating && report.rating <= 2 ? '#ef4444' : '#3b82f6';

        const marker = new maptilersdk.Marker({ color })
          .setLngLat([report.location.lng, report.location.lat])
          .addTo(map);

        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 min-w-[200px]">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLORS[report.status] ?? STATUS_COLORS.pending}">
                ${STATUS_LABELS[report.status] ?? report.status}
              </span>
              <span class="text-xs text-zinc-500">${'★'.repeat(report.rating || 0)}</span>
            </div>
            <a href="/reports/${report.id}" class="font-bold text-zinc-900 hover:underline">${escapeHtml(report.title)}</a>
            <p class="text-sm text-zinc-600 mt-1">${escapeHtml(report.description || '')}</p>
            <div class="mt-2 pt-2 border-t border-zinc-100">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">${escapeHtml(report.category || 'Bez kategorie')}</span>
            </div>
          </div>
        `);
        marker.setPopup(popup);

        markersRef.current.push(marker);
      });
    }
  }, [reports, isLoaded, showHeatmap]);

  // Update selection marker
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (selectedLocation) {
      selectionMarkerRef.current = new maptilersdk.Marker({ color: '#10b981', draggable: true })
        .setLngLat(selectedLocation)
        .addTo(mapRef.current!);

      selectionMarkerRef.current.on('dragend', () => {
        if (selectionMarkerRef.current && onMapClickRef.current) {
          const lngLat = selectionMarkerRef.current.getLngLat();
          onMapClickRef.current(lngLat.lng, lngLat.lat);
        }
      });
    }
  }, [selectedLocation, isLoaded]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        data-testid="map-container"
      />
      {isLoaded && !showHeatmap && (
        <div
          className="absolute bottom-4 left-4 z-10 flex gap-1 rounded-lg bg-white/90 p-1 shadow-md backdrop-blur-sm dark:bg-zinc-800/90"
          data-testid="style-switcher"
        >
          {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleStyleChange(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeStyle === key
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {MAP_STYLES[key].label}
            </button>
          ))}
        </div>
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <p className="text-zinc-500">Načítám mapu...</p>
        </div>
      )}
    </div>
  );
};

export default Map;
