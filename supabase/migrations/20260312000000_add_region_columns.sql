-- Add region columns to reports for reverse geocoding output
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS region_kraj TEXT,
  ADD COLUMN IF NOT EXISTS region_orp  TEXT,
  ADD COLUMN IF NOT EXISTS region_obec TEXT;
