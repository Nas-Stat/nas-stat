'use client';

import React, { useState } from 'react';
import Map, { Report } from '@/components/Map';
import { createReport } from './actions';
import { User } from '@supabase/supabase-js';
import { Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportsClientProps {
  initialReports: Report[];
  user: User | null;
}

const CATEGORIES = [
  'Infrastruktura',
  'Doprava',
  'Zeleň',
  'Úřad',
  'Bezpečnost',
  'Jiné',
];

export default function ReportsClient({
  initialReports,
  user,
}: ReportsClientProps) {
  const router = useRouter();
  const [reports] = useState<Report[]>(initialReports);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleMapClick = (lng: number, lat: number) => {
    if (!user) return; // Only logged in users can select location
    setSelectedLocation([lng, lat]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedLocation(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLocation || !user) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append('lng', selectedLocation[0].toString());
    formData.append('lat', selectedLocation[1].toString());

    try {
      await createReport(formData);
      closeForm();
      // Use Next.js refresh instead of full page reload
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Něco se nepovedlo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <Map
        reports={reports}
        selectedLocation={selectedLocation}
        onMapClick={handleMapClick}
      />

      {/* Floating UI for logged out users */}
      {!user && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900">
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
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:m-4 sm:rounded-2xl sm:inset-y-auto sm:top-4 sm:bottom-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Nový podnět
            </h2>
            <button
              onClick={closeForm}
              className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-6 w-6 text-zinc-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
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
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                placeholder="Popište podrobněji, o co jde..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-zinc-900 py-3 font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSubmitting ? 'Ukládám...' : 'Odeslat hlášení'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
