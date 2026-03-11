import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // Already completed — send to dashboard
  if (profile?.onboarding_completed) redirect('/dashboard');

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('slug, label')
    .order('sort_order');

  const categories = (categoriesData ?? []) as { slug: string; label: string }[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
        Vítejte v Náš stát!
      </h1>
      <p className="mb-8 text-slate-500 dark:text-zinc-400">
        Nastavte si preference, abychom vám mohli zobrazovat relevantní hlášení a témata z vašeho
        regionu. Preference lze kdykoli změnit v Nastavení.
      </p>
      <OnboardingClient categories={categories} />
    </main>
  );
}
