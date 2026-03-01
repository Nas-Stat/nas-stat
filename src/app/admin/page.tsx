import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify admin role
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect('/');
  }

  const [{ data: reportsData, error: reportsError }, { data: topicsData }, { data: commentsData }] =
    await Promise.all([
      supabase
        .from('reports')
        .select('id, title, description, category, status, rating, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('topics')
        .select('id, title, description, created_by, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select('id, content, profile_id, topic_id, report_id, created_at')
        .order('created_at', { ascending: false }),
    ]);

  if (reportsError) {
    console.error('Error fetching reports:', reportsError);
  }

  const reports = reportsData ?? [];
  const topics = topicsData ?? [];
  const comments = commentsData ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
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
          Admin panel
        </h1>
        <span className="ml-3 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {reports.length} hlášení · {topics.length} témat · {comments.length} komentářů
        </span>
      </header>

      <main>
        <AdminClient reports={reports} topics={topics} comments={comments} />
      </main>
    </div>
  );
}
