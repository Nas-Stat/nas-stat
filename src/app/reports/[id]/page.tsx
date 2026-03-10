import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReportDetailClient from './ReportDetailClient';
import { type Role } from '@/lib/roles';
import { parseLocation } from '@/utils/geo';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the report with assigned profile info
  const { data: reportData, error } = await supabase
    .from('reports')
    .select(
      'id, title, description, location, rating, category, status, created_at, assigned_to, escalated_to_role'
    )
    .eq('id', id)
    .single();

  if (error || !reportData) {
    notFound();
  }

  // Fetch assigned official profile if present
  let assignedProfile: { username: string | null; role: Role } | null = null;
  if (reportData.assigned_to) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', reportData.assigned_to)
      .single();
    if (profileData) {
      assignedProfile = profileData as { username: string | null; role: Role };
    }
  }

  // Fetch current user's profile (role, role_verified)
  let currentProfile: { role: Role; role_verified: boolean } | null = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, role_verified')
      .eq('id', user.id)
      .single();
    if (profileData) {
      currentProfile = profileData as { role: Role; role_verified: boolean };
    }
  }

  // Transform location (handles both GeoJSON and WKB hex from PostgREST)
  const location = parseLocation(reportData.location);

  return (
    <ReportDetailClient
      report={{
        id: reportData.id,
        title: reportData.title,
        description: reportData.description,
        location,
        rating: reportData.rating,
        category: reportData.category,
        status: reportData.status,
        createdAt: reportData.created_at,
        assignedTo: reportData.assigned_to,
        escalatedToRole: reportData.escalated_to_role as Role | null,
      }}
      assignedProfile={assignedProfile}
      currentProfile={currentProfile}
      currentUserId={user?.id ?? null}
    />
  );
}
