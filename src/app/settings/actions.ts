'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { TerritoryLevel } from '@/lib/territories';

const preferencesSchema = z.object({
  territory_level: z.enum(['kraj', 'orp', '']).optional().default(''),
  territories: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;

export async function updatePreferences(input: PreferencesInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Musíte být přihlášeni.');

  const validated = preferencesSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0].message);
  }

  const preferences = {
    territory_level: validated.data.territory_level as TerritoryLevel | '',
    territories: validated.data.territories,
    categories: validated.data.categories,
  };

  const { error } = await supabase
    .from('profiles')
    .update({ preferences, onboarding_completed: true })
    .eq('id', user.id);

  if (error) throw new Error('Nepodařilo se uložit nastavení.');

  revalidatePath('/settings');
  revalidatePath('/onboarding');
  return { success: true };
}
