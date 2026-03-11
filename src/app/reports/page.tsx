import ReportsClient from './ReportsClient';
import { createClient } from '@/utils/supabase/server';
import { Report } from '@/components/Map';
import { parseLocation } from '@/utils/geo';

const PAGE_SIZE = 20;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const statusFilter = params.status ?? '';
  const categoryFilter = params.category ?? '';

  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch categories from DB
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('slug, label')
    .order('sort_order', { ascending: true });
  const categories = (categoriesData ?? []).map((c) => ({ slug: c.slug, label: c.label }));

  // Build filtered + paginated query
  let query = supabase
    .from('reports')
    .select('id, title, description, location, rating, category, status, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false });

  if (statusFilter) query = query.eq('status', statusFilter);
  if (categoryFilter) query = query.eq('category', categoryFilter);

  const offset = (page - 1) * PAGE_SIZE;
  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data: reportsData, error, count } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
  }

  // Transform reports to match our Report interface; skip reports without location
  const reports: Report[] = (reportsData || []).flatMap((report) => {
    const loc = parseLocation(report.location);
    if (!loc) return [];
    return [{
      id: report.id,
      title: report.title,
      description: report.description,
      location: loc,
      rating: report.rating,
      category: report.category,
      status: report.status,
    }];
  });

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-black">
      {/* Main content - Map & Client logic */}
      <main className="relative flex-1">
        <ReportsClient
          initialReports={reports}
          user={user}
          currentPage={page}
          totalPages={totalPages}
          currentStatus={statusFilter}
          currentCategory={categoryFilter}
          categories={categories}
        />
      </main>
    </div>
  );
}
