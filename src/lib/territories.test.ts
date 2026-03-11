import { describe, it, expect } from 'vitest';
import { KRAJE, ORP_LIST } from './territories';
import type { TerritoryLevel } from './territories';

describe('KRAJE', () => {
  it('has exactly 14 regions', () => {
    expect(KRAJE).toHaveLength(14);
  });

  it('each kraj has a unique code and non-empty label', () => {
    const codes = KRAJE.map((k) => k.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(14);
    for (const k of KRAJE) {
      expect(k.label.length).toBeGreaterThan(0);
    }
  });

  it('includes Praha', () => {
    expect(KRAJE.find((k) => k.code === 'CZ010')).toBeDefined();
    expect(KRAJE.find((k) => k.label === 'Hlavní město Praha')).toBeDefined();
  });

  it('includes Moravskoslezský kraj', () => {
    expect(KRAJE.find((k) => k.code === 'CZ080')).toBeDefined();
  });
});

describe('ORP_LIST', () => {
  it('has at least 190 ORP entries', () => {
    expect(ORP_LIST.length).toBeGreaterThanOrEqual(190);
  });

  it('each ORP has a unique code', () => {
    const codes = ORP_LIST.map((o) => o.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(ORP_LIST.length);
  });

  it('every ORP references a valid kraj code', () => {
    const krajCodes = new Set(KRAJE.map((k) => k.code));
    for (const orp of ORP_LIST) {
      expect(krajCodes.has(orp.krajCode), `ORP ${orp.code} has unknown krajCode ${orp.krajCode}`).toBe(true);
    }
  });

  it('all 14 kraje have at least one ORP', () => {
    const krajCodes = new Set(KRAJE.map((k) => k.code));
    const orpKrajCodes = new Set(ORP_LIST.map((o) => o.krajCode));
    for (const code of krajCodes) {
      expect(orpKrajCodes.has(code), `No ORP found for kraj ${code}`).toBe(true);
    }
  });

  it('includes Praha ORP', () => {
    expect(ORP_LIST.find((o) => o.label === 'Praha')).toBeDefined();
  });

  it('includes Brno ORP', () => {
    expect(ORP_LIST.find((o) => o.label === 'Brno')).toBeDefined();
  });
});

describe('TerritoryLevel type', () => {
  it('accepts valid level values', () => {
    const levels: TerritoryLevel[] = ['kraj', 'orp', 'obec'];
    expect(levels).toHaveLength(3);
  });
});
