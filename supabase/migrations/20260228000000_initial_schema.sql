-- Enable the PostGIS extension to work with geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create a table for public profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length CHECK (CHAR_LENGTH(username) >= 3)
);

-- Set up Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a table for topics (non-geographic reports)
CREATE TABLE public.topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security for topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topics are viewable by everyone." ON public.topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics." ON public.topics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Users can update their own topics." ON public.topics
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own topics." ON public.topics
  FOR DELETE USING (auth.uid() = created_by);

-- Create a table for geographic reports
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by everyone." ON public.reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports." ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = profile_id);

CREATE POLICY "Users can update their own reports." ON public.reports
  FOR UPDATE USING (auth.uid() = profile_id);

-- Create a table for votes (on topics or reports)
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  topic_id UUID REFERENCES public.topics(id),
  report_id UUID REFERENCES public.reports(id),
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure a vote is either for a topic or a report, but not both or neither
  CONSTRAINT vote_target_check CHECK (
    (topic_id IS NOT NULL AND report_id IS NULL) OR
    (topic_id IS NULL AND report_id IS NOT NULL)
  ),
  -- Ensure one vote per user per target
  UNIQUE(profile_id, topic_id),
  UNIQUE(profile_id, report_id)
);

-- Set up Row Level Security for votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone." ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote." ON public.votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = profile_id);

CREATE POLICY "Users can update their own votes." ON public.votes
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own votes." ON public.votes
  FOR DELETE USING (auth.uid() = profile_id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
