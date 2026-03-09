import { expect, test } from 'vitest';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  ROLE_HIERARCHY,
  getEscalationTarget,
  isOfficialRole,
  type Role,
} from './roles';

test('ROLES contains all four civic roles', () => {
  expect(ROLES).toContain('citizen');
  expect(ROLES).toContain('obec');
  expect(ROLES).toContain('kraj');
  expect(ROLES).toContain('ministerstvo');
  expect(ROLES.length).toBe(4);
});

test('ROLE_LABELS has Czech labels for every role', () => {
  for (const role of ROLES) {
    expect(ROLE_LABELS[role]).toBeTruthy();
  }
  expect(ROLE_LABELS.citizen).toBe('Občan');
  expect(ROLE_LABELS.obec).toBe('Obec');
  expect(ROLE_LABELS.kraj).toBe('Kraj');
  expect(ROLE_LABELS.ministerstvo).toBe('Ministerstvo');
});

test('ROLE_BADGE_COLORS has a color for every role', () => {
  for (const role of ROLES) {
    expect(ROLE_BADGE_COLORS[role]).toBeTruthy();
  }
});

test('ROLE_HIERARCHY lists all roles in ascending authority order', () => {
  expect(ROLE_HIERARCHY[0]).toBe('citizen');
  expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe('ministerstvo');
  expect(ROLE_HIERARCHY.length).toBe(ROLES.length);
});

test('getEscalationTarget: citizen escalates to obec', () => {
  expect(getEscalationTarget('citizen')).toBe('obec');
});

test('getEscalationTarget: obec escalates to kraj', () => {
  expect(getEscalationTarget('obec')).toBe('kraj');
});

test('getEscalationTarget: kraj escalates to ministerstvo', () => {
  expect(getEscalationTarget('kraj')).toBe('ministerstvo');
});

test('getEscalationTarget: ministerstvo has no escalation target', () => {
  expect(getEscalationTarget('ministerstvo')).toBeNull();
});

test('isOfficialRole: citizen is not official', () => {
  expect(isOfficialRole('citizen')).toBe(false);
});

test('isOfficialRole: obec, kraj, ministerstvo are official', () => {
  expect(isOfficialRole('obec')).toBe(true);
  expect(isOfficialRole('kraj')).toBe(true);
  expect(isOfficialRole('ministerstvo')).toBe(true);
});
