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

test('Supabase migration includes robust RLS policies for all tables', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260228000000_initial_schema.sql');
  const content = readFileSync(migrationPath, 'utf8');
  
  const tables = ['profiles', 'topics', 'reports', 'votes'];
  
  tables.forEach(table => {
    // Check if RLS is enabled
    const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i');
    expect(content).toMatch(rlsRegex);
    
    // Check for SELECT policy (everyone can view)
    const selectPolicyRegex = new RegExp(`CREATE POLICY.*ON public\\.${table}\\s+FOR SELECT USING \\(true\\)`, 'i');
    expect(content).toMatch(selectPolicyRegex);
    
    // Check for INSERT policy (authenticated and owner)
    const insertPolicyRegex = new RegExp(`CREATE POLICY.*ON public\\.${table}\\s+FOR INSERT WITH CHECK \\(auth\\.role\\(\\) = 'authenticated'`, 'i');
    expect(content).toMatch(insertPolicyRegex);
    
    // Ownership column depends on the table
    const ownerColumn = table === 'profiles' ? 'id' : (table === 'reports' || table === 'votes' ? 'profile_id' : 'created_by');
    const ownershipRegex = new RegExp(`auth\\.uid\\(\\) = ${ownerColumn}`, 'i');
    expect(content).toMatch(ownershipRegex);
  });

  // Specifically verify the security fix for topics (INSERT, UPDATE, DELETE)
  expect(content).toMatch(/CREATE POLICY.*ON public\.topics\s+FOR INSERT WITH CHECK \(auth\.role\(\) = 'authenticated' AND auth\.uid\(\) = created_by\)/i);
  expect(content).toMatch(/CREATE POLICY.*ON public\.topics\s+FOR UPDATE USING \(auth\.uid\(\) = created_by\)/i);
  expect(content).toMatch(/CREATE POLICY.*ON public\.topics\s+FOR DELETE USING \(auth\.uid\(\) = created_by\)/i);
});

test('Supabase config file exists', () => {
  const configPath = join(process.cwd(), 'supabase/config.toml');
  expect(existsSync(configPath)).toBe(true);
});

test('Civic roles migration file exists', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  expect(existsSync(migrationPath)).toBe(true);
});

test('Civic roles migration adds role columns to profiles', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain("ADD COLUMN role TEXT DEFAULT 'citizen'");
  expect(content).toContain("CHECK (role IN ('citizen', 'obec', 'kraj', 'ministerstvo'))");
  expect(content).toContain('ADD COLUMN role_verified BOOLEAN DEFAULT false');
});

test('Civic roles migration backfills existing users as verified citizens', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain("UPDATE public.profiles SET role = 'citizen', role_verified = true");
});

test('Civic roles migration adds assignment and escalation columns to reports', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain('ADD COLUMN assigned_to UUID REFERENCES public.profiles(id)');
  expect(content).toContain('ADD COLUMN escalated_to_role TEXT');
  expect(content).toContain("CHECK (escalated_to_role IN ('obec', 'kraj', 'ministerstvo'))");
});

test('Civic roles migration extends status CHECK to include escalated', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain("'escalated'");
});

test('Civic roles migration updates handle_new_user trigger', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
  expect(content).toContain("raw_user_meta_data->>'role'");
});

test('Civic roles migration adds RLS policies for officials and admins', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260309000000_add_civic_roles.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toMatch(/Verified officials can update reports/i);
  expect(content).toMatch(/Admins can update any profile/i);
  expect(content).toContain('role_verified = true');
});
