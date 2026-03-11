'use client';

import React from 'react';
import { Star, X, AlertCircle, MapPin } from 'lucide-react';

interface Category {
  slug: string;
  label: string;
}

interface ReportFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  categories: Category[];
  error?: string | null;
  onErrorClose?: () => void;
  hasLocation?: boolean;
}

export default function ReportForm({
  onSubmit,
  onClose,
  isSubmitting,
  categories,
  error,
  onErrorClose,
  hasLocation,
}: ReportFormProps) {
  return (
    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:m-4 sm:rounded-2xl sm:inset-y-auto sm:top-4 sm:bottom-4 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Nový podnět
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          type="button"
        >
          <X className="h-6 w-6 text-zinc-500" />
        </button>
      </div>

      <div
        data-testid="location-info-bar"
        className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${hasLocation ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
      >
        <MapPin className="h-4 w-4 shrink-0" />
        {hasLocation ? 'Poloha vybrána' : 'Bez polohy — klikněte na mapu (volitelné)'}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
          {onErrorClose && (
            <button
              onClick={onErrorClose}
              className="ml-auto text-xs underline"
              type="button"
            >
              Zavřít
            </button>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Název podnětu *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="Např. Rozbitý chodník"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Kategorie
          </label>
          <select
            id="category"
            name="category"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
          >
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Hodnocení (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <label key={val} className="cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={val}
                  defaultChecked={val === 3}
                  className="peer sr-only"
                />
                <Star
                  className={`h-8 w-8 text-zinc-300 peer-checked:fill-yellow-400 peer-checked:text-yellow-400`}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Popis
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="Popište podrobněji, o co jde..."
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {isSubmitting ? 'Ukládám...' : 'Odeslat hlášení'}
          </button>
        </div>
      </form>
    </div>
  );
}
