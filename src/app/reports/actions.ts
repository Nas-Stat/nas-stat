'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createReport(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Musíte být přihlášeni pro vytvoření hlášení.');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const rating = parseInt(formData.get('rating') as string, 10);
  const category = formData.get('category') as string;
  const lng = parseFloat(formData.get('lng') as string);
  const lat = parseFloat(formData.get('lat') as string);

  if (!title || isNaN(lng) || isNaN(lat)) {
    throw new Error('Chybějící povinné údaje.');
  }

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
