/**
 * Reverse geocoding via MapTiler Geocoding API.
 * Returns Czech administrative region data for a given coordinate.
 * All errors are silently swallowed — region fields are optional.
 */

export interface RegionData {
  region_kraj: string | null;
  region_orp: string | null;
  region_obec: string | null;
}

interface GeocodingContext {
  id: string;
  text: string;
}

interface GeocodingFeature {
  properties: {
    name?: string;
    place_type?: string[];
    context?: GeocodingContext[];
  };
}

interface GeocodingResponse {
  features?: GeocodingFeature[];
}

/**
 * Calls MapTiler reverse geocoding for (lng, lat) and extracts
 * region_kraj / region_orp / region_obec from the first feature's context.
 *
 * Returns null values on any error (network failure, missing key, etc.).
 */
export async function reverseGeocode(lng: number, lat: number): Promise<RegionData> {
  const empty: RegionData = { region_kraj: null, region_orp: null, region_obec: null };

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!apiKey || apiKey === 'your-maptiler-key-here' || apiKey === 'placeholder') {
    return empty;
  }

  try {
    const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}&language=cs`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return empty;

    const data: GeocodingResponse = await res.json();
    const feature = data.features?.[0];
    if (!feature) return empty;

    const context: GeocodingContext[] = feature.properties?.context ?? [];

    let region_kraj: string | null = null;
    let region_orp: string | null = null;
    let region_obec: string | null = null;

    for (const entry of context) {
      const id = entry.id ?? '';
      if (id.startsWith('region.')) {
        region_kraj = entry.text ?? null;
      } else if (id.startsWith('county.') || id.startsWith('district.')) {
        region_orp = entry.text ?? null;
      } else if (id.startsWith('locality.') || id.startsWith('place.')) {
        region_obec = entry.text ?? null;
      }
    }

    // Fallback: use feature name as obec if context didn't provide one
    if (!region_obec && feature.properties?.name) {
      region_obec = feature.properties.name;
    }

    return { region_kraj, region_orp, region_obec };
  } catch {
    return empty;
  }
}
