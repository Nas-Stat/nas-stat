import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import TopicsClient from './TopicsClient';

export default async function TopicsPage() {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch topics with votes, comments and author profile
  const { data: topicsData, error } = await supabase
    .from('topics')
    .select(`
      *,
      profiles:created_by (
        username,
        full_name,
        avatar_url
      ),
      votes (
        vote_type,
        profile_id
      ),
      comments (
        id,
        content,
        created_at,
        profiles:profile_id (
          username
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="mr-4 flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Tématický Feed
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <TopicsClient initialTopics={topicsData || []} user={user} />
        </div>
      </main>
    </div>
  );
}
