'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PreferencesForm, { type Preferences } from '@/components/PreferencesForm';
import { updatePreferences } from './actions';

interface Category {
  slug: string;
  label: string;
}

interface SettingsClientProps {
  initial: Preferences;
  categories: Category[];
}

export default function SettingsClient({ initial, categories }: SettingsClientProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(prefs: Preferences) {
    setIsPending(true);
    setSuccess(false);
    await updatePreferences(prefs);
    setIsPending(false);
    setSuccess(true);
    router.refresh();
  }

  return (
    <div>
      {success && (
        <div
          className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
          role="status"
          data-testid="settings-success"
        >
          Nastavení bylo uloženo.
        </div>
      )}
      <PreferencesForm
        initial={initial}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Uložit nastavení"
        isPending={isPending}
      />
    </div>
  );
}
