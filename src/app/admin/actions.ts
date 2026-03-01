'use server';

import { createClient } from '@/utils/supabase/server';
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
  return { success: true };
}
