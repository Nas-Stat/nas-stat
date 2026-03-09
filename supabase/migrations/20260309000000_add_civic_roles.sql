-- Add civic role system to profiles
ALTER TABLE public.profiles
  ADD COLUMN role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'obec', 'kraj', 'ministerstvo')),
  ADD COLUMN role_verified BOOLEAN DEFAULT false;

-- Existing users become verified citizens
UPDATE public.profiles SET role = 'citizen', role_verified = true;

-- Extend reports with assignment and escalation support
ALTER TABLE public.reports
  ADD COLUMN assigned_to UUID REFERENCES public.profiles(id),
  ADD COLUMN escalated_to_role TEXT CHECK (escalated_to_role IN ('obec', 'kraj', 'ministerstvo'));

-- Extend status CHECK to include 'escalated'
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_status_check
  CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected', 'escalated'));

-- Update handle_new_user trigger to respect role from metadata
-- Citizens are auto-verified; officials require manual verification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_verified BOOLEAN;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'citizen');
  -- Only allow valid roles; default to citizen otherwise
  IF v_role NOT IN ('citizen', 'obec', 'kraj', 'ministerstvo') THEN
    v_role := 'citizen';
  END IF;
  v_verified := (v_role = 'citizen');

  INSERT INTO public.profiles (id, username, full_name, avatar_url, role, role_verified)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    v_verified
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Verified officials can update reports
CREATE POLICY "Verified officials can update reports." ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('obec', 'kraj', 'ministerstvo')
        AND role_verified = true
    )
  );

-- RLS: Admins can update any profile (for role approval)
CREATE POLICY "Admins can update any profile." ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );
