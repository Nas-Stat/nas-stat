-- Create a table for comments (on topics or reports)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  topic_id UUID REFERENCES public.topics(id),
  report_id UUID REFERENCES public.reports(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a comment is either for a topic or a report, but not both or neither
  CONSTRAINT comment_target_check CHECK (
    (topic_id IS NOT NULL AND report_id IS NULL) OR
    (topic_id IS NULL AND report_id IS NOT NULL)
  )
);

-- Set up Row Level Security for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone." ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment." ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = profile_id);

CREATE POLICY "Users can update their own comments." ON public.comments
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own comments." ON public.comments
  FOR DELETE USING (auth.uid() = profile_id);
