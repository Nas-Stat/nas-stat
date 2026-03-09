'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStatusChangeEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const VALID_STATUSES = ['pending', 'in_review', 'resolved', 'rejected'] as const;

const updateStatusSchema = z.object({
  reportId: z.string().uuid('Neplatné ID hlášení'),
  status: z
    .string()
    .refine(
      (val): val is (typeof VALID_STATUSES)[number] => (VALID_STATUSES as readonly string[]).includes(val),
      { message: 'Neplatný status hlášení' }
    ),
});

const deleteTopicSchema = z.object({
  topicId: z.string().uuid('Neplatné ID tématu'),
});

const deleteCommentSchema = z.object({
  commentId: z.string().uuid('Neplatné ID komentáře'),
});

const profileIdSchema = z.object({
  profileId: z.string().uuid('Neplatné ID profilu'),
});

async function getAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Musíte být přihlášeni.');
  }

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    throw new Error('Přístup odepřen.');
  }

  return { supabase, user };
}

export async function updateReportStatus(reportId: string, status: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Musíte být přihlášeni.');
  }

  // Verify admin role
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) {
    throw new Error('Přístup odepřen. Pouze administrátoři mohou měnit status hlášení.');
  }

  const validated = updateStatusSchema.safeParse({ reportId, status });

  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: validated.data.status, updated_at: new Date().toISOString() })
    .eq('id', validated.data.reportId);

  if (error) {
    console.error('Error updating report status:', error);
    throw new Error('Nepodařilo se aktualizovat status hlášení.');
  }

  revalidatePath('/admin');
  revalidatePath('/reports');

  // Send email notification — non-blocking, failures must not break the action
  try {
    const { data: report } = await supabase
      .from('reports')
      .select('title, profile_id')
      .eq('id', validated.data.reportId)
      .single();

    if (report) {
      const adminClient = createAdminClient();
      const { data: userData } = await adminClient.auth.admin.getUserById(report.profile_id);
      if (userData?.user?.email) {
        await sendStatusChangeEmail(
          userData.user.email,
          report.title,
          validated.data.status,
          validated.data.reportId
        );
      }
    }
  } catch (emailError) {
    console.error('Failed to send status change email:', emailError);
  }

  return { success: true };
}

export async function deleteTopic(topicId: string) {
  const { supabase } = await getAdminUser();

  const validated = deleteTopicSchema.safeParse({ topicId });

  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const id = validated.data.topicId;

  // Cascade: remove votes and comments before deleting the topic
  const { error: votesError } = await supabase.from('votes').delete().eq('topic_id', id);
  if (votesError) {
    console.error('Error deleting votes for topic:', votesError);
    throw new Error('Nepodařilo se smazat hlasy tématu.');
  }

  const { error: commentsError } = await supabase.from('comments').delete().eq('topic_id', id);
  if (commentsError) {
    console.error('Error deleting comments for topic:', commentsError);
    throw new Error('Nepodařilo se smazat komentáře tématu.');
  }

  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) {
    console.error('Error deleting topic:', error);
    throw new Error('Nepodařilo se smazat téma.');
  }

  revalidatePath('/admin');
  revalidatePath('/topics');
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const { supabase } = await getAdminUser();

  const validated = deleteCommentSchema.safeParse({ commentId });

  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const { error } = await supabase.from('comments').delete().eq('id', validated.data.commentId);
  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error('Nepodařilo se smazat komentář.');
  }

  revalidatePath('/admin');
  revalidatePath('/topics');
  return { success: true };
}

export async function approveRole(profileId: string) {
  await getAdminUser();

  const validated = profileIdSchema.safeParse({ profileId });
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ role_verified: true })
    .eq('id', validated.data.profileId);

  if (error) {
    console.error('Error approving role:', error);
    throw new Error('Nepodařilo se schválit roli.');
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function denyRole(profileId: string) {
  await getAdminUser();

  const validated = profileIdSchema.safeParse({ profileId });
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('profiles')
    .update({ role: 'citizen', role_verified: true })
    .eq('id', validated.data.profileId);

  if (error) {
    console.error('Error denying role:', error);
    throw new Error('Nepodařilo se zamítnout roli.');
  }

  revalidatePath('/admin');
  return { success: true };
}
