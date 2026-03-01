'use client';

import { useState, useTransition } from 'react';
import { updateReportStatus } from './actions';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Čeká',
  in_review: 'V řešení',
  resolved: 'Vyřešeno',
  rejected: 'Zamítnuto',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface Report {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  rating: number | null;
  created_at: string;
}

interface AdminClientProps {
  reports: Report[];
}

export default function AdminClient({ reports }: AdminClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    () => Object.fromEntries(reports.map((r) => [r.id, r.status]))
  );

  function handleStatusChange(reportId: string, newStatus: string) {
    const previousStatus = statuses[reportId];
    setError(null);
    setUpdatingId(reportId);
    setStatuses((prev) => ({ ...prev, [reportId]: newStatus }));
    startTransition(async () => {
      try {
        await updateReportStatus(reportId, newStatus);
      } catch (err) {
        setStatuses((prev) => ({ ...prev, [reportId]: previousStatus }));
        setError(err instanceof Error ? err.message : 'Nastala chyba.');
      } finally {
        setUpdatingId(null);
      }
    });
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">Žádná hlášení k zobrazení.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">
                  Název
                </th>
                <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">
                  Kategorie
                </th>
                <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">
                  Hodnocení
                </th>
                <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">
                  Datum
                </th>
                <th className="pb-3 font-semibold text-zinc-700 dark:text-zinc-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {report.title}
                    </div>
                    {report.description && (
                      <div className="mt-0.5 max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {report.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                    {report.category ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                    {report.rating ? `${report.rating}/5` : '—'}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                    {new Date(report.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status] ?? ''}`}
                      >
                        {STATUS_LABELS[report.status] ?? report.status}
                      </span>
                      <select
                        aria-label={`Změnit status pro ${report.title}`}
                        value={statuses[report.id]}
                        disabled={isPending && updatingId === report.id}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <option value="pending">Čeká</option>
                        <option value="in_review">V řešení</option>
                        <option value="resolved">Vyřešeno</option>
                        <option value="rejected">Zamítnuto</option>
                      </select>
                      {isPending && updatingId === report.id && (
                        <span className="text-xs text-zinc-400">Ukládám…</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
