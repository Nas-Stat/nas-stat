'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PreferencesForm, { type Preferences } from '@/components/PreferencesForm';
import { updatePreferences } from '@/app/settings/actions';

interface Category {
  slug: string;
  label: string;
}

interface OnboardingClientProps {
  categories: Category[];
}

const EMPTY_PREFS: Preferences = {
  territory_level: '',
  territories: [],
  categories: [],
};

export default function OnboardingClient({ categories }: OnboardingClientProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(prefs: Preferences) {
    setIsPending(true);
    await updatePreferences(prefs);
    router.push('/dashboard');
  }

  async function handleSkip() {
    setIsPending(true);
    await updatePreferences(EMPTY_PREFS);
    router.push('/dashboard');
  }

  return (
    <div className="space-y-8">
      <PreferencesForm
        initial={EMPTY_PREFS}
        categories={categories}
        onSubmit={handleSubmit}
        submitLabel="Uložit a pokračovat"
        isPending={isPending}
      />
      <div className="border-t border-slate-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-slate-500 underline hover:text-slate-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
          data-testid="skip-onboarding"
        >
          Přeskočit — nastavím si to později
        </button>
      </div>
    </div>
  );
}
