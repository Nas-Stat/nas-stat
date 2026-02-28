'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const topicSchema = z.object({
  title: z.string().min(3, 'Název musí mít alespoň 3 znaky').max(100),
  description: z.string().min(10, 'Popis musí mít alespoň 10 znaků').max(1000).optional(),
});

export async function createTopic(formData: FormData) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pro vytvoření tématu se musíte přihlásit.');
  }

  // Validate form data
  const validatedFields = topicSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description } = validatedFields.data;

  // Insert into Supabase
  const { error } = await supabase.from('topics').insert({
    title,
    description,
    created_by: user.id,
  });

  if (error) {
    console.error('Error creating topic:', error);
    return {
      error: 'Nepodařilo se vytvořit téma. Zkuste to prosím znovu.',
    };
  }

  revalidatePath('/topics');
  return { success: true };
}

export async function voteTopic(topicId: string, voteType: 'up' | 'down') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pro hlasování se musíte přihlásit.');
  }

  // Upsert vote
  const { error } = await supabase.from('votes').upsert(
    {
      profile_id: user.id,
      topic_id: topicId,
      vote_type: voteType,
    },
    { onConflict: 'profile_id,topic_id' }
  );

  if (error) {
    console.error('Error voting on topic:', error);
    return {
      error: 'Nepodařilo se uložit hlas. Zkuste to prosím znovu.',
    };
  }

  revalidatePath('/topics');
  return { success: true };
}

export async function addComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Pro přidání komentáře se musíte přihlásit.');
  }

  const topicId = formData.get('topic_id') as string;
  const content = formData.get('content') as string;

  if (!content || content.length < 2) {
    return { error: 'Komentář je příliš krátký.' };
  }

  const { error } = await supabase.from('comments').insert({
    profile_id: user.id,
    topic_id: topicId,
    content: content,
  });

  if (error) {
    console.error('Error adding comment:', error);
    return {
      error: 'Nepodařilo se přidat komentář. Zkuste to prosím znovu.',
    };
  }

  revalidatePath('/topics');
  return { success: true };
}
