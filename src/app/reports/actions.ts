'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reportSchema = z.object({
  title: z.string().min(3, 'Název musí mít alespoň 3 znaky'),
  description: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  category: z.string(),
  lng: z.coerce.number(),
  lat: z.coerce.number(),
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

  // Convert to PostGIS POINT format: POINT(lng lat)
  const location = `POINT(${lng} ${lat})`;

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
