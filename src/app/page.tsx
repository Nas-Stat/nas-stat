import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-zinc-950">
      <main className="flex w-full max-w-3xl flex-col items-center gap-12 px-8 py-24 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-zinc-900 dark:text-zinc-50">
            Vítejte v aplikaci Náš stát
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Platforma pro okamžitou zpětnou vazbu k akcím státní správy a samosprávy. Pomozte nám zlepšit naše okolí.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            href={user ? '/reports' : '/login'}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[200px]"
          >
            Nahlásit podnět
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-slate-200 px-5 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-900 md:w-[200px]"
            href="/reports"
          >
            Zobrazit mapu
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-slate-200 px-5 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-900 md:w-[200px]"
            href="/topics"
          >
            Tématický feed
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-slate-200 px-5 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-900 md:w-[200px]"
            href="/dashboard"
          >
            Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
