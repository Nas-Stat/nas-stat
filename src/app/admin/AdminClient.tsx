'use client';

import { useState, useTransition } from 'react';
import { updateReportStatus, deleteTopic, deleteComment, approveRole, denyRole } from './actions';
import { STATUS_LABELS, ADMIN_STATUS_COLORS } from '@/lib/reportStatus';

interface Report {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  rating: number | null;
  created_at: string;
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  profile_id: string;
  topic_id: string | null;
  report_id: string | null;
  created_at: string;
}

interface PendingVerification {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface AdminClientProps {
  reports: Report[];
  topics: Topic[];
  comments: Comment[];
  pendingVerifications: PendingVerification[];
}

type Tab = 'reports' | 'topics' | 'comments' | 'verifications';

export default function AdminClient({ reports, topics, comments, pendingVerifications }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    () => Object.fromEntries(reports.map((r) => [r.id, r.status]))
  );
  const [deletedTopicIds, setDeletedTopicIds] = useState<Set<string>>(new Set());
  const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
  const [resolvedVerificationIds, setResolvedVerificationIds] = useState<Set<string>>(new Set());

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

  function handleDeleteTopic(topicId: string, topicTitle: string) {
    if (!window.confirm(`Opravdu chcete smazat téma „${topicTitle}"? Tato akce je nevratná a smaže i všechny komentáře a hlasy tématu.`)) {
      return;
    }
    setError(null);
    setUpdatingId(topicId);
    startTransition(async () => {
      try {
        await deleteTopic(topicId);
        setDeletedTopicIds((prev) => new Set(prev).add(topicId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nastala chyba.');
      } finally {
        setUpdatingId(null);
      }
    });
  }

  function handleDeleteComment(commentId: string) {
    if (!window.confirm('Opravdu chcete smazat tento komentář? Tato akce je nevratná.')) {
      return;
    }
    setError(null);
    setUpdatingId(commentId);
    startTransition(async () => {
      try {
        await deleteComment(commentId);
        setDeletedCommentIds((prev) => new Set(prev).add(commentId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nastala chyba.');
      } finally {
        setUpdatingId(null);
      }
    });
  }

  const visibleTopics = topics.filter((t) => !deletedTopicIds.has(t.id));
  const visibleComments = comments.filter((c) => !deletedCommentIds.has(c.id));
  const visibleVerifications = pendingVerifications.filter((v) => !resolvedVerificationIds.has(v.id));

  function handleApproveRole(profileId: string) {
    setError(null);
    setUpdatingId(profileId);
    startTransition(async () => {
      try {
        await approveRole(profileId);
        setResolvedVerificationIds((prev) => new Set(prev).add(profileId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nastala chyba.');
      } finally {
        setUpdatingId(null);
      }
    });
  }

  function handleDenyRole(profileId: string) {
    setError(null);
    setUpdatingId(profileId);
    startTransition(async () => {
      try {
        await denyRole(profileId);
        setResolvedVerificationIds((prev) => new Set(prev).add(profileId));
      } catch (err) {
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

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
        {(['reports', 'topics', 'comments', 'verifications'] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            reports: `Hlášení (${reports.length})`,
            topics: `Témata (${visibleTopics.length})`,
            comments: `Komentáře (${visibleComments.length})`,
            verifications: `Verifikace rolí (${visibleVerifications.length})`,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Reports tab */}
      {activeTab === 'reports' && (
        reports.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">Žádná hlášení k zobrazení.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Název</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Kategorie</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Hodnocení</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Datum</th>
                  <th className="pb-3 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{report.title}</div>
                      {report.description && (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{report.category ?? '—'}</td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {report.rating ? `${report.rating}/5` : '—'}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(report.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ADMIN_STATUS_COLORS[report.status] ?? ''}`}
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
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
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
        )
      )}

      {/* Topics tab */}
      {activeTab === 'topics' && (
        visibleTopics.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">Žádná témata k zobrazení.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Název</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Datum</th>
                  <th className="pb-3 font-semibold text-zinc-700 dark:text-zinc-300">Akce</th>
                </tr>
              </thead>
              <tbody>
                {visibleTopics.map((topic) => (
                  <tr key={topic.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{topic.title}</div>
                      {topic.description && (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {topic.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(topic.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3">
                      <button
                        aria-label={`Smazat téma ${topic.title}`}
                        disabled={isPending && updatingId === topic.id}
                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isPending && updatingId === topic.id ? 'Mažu…' : 'Smazat'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Comments tab */}
      {activeTab === 'comments' && (
        visibleComments.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">Žádné komentáře k zobrazení.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Obsah</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Cíl</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Datum</th>
                  <th className="pb-3 font-semibold text-zinc-700 dark:text-zinc-300">Akce</th>
                </tr>
              </thead>
              <tbody>
                {visibleComments.map((comment) => (
                  <tr key={comment.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4">
                      <div className="max-w-sm truncate text-zinc-900 dark:text-zinc-100">
                        {comment.content}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-500 dark:text-zinc-400">
                      {comment.topic_id ? `Téma` : `Hlášení`}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(comment.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3">
                      <button
                        aria-label="Smazat komentář"
                        disabled={isPending && updatingId === comment.id}
                        onClick={() => handleDeleteComment(comment.id)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isPending && updatingId === comment.id ? 'Mažu…' : 'Smazat'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {/* Verifications tab */}
      {activeTab === 'verifications' && (
        visibleVerifications.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">Žádné čekající žádosti o verifikaci.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-700">
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Uživatel</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Žádaná role</th>
                  <th className="pb-3 pr-4 font-semibold text-zinc-700 dark:text-zinc-300">Datum registrace</th>
                  <th className="pb-3 font-semibold text-zinc-700 dark:text-zinc-300">Akce</th>
                </tr>
              </thead>
              <tbody>
                {visibleVerifications.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {v.full_name ?? v.username ?? v.id}
                      </div>
                      {v.username && v.full_name && (
                        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">@{v.username}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.role === 'obec'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : v.role === 'kraj'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {v.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(v.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          aria-label={`Schválit roli pro ${v.full_name ?? v.username ?? v.id}`}
                          disabled={isPending && updatingId === v.id}
                          onClick={() => handleApproveRole(v.id)}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {isPending && updatingId === v.id ? 'Ukládám…' : 'Schválit'}
                        </button>
                        <button
                          aria-label={`Zamítnout roli pro ${v.full_name ?? v.username ?? v.id}`}
                          disabled={isPending && updatingId === v.id}
                          onClick={() => handleDenyRole(v.id)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isPending && updatingId === v.id ? 'Ukládám…' : 'Zamítnout'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
