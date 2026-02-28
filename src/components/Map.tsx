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
}

const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
const DEFAULT_ZOOM = 12;

const Map: React.FC<MapProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  reports = [],
  selectedLocation = null,
  onMapClick,
  readOnly = false,
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

  // Update report markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers for reports
    reports.forEach((report) => {
      const color = report.rating && report.rating <= 2 ? '#ef4444' : '#3b82f6';
      const marker = new maplibregl.Marker({ color })
        .setLngLat([report.location.lng, report.location.lat])
        .addTo(mapRef.current!);

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${report.title}</h3>
          <p class="text-sm">${report.description || ''}</p>
          <div class="mt-1 flex items-center">
            <span class="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100">${report.category || 'Bez kategorie'}</span>
            <span class="ml-2 text-xs text-zinc-500">${'★'.repeat(report.rating || 0)}</span>
          </div>
        </div>
      `);
      marker.setPopup(popup);

      markersRef.current.push(marker);
    });
  }, [reports, isLoaded]);

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
