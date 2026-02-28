import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReportsClient from './ReportsClient';
import { createClient } from '@/utils/supabase/server';
import { Report } from '@/components/Map';

export default async function ReportsPage() {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch reports
  // Note: We're fetching raw PostGIS location. PostgREST returns it as GeoJSON object.
  const { data: reportsData, error } = await supabase
    .from('reports')
    .select('id, title, description, location, rating, category, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
  }

  // Transform reports to match our Report interface
  const reports: Report[] = (reportsData || []).map((report: any) => {
    // PostgREST returns location as a GeoJSON object for GEOGRAPHY types
    const location = report.location as {
      type: string;
      coordinates: [number, number];
    };
    return {
      id: report.id,
      title: report.title,
      description: report.description,
      location: {
        lng: location.coordinates[0],
        lat: location.coordinates[1],
      },
      rating: report.rating,
      category: report.category,
      status: report.status,
    };
  });

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="z-10 flex h-16 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="mr-4 flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Hlášení podnětů
        </h1>
      </header>

      {/* Main content - Map & Client logic */}
      <main className="relative flex-1">
        <ReportsClient initialReports={reports} user={user} />
      </main>
    </div>
  );
}
