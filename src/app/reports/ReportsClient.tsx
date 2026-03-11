'use client';

import React, { useState, useCallback } from 'react';
import Map, { Report } from '@/components/Map';
import { createReport } from './actions';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ReportForm from './ReportForm';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/reportStatus';

interface Category {
  slug: string;
  label: string;
}

interface ReportsClientProps {
  initialReports: Report[];
  user: User | null;
  currentPage: number;
  totalPages: number;
  currentStatus: string;
  currentCategory: string;
  categories: Category[];
}

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
  categories,
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

  const openFormWithoutLocation = useCallback(() => {
    setShowForm(true);
    setError(null);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setSelectedLocation(null);
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (selectedLocation) {
      formData.append('lng', selectedLocation[0].toString());
      formData.append('lat', selectedLocation[1].toString());
    }

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
        className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 flex-col gap-2 rounded-xl bg-white p-3 shadow-lg dark:bg-zinc-900"
      >
        <div
          data-testid="status-filter"
          role="group"
          aria-label="Filtrovat podle stavu"
          className="flex flex-wrap gap-1.5"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => router.push(buildUrl({ status: opt.value, page: 1 }))}
              aria-pressed={currentStatus === opt.value}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currentStatus === opt.value
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div
          data-testid="category-filter"
          role="group"
          aria-label="Filtrovat podle kategorie"
          className="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            onClick={() => router.push(buildUrl({ category: '', page: 1 }))}
            aria-pressed={currentCategory === ''}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              currentCategory === ''
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Vše
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => router.push(buildUrl({ category: cat.slug, page: 1 }))}
              aria-pressed={currentCategory === cat.slug}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                currentCategory === cat.slug
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
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

      {/* FAB for logged-in users when form is closed */}
      {user && !showForm && (
        <button
          data-testid="report-without-location-btn"
          onClick={openFormWithoutLocation}
          aria-label="Nahlásit podnět"
          className="absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition-all hover:scale-105 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Report Form Drawer/Sidebar */}
      {showForm && (
        <ReportForm
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSubmitting={isSubmitting}
          categories={categories}
          error={error}
          onErrorClose={() => setError(null)}
          hasLocation={selectedLocation !== null}
        />
      )}
    </div>
  );
}
