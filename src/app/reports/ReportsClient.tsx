'use client';

import React, { useState, useCallback } from 'react';
import Map, { Report } from '@/components/Map';
import { createReport } from './actions';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ReportForm from './ReportForm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/reportStatus';

interface ReportsClientProps {
  initialReports: Report[];
  user: User | null;
  currentPage: number;
  totalPages: number;
  currentStatus: string;
  currentCategory: string;
}

const CATEGORIES = [
  'Infrastruktura',
  'Doprava',
  'Zeleň',
  'Úřad',
  'Bezpečnost',
  'Jiné',
];

const STATUS_OPTIONS = [
  { value: '', label: 'Všechny stavy' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function ReportsClient({
  initialReports,
  user,
  currentPage,
  totalPages,
  currentStatus,
  currentCategory,
}: ReportsClientProps) {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      if (!user) return; // Only logged in users can select location
      setSelectedLocation([lng, lat]);
      setError(null);
      setShowForm(true);
    },
    [user]
  );

  const closeForm = useCallback(() => {
    setShowForm(false);
    setSelectedLocation(null);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLocation || !user) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('lng', selectedLocation[0].toString());
    formData.append('lat', selectedLocation[1].toString());

    try {
      await createReport(formData);
      closeForm();
      // Use Next.js refresh instead of full page reload
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se nepovedlo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildUrl = useCallback(
    (overrides: { page?: number; status?: string; category?: string }) => {
      const p = overrides.page ?? currentPage;
      const s = overrides.status !== undefined ? overrides.status : currentStatus;
      const c =
        overrides.category !== undefined ? overrides.category : currentCategory;
      const params = new URLSearchParams();
      if (s) params.set('status', s);
      if (c) params.set('category', c);
      if (p > 1) params.set('page', p.toString());
      const qs = params.toString();
      return `/reports${qs ? `?${qs}` : ''}`;
    },
    [currentPage, currentStatus, currentCategory]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      router.push(buildUrl({ status: e.target.value, page: 1 }));
    },
    [router, buildUrl]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      router.push(buildUrl({ category: e.target.value, page: 1 }));
    },
    [router, buildUrl]
  );

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) router.push(buildUrl({ page: currentPage - 1 }));
  }, [router, buildUrl, currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) router.push(buildUrl({ page: currentPage + 1 }));
  }, [router, buildUrl, currentPage, totalPages]);

  return (
    <div className="relative h-full w-full">
      <Map
        reports={initialReports}
        selectedLocation={selectedLocation}
        onMapClick={handleMapClick}
      />

      {/* Filter bar */}
      <div
        data-testid="filter-bar"
        className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg dark:bg-zinc-900"
      >
        <select
          aria-label="Filtrovat podle stavu"
          value={currentStatus}
          onChange={handleStatusChange}
          className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrovat podle kategorie"
          value={currentCategory}
          onChange={handleCategoryChange}
          className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Všechny kategorie</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination bar */}
      {totalPages > 1 && (
        <div
          data-testid="pagination-bar"
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-lg dark:bg-zinc-900"
        >
          <button
            aria-label="Předchozí strana"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="rounded p-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {currentPage} / {totalPages}
          </span>
          <button
            aria-label="Další strana"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="rounded p-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Floating UI for logged out users */}
      {!user && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900 ${totalPages > 1 ? 'bottom-20' : 'bottom-6'}`}
        >
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Pro nahlášení podnětu se prosím{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              přihlaste
            </a>
            .
          </p>
        </div>
      )}

      {/* Report Form Drawer/Sidebar */}
      {showForm && (
        <ReportForm
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSubmitting={isSubmitting}
          categories={CATEGORIES}
          error={error}
          onErrorClose={() => setError(null)}
        />
      )}
    </div>
  );
}
