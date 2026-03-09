'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isOfficialRole, getEscalationTarget, type Role } from '@/lib/roles';

const reportSchema = z
  .object({
    title: z.string().min(3, 'Název musí mít alespoň 3 znaky'),
    description: z.string().optional(),
    rating: z.coerce.number().int().min(1).max(5),
    category: z.string(),
    lng: z.coerce.number().optional(),
    lat: z.coerce.number().optional(),
  })
  .refine((d) => (d.lng == null) === (d.lat == null), {
    message: 'Musíte zadat obě souřadnice, nebo žádnou.',
  });

export async function createReport(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Musíte být přihlášeni pro vytvoření hlášení.');
  }

  const rawData = Object.fromEntries(formData.entries());
  const validated = reportSchema.safeParse(rawData);

  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const { title, description, rating, category, lng, lat } = validated.data;

  // Convert to PostGIS POINT format: POINT(lng lat); null when no location provided
  const location = lng != null && lat != null ? `POINT(${lng} ${lat})` : null;

  const { error } = await supabase.from('reports').insert({
    profile_id: user.id,
    title,
    description,
    rating,
    category,
    location,
    status: 'pending',
  });

  if (error) {
    console.error('Error creating report:', error);
    throw new Error('Nepodařilo se uložit hlášení.');
  }

  revalidatePath('/reports');
  return { success: true };
}

async function getVerifiedOfficial() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Musíte být přihlášeni.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, role_verified')
    .eq('id', user.id)
    .single();

  if (error || !profile) throw new Error('Profil nenalezen.');
  if (!isOfficialRole(profile.role as Role) || !profile.role_verified) {
    throw new Error('Nemáte oprávnění k této akci.');
  }

  return { supabase, user, profile: profile as { id: string; role: Role; role_verified: boolean } };
}

export async function claimReport(reportId: string) {
  const { supabase, profile } = await getVerifiedOfficial();

  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, escalated_to_role')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) throw new Error('Hlášení nenalezeno.');

  if (report.status !== 'pending' && report.status !== 'escalated') {
    throw new Error('Hlášení nelze převzít v tomto stavu.');
  }
  if (report.status === 'escalated' && report.escalated_to_role !== profile.role) {
    throw new Error('Toto hlášení není eskalováno na vaši roli.');
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: 'in_review', assigned_to: profile.id, escalated_to_role: null })
    .eq('id', reportId);

  if (error) throw new Error('Nepodařilo se převzít hlášení.');

  revalidatePath('/reports');
  return { success: true };
}

export async function escalateReport(reportId: string) {
  const { supabase, profile } = await getVerifiedOfficial();

  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, assigned_to')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) throw new Error('Hlášení nenalezeno.');
  if (report.assigned_to !== profile.id) throw new Error('Nejste přiřazeni k tomuto hlášení.');

  const target = getEscalationTarget(profile.role);
  if (!target) throw new Error('Vaše role nemůže eskalovat dále.');

  const { error } = await supabase
    .from('reports')
    .update({ status: 'escalated', assigned_to: null, escalated_to_role: target })
    .eq('id', reportId);

  if (error) throw new Error('Nepodařilo se eskalovat hlášení.');

  revalidatePath('/reports');
  return { success: true };
}

export async function resolveReport(reportId: string) {
  const { supabase, profile } = await getVerifiedOfficial();

  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, assigned_to')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) throw new Error('Hlášení nenalezeno.');
  if (report.assigned_to !== profile.id) throw new Error('Nejste přiřazeni k tomuto hlášení.');
  if (report.status !== 'in_review') throw new Error('Hlášení není ve stavu in_review.');

  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', reportId);

  if (error) throw new Error('Nepodařilo se uzavřít hlášení.');

  revalidatePath('/reports');
  return { success: true };
}

export async function rejectReport(reportId: string) {
  const { supabase, profile } = await getVerifiedOfficial();

  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('status, assigned_to')
    .eq('id', reportId)
    .single();

  if (fetchError || !report) throw new Error('Hlášení nenalezeno.');
  if (report.assigned_to !== profile.id) throw new Error('Nejste přiřazeni k tomuto hlášení.');
  if (report.status !== 'in_review') throw new Error('Hlášení není ve stavu in_review.');

  const { error } = await supabase
    .from('reports')
    .update({ status: 'rejected' })
    .eq('id', reportId);

  if (error) throw new Error('Nepodařilo se zamítnout hlášení.');

  revalidatePath('/reports');
  return { success: true };
}
