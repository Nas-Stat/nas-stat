-- Add user preferences and onboarding_completed flag to profiles
-- Existing users get onboarding_completed = true (skip onboarding)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Mark existing users as having completed onboarding
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed = false;
