'use client';

import React, { useState, useCallback } from 'react';
import Map, { Report } from '@/components/Map';
import { createReport } from './actions';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ReportForm from './ReportForm';

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

  return (
    <div className="relative h-full w-full">
      <Map
        reports={initialReports}
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
