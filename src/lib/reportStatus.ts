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

/** Admin panel variant — includes dark-mode classes and yellow for pending. */
export const ADMIN_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
