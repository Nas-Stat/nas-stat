'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Map from '@/components/Map';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/reportStatus';
import { ROLE_LABELS, ROLE_BADGE_COLORS, getEscalationTarget, type Role } from '@/lib/roles';
import { claimReport, escalateReport, resolveReport, rejectReport } from '../actions';

export interface ReportDetail {
  id: string;
  title: string;
  description: string | null;
  location: { lng: number; lat: number } | null;
  rating: number | null;
  category: string | null;
  status: string;
  createdAt: string;
  assignedTo: string | null;
  escalatedToRole: Role | null;
}

interface ReportDetailClientProps {
  report: ReportDetail;
  assignedProfile: { username: string | null; role: Role } | null;
  currentProfile: { role: Role; role_verified: boolean } | null;
  currentUserId: string | null;
}

export default function ReportDetailClient({
  report,
  assignedProfile,
  currentProfile,
  currentUserId,
}: ReportDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isVerifiedOfficial =
    currentProfile &&
    currentProfile.role !== 'citizen' &&
    currentProfile.role_verified;

  const isAssignee = report.assignedTo === currentUserId;

  const canClaim =
    isVerifiedOfficial &&
    (report.status === 'pending' ||
      (report.status === 'escalated' &&
        report.escalatedToRole === currentProfile?.role));

  const canActAsAssignee = isVerifiedOfficial && isAssignee && report.status === 'in_review';

  const escalationTarget =
    isVerifiedOfficial && currentProfile ? getEscalationTarget(currentProfile.role) : null;

  function handleAction(action: () => Promise<{ success: boolean }>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Něco se nepovedlo.');
      }
    });
  }

  const mapReports =
    report.location
      ? [
          {
            id: report.id,
            title: report.title,
            description: report.description,
            location: report.location,
            rating: report.rating,
            category: report.category,
            status: report.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8" data-testid="report-detail">
      {/* Back link */}
      <Link
        href="/reports"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        data-testid="back-link"
      >
        ← Zpět na hlášení
      </Link>

      {/* Map preview */}
      {report.location && (
        <div className="mb-6 h-56 w-full overflow-hidden rounded-xl border border-zinc-200 shadow-sm" data-testid="map-preview">
          <Map
            reports={mapReports}
            center={[report.location.lng, report.location.lat]}
            zoom={14}
            readOnly
          />
        </div>
      )}

      {/* Title and status */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-zinc-900" data-testid="report-title">
          {report.title}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[report.status] ?? STATUS_COLORS.pending}`}
          data-testid="status-badge"
        >
          {STATUS_LABELS[report.status] ?? report.status}
        </span>
      </div>

      {/* Description */}
      {report.description && (
        <p className="mb-4 text-zinc-700" data-testid="report-description">
          {report.description}
        </p>
      )}

      {/* Meta info */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-zinc-500">
        {report.category && (
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600" data-testid="report-category">
            {report.category}
          </span>
        )}
        {report.rating != null && (
          <span data-testid="report-rating">{'★'.repeat(report.rating)}{'☆'.repeat(5 - report.rating)}</span>
        )}
        <span data-testid="report-date">
          {new Date(report.createdAt).toLocaleDateString('cs-CZ')}
        </span>
      </div>

      {/* Escalation info */}
      {report.status === 'escalated' && report.escalatedToRole && (
        <div
          className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
          data-testid="escalation-info"
        >
          Eskalováno na:{' '}
          <span className="font-semibold">{ROLE_LABELS[report.escalatedToRole]}</span>
        </div>
      )}

      {/* Assigned official */}
      {assignedProfile && (
        <div className="mb-6 flex items-center gap-2 text-sm" data-testid="assigned-official">
          <span className="text-zinc-500">Přiřazeno:</span>
          <span className="font-medium text-zinc-800">
            {assignedProfile.username ?? 'Neznámý'}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[assignedProfile.role]}`}
            data-testid="assigned-role-badge"
          >
            {ROLE_LABELS[assignedProfile.role]}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          data-testid="action-error"
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      {isVerifiedOfficial && (
        <div className="flex flex-wrap gap-3" data-testid="action-buttons">
          {canClaim && (
            <button
              onClick={() => handleAction(() => claimReport(report.id))}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              data-testid="btn-claim"
            >
              Převzít
            </button>
          )}
          {canActAsAssignee && (
            <>
              <button
                onClick={() => handleAction(() => resolveReport(report.id))}
                disabled={isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                data-testid="btn-resolve"
              >
                Vyřešit
              </button>
              <button
                onClick={() => handleAction(() => rejectReport(report.id))}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                data-testid="btn-reject"
              >
                Zamítnout
              </button>
              {escalationTarget && (
                <button
                  onClick={() => handleAction(() => escalateReport(report.id))}
                  disabled={isPending}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  data-testid="btn-escalate"
                >
                  Eskalovat na {ROLE_LABELS[escalationTarget]}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
