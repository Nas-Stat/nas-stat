import Link from 'next/link';
import { Star, MapPin, MessageSquare, TrendingUp, Info, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Map, { Report } from '@/components/Map';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/reportStatus';
import { parseLocation } from '@/utils/geo';
import { KRAJE } from '@/lib/territories';

interface Preferences {
  territory_level?: string;
  territories?: string[];
  categories?: string[];
}

function partitionReports<T extends { region_kraj?: string | null; category?: string | null }>(
  reports: T[],
  preferences: Preferences,
): { mine: T[]; others: T[] } {
  const preferredKrajLabels = (preferences.territories ?? [])
    .map((code) => KRAJE.find((k) => k.code === code)?.label)
    .filter(Boolean) as string[];
  const preferredCategories = preferences.categories ?? [];

  const hasTerr = preferredKrajLabels.length > 0;
  const hasCat = preferredCategories.length > 0;

  if (!hasTerr && !hasCat) {
    return { mine: [], others: reports };
  }

  const mine: T[] = [];
  const others: T[] = [];

  for (const r of reports) {
    const matchesTerr = hasTerr ? preferredKrajLabels.includes(r.region_kraj ?? '') : true;
    const matchesCat = hasCat ? preferredCategories.includes(r.category ?? '') : true;
    const isMatch = hasTerr && hasCat ? matchesTerr && matchesCat : matchesTerr && matchesCat;
    if (isMatch) {
      mine.push(r);
    } else {
      others.push(r);
    }
  }

  return { mine, others };
}

function computeCenter(mapReports: Report[]): [number, number] | undefined {
  if (mapReports.length === 0) return undefined;
  const sumLng = mapReports.reduce((s, r) => s + r.location.lng, 0);
  const sumLat = mapReports.reduce((s, r) => s + r.location.lat, 0);
  return [sumLng / mapReports.length, sumLat / mapReports.length];
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile preferences if logged in
  let preferences: Preferences | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    preferences = (profile?.preferences as Preferences) ?? {};
  }

  const preferencesEmpty =
    !preferences ||
    (!(preferences.territories?.length) && !(preferences.categories?.length));

  // Fetch stats and latest data — single query to reports, derive latest 5 in JS
  const [reportsResponse, topicsResponse] = await Promise.all([
    supabase
      .from('reports')
      .select('id, title, description, location, rating, category, status, created_at, region_kraj'),
    supabase
      .from('topics')
      .select('*, comments(id)')
      .order('created_at', { ascending: false }),
  ]);

  const allReportsData = reportsResponse.data || [];
  const latestReports = [...allReportsData]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Sort topics by popularity (comment count)
  const popularTopics = (topicsResponse.data || [])
    .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
    .slice(0, 5);

  const totalReports = allReportsData.length;
  const avgRating =
    totalReports > 0
      ? (allReportsData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalReports).toFixed(1)
      : '0.0';

  const resolvedCount = allReportsData.filter((r) => r.status === 'resolved').length;

  // Format reports for the map; skip reports without location
  const toMapReport = (r: (typeof allReportsData)[number]): Report | null => {
    const loc = parseLocation(r.location);
    if (!loc) return null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      rating: r.rating,
      category: r.category,
      status: r.status,
      location: loc,
    };
  };

  const allMapReports: Report[] = allReportsData.flatMap((r) => {
    const mapped = toMapReport(r);
    return mapped ? [mapped] : [];
  });

  // Partition by preferences (only when user is logged in and has prefs)
  const { mine: myReportsData, others: otherReportsData } =
    user && preferences && !preferencesEmpty
      ? partitionReports(allReportsData, preferences)
      : { mine: [], others: allReportsData };

  const myMapReports: Report[] = myReportsData.flatMap((r) => {
    const mapped = toMapReport(r);
    return mapped ? [mapped] : [];
  });

  // Center heatmap on preferred area if possible
  const heatmapCenter = myMapReports.length > 0 ? computeCenter(myMapReports) : undefined;
  const heatmapReports = user && !preferencesEmpty ? myMapReports : allMapReports;

  const myLatestReports = [...myReportsData]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const otherLatestReports = [...otherReportsData]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Pulse Dashboard
          </h1>
          <div className="space-y-8">

          {/* Preferences banner — shown for logged-in users with empty preferences */}
          {user && preferencesEmpty && (
            <div
              data-testid="preferences-banner"
              className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-900 dark:bg-blue-950/30"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Nastavte si preference, abyste viděli hlášení z vašeho regionu.
                </span>
              </div>
              <Link
                href="/settings"
                className="ml-4 shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Nastavit preference
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              data-testid="stat-card-reports"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Celkem hlášení</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalReports}
              </div>
            </div>

            <div
              data-testid="stat-card-rating"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
                  <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Průměrná spokojenost</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {avgRating} / 5
              </div>
            </div>

            <div
              data-testid="stat-card-resolved"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Vyřešených podnětů</span>
              </div>
              <div className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {resolvedCount}
              </div>
            </div>

            <div
              data-testid="stat-card-status"
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status systému</span>
              </div>
              <div className="mt-3 text-lg font-bold text-green-600">Aktivní</div>
            </div>
          </div>

          {/* Map Preview (Pulse) */}
          <section
            data-testid="heatmap-section"
            className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {user && !preferencesEmpty ? 'Heatmapa vašich oblastí' : 'Geografický pulz (Heatmapa)'}
              </h2>
              <span className="text-xs text-zinc-500">Intenzita hlášení podle lokality a hodnocení</span>
            </div>
            <div className="h-80 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
              <Map
                reports={heatmapReports}
                readOnly
                zoom={heatmapCenter ? 9 : 10}
                center={heatmapCenter}
                showHeatmap
              />
            </div>
          </section>

          {/* Personalized sections for logged-in users with preferences */}
          {user && !preferencesEmpty ? (
            <>
              {/* "Vaše oblasti" section */}
              <section data-testid="my-reports-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Vaše oblasti
                  </h2>
                  <Link href="/reports" className="text-xs font-medium text-blue-600 hover:underline">
                    Zobrazit vše
                  </Link>
                </div>
                <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {myLatestReports.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">
                      Žádná hlášení odpovídající vašim preferencím.{' '}
                      <Link href="/settings" className="text-blue-600 hover:underline">
                        Upravit preference
                      </Link>
                    </div>
                  ) : (
                    myLatestReports.map((report) => (
                      <ReportRow key={report.id} report={report} />
                    ))
                  )}
                </div>
              </section>

              {/* "Ostatní" section */}
              <section data-testid="other-reports-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Ostatní hlášení
                  </h2>
                  <Link href="/reports" className="text-xs font-medium text-blue-600 hover:underline">
                    Zobrazit vše
                  </Link>
                </div>
                <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {otherLatestReports.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">Žádná ostatní hlášení.</div>
                  ) : (
                    otherLatestReports.map((report) => (
                      <ReportRow key={report.id} report={report} />
                    ))
                  )}
                </div>
              </section>
            </>
          ) : (
            /* Default non-personalized section */
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Nejnovější hlášení
                </h2>
                <Link href="/reports" className="text-xs font-medium text-blue-600 hover:underline">
                  Zobrazit vše
                </Link>
              </div>
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {latestReports.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">Zatím žádná hlášení.</div>
                ) : (
                  latestReports.map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Popular Topics Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Populární témata
              </h2>
              <Link href="/topics" className="text-xs font-medium text-blue-600 hover:underline">
                Zobrazit feed
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {popularTopics.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">Zatím žádná témata.</div>
              ) : (
                popularTopics.map((topic) => (
                  <div key={topic.id} className="p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {topic.title}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <MessageSquare className="h-3 w-3" />
                        {topic.comments?.length || 0}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Založeno: {new Date(topic.created_at).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          </div>
        </div>
      </main>
    </div>
  );
}

function ReportRow({ report }: { report: { id: string; title: string; rating: number; category: string | null; status: string; created_at: string } }) {
  return (
    <div className="p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {report.title}
        </span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < report.rating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-300 dark:text-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{report.category}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_COLORS[report.status] ?? STATUS_COLORS.pending}`}>
          {STATUS_LABELS[report.status] ?? STATUS_LABELS.pending}
        </span>
      </div>
    </div>
  );
}
