import { describe, it, expect } from 'vitest';
import { parseLocation } from './geo';

describe('parseLocation', () => {
  it('returns null for null input', () => {
    expect(parseLocation(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseLocation(undefined)).toBeNull();
  });

  it('parses GeoJSON Point object', () => {
    const geojson = { type: 'Point', coordinates: [14.4378, 50.0755] };
    expect(parseLocation(geojson)).toEqual({ lng: 14.4378, lat: 50.0755 });
  });

  it('parses GeoJSON with negative coordinates', () => {
    const geojson = { type: 'Point', coordinates: [-73.9857, 40.7484] };
    expect(parseLocation(geojson)).toEqual({ lng: -73.9857, lat: 40.7484 });
  });

  it('returns null for GeoJSON with empty coordinates array', () => {
    const geojson = { type: 'Point', coordinates: [] };
    expect(parseLocation(geojson)).toBeNull();
  });

  it('parses WKB hex EWKB string (little-endian POINT with SRID)', () => {
    // Build a valid EWKB POINT(14.4378, 50.0755) little-endian with SRID=4326
    const buf = Buffer.alloc(25);
    buf.writeUInt8(0x01, 0);          // little-endian
    buf.writeUInt32LE(0x20000001, 1); // type POINT with SRID flag
    buf.writeUInt32LE(4326, 5);       // SRID
    buf.writeDoubleLE(14.4378, 9);    // X (lng)
    buf.writeDoubleLE(50.0755, 17);   // Y (lat)
    const hex = buf.toString('hex');
    const result = parseLocation(hex);
    expect(result).not.toBeNull();
    expect(result!.lng).toBeCloseTo(14.4378, 10);
    expect(result!.lat).toBeCloseTo(50.0755, 10);
  });

  it('returns null for WKB hex shorter than 25 bytes', () => {
    const buf = Buffer.alloc(20);
    buf.writeUInt8(0x01, 0);
    expect(parseLocation(buf.toString('hex'))).toBeNull();
  });

  it('returns null for non-hex string', () => {
    expect(parseLocation('not-hex-at-all')).toBeNull();
  });

  it('returns null for number input', () => {
    expect(parseLocation(42)).toBeNull();
  });

  it('returns null for big-endian WKB (unsupported)', () => {
    const buf = Buffer.alloc(25);
    buf.writeUInt8(0x00, 0); // big-endian marker — not supported
    expect(parseLocation(buf.toString('hex'))).toBeNull();
  });
});
