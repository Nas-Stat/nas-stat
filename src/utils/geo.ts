/**
 * Parse location from Supabase GEOGRAPHY column.
 * PostgREST may return either:
 *  - GeoJSON object: { type: "Point", coordinates: [lng, lat] }
 *  - WKB hex string: "0101000020E6100000..." (EWKB with SRID)
 *
 * Returns { lng, lat } or null if unparseable.
 */
export function parseLocation(
  location: unknown
): { lng: number; lat: number } | null {
  if (location == null) return null;

  // GeoJSON object
  if (
    typeof location === 'object' &&
    'coordinates' in (location as Record<string, unknown>) &&
    Array.isArray((location as { coordinates: unknown }).coordinates)
  ) {
    const coords = (location as { coordinates: number[] }).coordinates;
    if (coords.length >= 2) return { lng: coords[0], lat: coords[1] };
  }

  // WKB hex string (EWKB with SRID, little-endian POINT)
  if (typeof location === 'string' && /^[0-9a-fA-F]+$/.test(location)) {
    const buf = Buffer.from(location, 'hex');
    // Minimum size: 1 (endian) + 4 (type) + 4 (srid) + 8 (x) + 8 (y) = 25
    if (buf.length >= 25 && buf[0] === 0x01) {
      const lng = buf.readDoubleLE(9);
      const lat = buf.readDoubleLE(17);
      if (isFinite(lng) && isFinite(lat)) return { lng, lat };
    }
  }

  return null;
}
