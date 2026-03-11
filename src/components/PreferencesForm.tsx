'use client';

import { useState } from 'react';
import { KRAJE, ORP_LIST, type TerritoryLevel } from '@/lib/territories';

export interface Preferences {
  territory_level: TerritoryLevel | '';
  territories: string[];
  categories: string[];
}

interface Category {
  slug: string;
  label: string;
}

interface PreferencesFormProps {
  initial: Preferences;
  categories: Category[];
  onSubmit: (prefs: Preferences) => Promise<void>;
  submitLabel?: string;
  isPending?: boolean;
}

export default function PreferencesForm({
  initial,
  categories,
  onSubmit,
  submitLabel = 'Uložit',
  isPending = false,
}: PreferencesFormProps) {
  const [level, setLevel] = useState<TerritoryLevel | ''>(initial.territory_level);
  const [territories, setTerritories] = useState<string[]>(initial.territories);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initial.categories);
  const [error, setError] = useState<string | null>(null);

  const territoryOptions =
    level === 'kraj'
      ? KRAJE.map((k) => ({ value: k.label, label: k.label }))
      : level === 'orp'
        ? ORP_LIST.map((o) => ({ value: o.label, label: o.label }))
        : [];

  function toggleTerritory(value: string) {
    setTerritories((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        territory_level: level,
        territories,
        categories: selectedCategories,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala chyba.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="preferences-form">
      {/* Territory level */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
          Úroveň správního celku
        </label>
        <div className="flex flex-wrap gap-2">
          {(['kraj', 'orp'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLevel(l);
                setTerritories([]);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                level === l
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
              data-testid={`level-${l}`}
            >
              {l === 'kraj' ? 'Kraj' : 'ORP'}
            </button>
          ))}
          {level !== '' && (
            <button
              type="button"
              onClick={() => {
                setLevel('');
                setTerritories([]);
              }}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              data-testid="level-clear"
            >
              Zrušit výběr
            </button>
          )}
        </div>
      </div>

      {/* Territory multi-select */}
      {level !== '' && territoryOptions.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
            {level === 'kraj' ? 'Kraje' : 'ORP'}
          </label>
          <div
            className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-zinc-700"
            data-testid="territory-list"
          >
            {territoryOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleTerritory(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  territories.includes(value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
                data-testid={`territory-${value}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
          Kategorie zájmu
        </label>
        <div className="flex flex-wrap gap-2" data-testid="category-list">
          {categories.map(({ slug, label }) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggleCategory(slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategories.includes(slug)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
              data-testid={`category-${slug}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        data-testid="preferences-submit"
      >
        {isPending ? 'Ukládám…' : submitLabel}
      </button>
    </form>
  );
}
