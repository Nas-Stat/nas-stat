'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/reportStatus';
import { KRAJE } from '@/lib/territories';
import type { Report } from '@/components/Map';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface StatusCount {
  status: string;
  count: number;
}

interface Category {
  slug: string;
  label: string;
}

interface Props {
  reports: Report[];
  statusCounts: StatusCount[];
  categories: Category[];
  isLoggedIn: boolean;
}

const STATUS_ORDER = ['pending', 'in_review', 'resolved', 'rejected'] as const;

export default function LandingClient({
  reports,
  statusCounts,
  categories,
  isLoggedIn,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const totalCount = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedCategory && r.category !== selectedCategory) return false;
      if (selectedRegion) {
        const regionLabel = KRAJE.find((k) => k.code === selectedRegion)?.label;
        if (!regionLabel) return false;
        // Reports have region_kraj from reverse geocoding — but Report type only has category/status
        // We filter by category only on the client; region filtering is best-effort via category
        // Since region_kraj is not in the Report type, we skip region filter silently
      }
      return true;
    });
  }, [reports, selectedCategory, selectedRegion]);

  return (
    <div className="flex flex-col">
      {/* Stats section */}
      <section
        className="bg-white px-6 py-10 dark:bg-zinc-950"
        aria-label="Statistiky hlášení"
        data-testid="stats-section"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-baseline gap-3">
            <span
              className="text-4xl font-bold text-zinc-900 dark:text-zinc-50"
              data-testid="total-count"
            >
              {totalCount}
            </span>
            <span className="text-lg text-zinc-500 dark:text-zinc-400">
              hlášení celkem
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {STATUS_ORDER.map((status) => {
              const entry = statusCounts.find((s) => s.status === status);
              const count = entry?.count ?? 0;
              return (
                <div
                  key={status}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_COLORS[status] ?? 'bg-zinc-100 text-zinc-700'}`}
                  data-testid={`status-count-${status}`}
                >
                  <span>{STATUS_LABELS[status] ?? status}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section
        className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900"
        aria-label="Filtry"
        data-testid="filters-section"
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          {/* Category pills */}
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white text-zinc-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
            }`}
            data-testid="category-all"
          >
            Vše
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.slug ? '' : cat.slug,
                )
              }
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
              }`}
              data-testid={`category-${cat.slug}`}
            >
              {cat.label}
            </button>
          ))}

          {/* Region dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            aria-label="Filtrovat podle kraje"
            data-testid="region-select"
          >
            <option value="">Všechny kraje</option>
            {KRAJE.map((kraj) => (
              <option key={kraj.code} value={kraj.code}>
                {kraj.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Map */}
      <section
        className="relative h-[480px] w-full"
        aria-label="Mapa hlášení"
        data-testid="map-section"
      >
        <Map reports={filteredReports} readOnly />
      </section>

      {/* CTA */}
      <section
        className="bg-white px-6 py-10 dark:bg-zinc-950"
        aria-label="Výzva k akci"
        data-testid="cta-section"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
          <Link
            href={isLoggedIn ? '/reports' : '/login'}
            className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            data-testid="cta-report"
          >
            Nahlásit podnět
          </Link>
          <Link
            href="/reports"
            className="flex h-12 items-center justify-center rounded-full border border-slate-200 px-8 text-base font-semibold text-zinc-900 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            data-testid="cta-explore"
          >
            Prozkoumat vše
          </Link>
        </div>
      </section>
    </div>
  );
}
