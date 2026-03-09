export const ROLES = ['citizen', 'obec', 'kraj', 'ministerstvo'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  citizen: 'Občan',
  obec: 'Obec',
  kraj: 'Kraj',
  ministerstvo: 'Ministerstvo',
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  citizen: 'bg-zinc-100 text-zinc-700',
  obec: 'bg-green-100 text-green-700',
  kraj: 'bg-blue-100 text-blue-700',
  ministerstvo: 'bg-purple-100 text-purple-700',
};

/** Higher index = higher authority */
export const ROLE_HIERARCHY: Role[] = ['citizen', 'obec', 'kraj', 'ministerstvo'];

/**
 * Returns the next escalation target for a given role, or null if already at the top.
 */
export function getEscalationTarget(role: Role): Exclude<Role, 'citizen'> | null {
  const idx = ROLE_HIERARCHY.indexOf(role);
  if (idx === -1 || idx >= ROLE_HIERARCHY.length - 1) return null;
  return ROLE_HIERARCHY[idx + 1] as Exclude<Role, 'citizen'>;
}

export function isOfficialRole(role: Role): boolean {
  return role !== 'citizen';
}
