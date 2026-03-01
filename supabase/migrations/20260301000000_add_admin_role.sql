-- Create admins table to track users with admin privileges
CREATE TABLE public.admins (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Users can check their own admin status
CREATE POLICY "Users can check their own admin status." ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Add RLS policy allowing admins to update any report status
CREATE POLICY "Admins can update any report status." ON public.reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );
