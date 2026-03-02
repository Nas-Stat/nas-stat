import { describe, it, expect } from 'vitest';
import { STATUS_LABELS, STATUS_COLORS } from './reportStatus';

const KNOWN_STATUSES = ['pending', 'in_review', 'resolved', 'rejected'] as const;

describe('reportStatus', () => {
  it('STATUS_LABELS covers all known statuses', () => {
    for (const status of KNOWN_STATUSES) {
      expect(STATUS_LABELS[status], `missing label for status "${status}"`).toBeDefined();
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it('STATUS_COLORS covers all known statuses', () => {
    for (const status of KNOWN_STATUSES) {
      expect(STATUS_COLORS[status], `missing color for status "${status}"`).toBeDefined();
      expect(STATUS_COLORS[status].length).toBeGreaterThan(0);
    }
  });

  it('STATUS_LABELS has correct Czech strings', () => {
    expect(STATUS_LABELS.pending).toBe('Čeká');
    expect(STATUS_LABELS.in_review).toBe('V řešení');
    expect(STATUS_LABELS.resolved).toBe('Vyřešeno');
    expect(STATUS_LABELS.rejected).toBe('Zamítnuto');
  });

  it('STATUS_COLORS maps to Tailwind class strings with both bg and text classes', () => {
    for (const status of KNOWN_STATUSES) {
      const cls = STATUS_COLORS[status];
      expect(cls).toMatch(/bg-/);
      expect(cls).toMatch(/text-/);
    }
  });

  it('STATUS_LABELS and STATUS_COLORS have identical key sets', () => {
    const labelKeys = Object.keys(STATUS_LABELS).sort();
    const colorKeys = Object.keys(STATUS_COLORS).sort();
    expect(labelKeys).toEqual(colorKeys);
  });
});
