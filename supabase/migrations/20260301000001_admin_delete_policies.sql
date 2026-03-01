-- Admin delete policies for content moderation (Story 2.2.2)

-- Admins can delete any topic
CREATE POLICY "Admins can delete any topic." ON public.topics
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment." ON public.comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Admins can delete any vote (needed for cascade when deleting a topic)
CREATE POLICY "Admins can delete any vote." ON public.votes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );
