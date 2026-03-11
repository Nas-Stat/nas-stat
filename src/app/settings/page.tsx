import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SettingsClient from './SettingsClient';
import type { Preferences } from '@/components/PreferencesForm';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResponse, categoriesResponse] = await Promise.all([
    supabase.from('profiles').select('preferences').eq('id', user.id).single(),
    supabase.from('categories').select('slug, label').order('sort_order'),
  ]);

  const raw = (profileResponse.data?.preferences ?? {}) as Record<string, unknown>;
  const initial: Preferences = {
    territory_level: (raw.territory_level as Preferences['territory_level']) ?? '',
    territories: Array.isArray(raw.territories) ? (raw.territories as string[]) : [],
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : [],
  };

  const categories = (categoriesResponse.data ?? []) as { slug: string; label: string }[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">Nastavení</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Upravte své preference — úroveň správního celku, územní oblasti a kategorie zájmu.
      </p>
      <SettingsClient initial={initial} categories={categories} />
    </main>
  );
}
