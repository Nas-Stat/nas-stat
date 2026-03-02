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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <TopicsClient initialTopics={topicsData || []} user={user} />
        </div>
      </main>
    </div>
  );
}
