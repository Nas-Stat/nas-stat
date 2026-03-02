export const STATUS_LABELS: Record<string, string> = {
  pending: 'Čeká',
  in_review: 'V řešení',
  resolved: 'Vyřešeno',
  rejected: 'Zamítnuto',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700',
  in_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};
