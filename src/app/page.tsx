import { createClient } from '@/utils/supabase/server';
import { MapPin, MessageSquare, BarChart2 } from 'lucide-react';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Hlášení',
    description:
      'Označte problém přímo na mapě — výmoly, nelegální skládky, poškozené lavičky. Každé hlášení směřuje na správné místo.',
  },
  {
    icon: MessageSquare,
    title: 'Diskuze',
    description:
      'Hlasujte a diskutujte o tématech, která formují vaše okolí. Váš hlas se počítá.',
  },
  {
    icon: BarChart2,
    title: 'Přehled',
    description:
      'Sledujte stav hlášení a trendy v reálném čase. Transparentnost je základ důvěry.',
  },
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6 py-24 text-center dark:from-zinc-900 dark:to-zinc-950">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Náš stát
        </h1>
        <p className="mt-6 max-w-xl text-xl leading-8 text-zinc-600 dark:text-zinc-400">
          Česká občanská platforma pro geolokovaná hlášení a diskuse o veřejném
          prostoru. Připojte se a pomozte zlepšit své okolí.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href={user ? '/reports' : '/login'}
            className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-base font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Nahlásit podnět
          </a>
          <a
            href="/reports"
            className="flex h-12 items-center justify-center rounded-full border border-slate-200 px-8 text-base font-semibold text-zinc-900 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Prozkoumat mapu
          </a>
        </div>
      </section>

      {/* Feature cards */}
      <section
        className="bg-white px-6 py-20 dark:bg-zinc-950"
        aria-label="Funkce platformy"
      >
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
