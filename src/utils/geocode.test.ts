import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reverseGeocode } from './geocode';

const VALID_KEY = 'test-valid-key';

function makeResponse(features: object[]): Response {
  return new Response(JSON.stringify({ features }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_KEY', VALID_KEY);
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns null values when API key is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_KEY', '');
    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result).toEqual({ region_kraj: null, region_orp: null, region_obec: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null values when API key is placeholder', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAPTILER_KEY', 'your-maptiler-key-here');
    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result).toEqual({ region_kraj: null, region_orp: null, region_obec: null });
  });

  it('calls the MapTiler geocoding endpoint with correct coordinates', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse([]));
    await reverseGeocode(16.6068, 49.1951);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('16.6068,49.1951'),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(VALID_KEY), expect.any(Object));
  });

  it('parses region, county, and locality from context', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeResponse([
        {
          properties: {
            name: 'Žabovřesky',
            context: [
              { id: 'locality.1', text: 'Brno' },
              { id: 'county.2', text: 'Brno' },
              { id: 'region.3', text: 'Jihomoravský kraj' },
              { id: 'country.4', text: 'Czechia' },
            ],
          },
        },
      ]),
    );

    const result = await reverseGeocode(16.6068, 49.1951);
    expect(result).toEqual({
      region_kraj: 'Jihomoravský kraj',
      region_orp: 'Brno',
      region_obec: 'Brno',
    });
  });

  it('uses district. prefix for ORP', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeResponse([
        {
          properties: {
            name: 'Ostrava',
            context: [
              { id: 'place.1', text: 'Ostrava' },
              { id: 'district.2', text: 'Ostrava' },
              { id: 'region.3', text: 'Moravskoslezský kraj' },
            ],
          },
        },
      ]),
    );

    const result = await reverseGeocode(18.2625, 49.8209);
    expect(result).toEqual({
      region_kraj: 'Moravskoslezský kraj',
      region_orp: 'Ostrava',
      region_obec: 'Ostrava',
    });
  });

  it('falls back to feature name for obec when locality is absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeResponse([
        {
          properties: {
            name: 'Praha',
            context: [
              { id: 'region.1', text: 'Hlavní město Praha' },
            ],
          },
        },
      ]),
    );

    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result.region_obec).toBe('Praha');
    expect(result.region_kraj).toBe('Hlavní město Praha');
  });

  it('returns null values when response has no features', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse([]));
    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result).toEqual({ region_kraj: null, region_orp: null, region_obec: null });
  });

  it('returns null values when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result).toEqual({ region_kraj: null, region_orp: null, region_obec: null });
  });

  it('returns null values when API returns non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 401 }),
    );
    const result = await reverseGeocode(14.4378, 50.0755);
    expect(result).toEqual({ region_kraj: null, region_orp: null, region_obec: null });
  });
});
