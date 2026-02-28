'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ center = [14.4378, 50.0755], zoom = 12 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey || apiKey === 'your-maptiler-key-here') {
      console.warn('MapTiler API key is missing. Using default OpenStreetMap style.');
    }

    const style = apiKey && apiKey !== 'your-maptiler-key-here'
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
      : 'https://demotiles.maplibre.org/style.json';

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: style,
      center: center,
      zoom: zoom,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      setIsLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [center, zoom]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" data-testid="map-container" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <p className="text-zinc-500">Načítám mapu...</p>
        </div>
      )}
    </div>
  );
};

export default Map;
