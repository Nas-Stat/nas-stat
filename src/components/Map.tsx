'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const selectionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Store callbacks in refs to avoid re-initializing the map when they change
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map - only once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const style =
      apiKey && apiKey !== 'your-maptiler-key-here'
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
        : 'https://demotiles.maplibre.org/style.json';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: style,
      center: center,
      zoom: zoom,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

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
        const statusColors: Record<string, string> = {
          pending: 'bg-zinc-100 text-zinc-700',
          in_review: 'bg-blue-100 text-blue-700',
          resolved: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-700',
        };
        const statusLabels: Record<string, string> = {
          pending: 'Čeká',
          in_review: 'V řešení',
          resolved: 'Vyřešeno',
          rejected: 'Zamítnuto',
        };

        const marker = new maplibregl.Marker({ color })
          .setLngLat([report.location.lng, report.location.lat])
          .addTo(map);

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 min-w-[200px]">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColors[report.status] || statusColors.pending}">
                ${statusLabels[report.status] || report.status}
              </span>
              <span class="text-xs text-zinc-500">${'★'.repeat(report.rating || 0)}</span>
            </div>
            <h3 class="font-bold text-zinc-900">${escapeHtml(report.title)}</h3>
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
      selectionMarkerRef.current = new maplibregl.Marker({ color: '#10b981', draggable: true })
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
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <p className="text-zinc-500">Načítám mapu...</p>
        </div>
      )}
    </div>
  );
};

export default Map;
