import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expect, test } from 'vitest';

test('Supabase migration file exists', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260228000000_initial_schema.sql');
  expect(existsSync(migrationPath)).toBe(true);
});

test('Supabase migration includes necessary tables', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260228000000_initial_schema.sql');
  const content = readFileSync(migrationPath, 'utf8');
  
  expect(content).toContain('CREATE TABLE public.profiles');
  expect(content).toContain('CREATE TABLE public.reports');
  expect(content).toContain('CREATE TABLE public.topics');
  expect(content).toContain('CREATE TABLE public.votes');
  expect(content).toContain('CREATE EXTENSION IF NOT EXISTS postgis');
});

test('Supabase migration includes RLS policies', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260228000000_initial_schema.sql');
  const content = readFileSync(migrationPath, 'utf8');
  
  expect(content).toContain('ENABLE ROW LEVEL SECURITY');
  expect(content).toContain('CREATE POLICY');
});

test('Supabase config file exists', () => {
  const configPath = join(process.cwd(), 'supabase/config.toml');
  expect(existsSync(configPath)).toBe(true);
});
