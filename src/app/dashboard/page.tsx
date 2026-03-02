import Link from 'next/link';
import { LayoutDashboard, Star, MapPin, MessageSquare, TrendingUp, Info } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Map, { Report } from '@/components/Map';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/reportStatus';

interface GeoJsonPoint {
  type: string;
  coordinates: [number, number];
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch stats and latest data — single query to reports, derive latest 5 in JS
  const [reportsResponse, topicsResponse] = await Promise.all([
    supabase
      .from('reports')
      .select('id, title, description, location, rating, category, status, created_at'),
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
  const avgRating = totalReports > 0 
    ? (allReportsData.reduce((acc, curr) => acc + (curr.rating || 0), 0) / totalReports).toFixed(1)
    : '0.0';
  
  const resolvedCount = allReportsData.filter(r => r.status === 'resolved').length;

  // Format reports for the map; skip reports without location
  const mapReports: Report[] = allReportsData
    .filter((r) => r.location != null)
    .map(r => {
      const geoJson = r.location as unknown as GeoJsonPoint;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        rating: r.rating,
        category: r.category,
        status: r.status,
        location: {
          lng: geoJson.coordinates[0],
          lat: geoJson.coordinates[1]
        }
      };
    });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-black">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto mb-6 flex max-w-5xl items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Pulse Dashboard</h1>
        </div>
        <div className="mx-auto max-w-5xl space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4" />
                Celkem hlášení
              </div>
              <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalReports}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <Star className="h-4 w-4 text-yellow-500" />
                Průměrná spokojenost
              </div>
              <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {avgRating} / 5
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Vyřešených podnětů
              </div>
              <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {resolvedCount}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <Info className="h-4 w-4 text-blue-500" />
                Status systému
              </div>
              <div className="mt-2 text-lg font-bold text-green-600">
                Aktivní
              </div>
            </div>
          </div>

          {/* Map Preview (Pulse) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Geografický pulz (Heatmapa)
              </h2>
              <span className="text-xs text-zinc-500">Intenzita hlášení podle lokality a hodnocení</span>
            </div>
            <div className="h-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Map reports={mapReports} readOnly zoom={10} showHeatmap />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Latest Reports Section */}
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
                    <div key={report.id} className="p-4">
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
                  ))
                )}
              </div>
            </section>

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
                    <div key={topic.id} className="p-4">
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
