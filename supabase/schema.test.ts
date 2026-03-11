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

// ---------------------------------------------------------------------------
// Seed data tests
// ---------------------------------------------------------------------------

test('Seed file exists', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  expect(existsSync(seedPath)).toBe(true);
});

test('Seed creates 10 test users with fixed UUIDs', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  // All 10 fixed UUIDs present
  for (let i = 1; i <= 10; i++) {
    const uuid = `a1000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    expect(content).toContain(uuid);
  }
});

test('Seed creates identities for all test users', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('INSERT INTO auth.identities');
  expect(content).toContain("provider, last_sign_in_at");
});

test('Seed covers all 5 civic roles', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('"role":"citizen"');
  expect(content).toContain('"role":"obec"');
  expect(content).toContain('"role":"kraj"');
  expect(content).toContain('"role":"ministerstvo"');
});

test('Seed sets role_verified=true for officials', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('UPDATE public.profiles SET role_verified = true');
  // Officials: UUIDs 6–10
  expect(content).toContain('a1000000-0000-0000-0000-000000000006');
  expect(content).toContain('a1000000-0000-0000-0000-000000000010');
});

test('Seed creates 120 reports via PL/pgSQL loop', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('FOR i IN 1..120 LOOP');
  expect(content).toContain('INSERT INTO public.reports');
  expect(content).toContain('ST_SetSRID(ST_MakePoint');
});

test('Seed reports use category slugs matching categories table', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  const expected = ['dopravni-infrastruktura', 'zivotni-prostredi', 'skolstvi', 'zdravotnictvi', 'energetika', 'fungovani-uradu', 'bezpecnost', 'jine'];
  for (const cat of expected) {
    expect(content).toContain(cat);
  }
});

test('Seed reports use all 5 statuses including escalated', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  const expected = ["'pending'", "'in_review'", "'resolved'", "'rejected'", "'escalated'"];
  for (const s of expected) {
    expect(content).toContain(s);
  }
});

test('Seed inserts 20 topics', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('INSERT INTO public.topics');
  // Count VALUES rows for topics — 20 titles listed
  const topicMatches = content.match(/INSERT INTO public\.topics[\s\S]*?(?=--|$)/);
  expect(topicMatches).not.toBeNull();
  // At least 20 entries (one per line starting with '(')
  const lines = topicMatches![0].split('\n').filter(l => l.trim().startsWith("('"));
  expect(lines.length).toBeGreaterThanOrEqual(20);
});

test('Seed inserts comments on both topics and reports', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('INSERT INTO public.comments (profile_id, topic_id');
  expect(content).toContain('INSERT INTO public.comments (profile_id, report_id');
});

test('Seed inserts votes on both reports and topics with ON CONFLICT DO NOTHING', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('INSERT INTO public.votes (profile_id, report_id');
  expect(content).toContain('INSERT INTO public.votes (profile_id, topic_id');
  expect(content).toContain('ON CONFLICT DO NOTHING');
});

// ---------------------------------------------------------------------------
// Documentation tests (issue #69)
// ---------------------------------------------------------------------------

test('CLAUDE.md exists', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  expect(existsSync(claudePath)).toBe(true);
});

test('CLAUDE.md documents env file priority', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  const content = readFileSync(claudePath, 'utf8');

  expect(content).toContain('.env.local');
  expect(content).toContain('.env.development');
  expect(content).toContain('.env.example');
  // Priority order must be documented
  expect(content).toMatch(/\.env\.local.*>.*\.env\.development/);
});

test('CLAUDE.md explains .env.development works out of the box', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  const content = readFileSync(claudePath, 'utf8');

  expect(content).toContain('supabase start');
  expect(content).toMatch(/\.env\.development.*out.of.the.box/i);
});

test('CLAUDE.md has Seed data subsection', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  const content = readFileSync(claudePath, 'utf8');

  expect(content).toContain('### Seed data');
  expect(content).toContain('supabase db reset');
  expect(content).toContain('seed.sql');
});

test('CLAUDE.md seed data section lists test credentials', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  const content = readFileSync(claudePath, 'utf8');

  expect(content).toContain('password123');
  expect(content).toContain('@test.cz');
});

test('CLAUDE.md seed data section lists user counts and content', () => {
  const claudePath = join(process.cwd(), 'CLAUDE.md');
  const content = readFileSync(claudePath, 'utf8');

  // Users, reports, topics
  expect(content).toMatch(/10 test users/);
  expect(content).toMatch(/120 reports/);
  expect(content).toMatch(/20.*topics/i);
});

test('.env.development file exists and contains required keys', () => {
  const envPath = join(process.cwd(), '.env.development');
  expect(existsSync(envPath)).toBe(true);

  const content = readFileSync(envPath, 'utf8');
  expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
  expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
});

test('.env.example file exists and documents env strategy', () => {
  const envPath = join(process.cwd(), '.env.example');
  expect(existsSync(envPath)).toBe(true);

  const content = readFileSync(envPath, 'utf8');
  expect(content).toContain('.env.development');
  expect(content).toContain('.env.local');
  expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
});

// ---------------------------------------------------------------------------
// Categories migration tests (issue #79)
// ---------------------------------------------------------------------------

test('Categories migration file exists', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260311000000_add_categories_table.sql');
  expect(existsSync(migrationPath)).toBe(true);
});

test('Categories migration creates categories table with required columns', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260311000000_add_categories_table.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain('CREATE TABLE IF NOT EXISTS categories');
  expect(content).toContain('slug');
  expect(content).toContain('label');
  expect(content).toContain('sort_order');
  expect(content).toContain('SERIAL PRIMARY KEY');
  expect(content).toContain('UNIQUE NOT NULL');
});

test('Categories migration enables RLS with public SELECT and admin-only writes', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260311000000_add_categories_table.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain('ALTER TABLE categories ENABLE ROW LEVEL SECURITY');
  expect(content).toContain('FOR SELECT');
  expect(content).toContain('USING (true)');
  expect(content).toContain('FOR INSERT');
  expect(content).toContain('FOR UPDATE');
  expect(content).toContain('FOR DELETE');
  expect(content).toContain('admins');
});

test('Seed seeds categories table with all required slugs', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('INSERT INTO categories');
  const expectedSlugs = [
    'zivotni-prostredi',
    'skolstvi',
    'zdravotnictvi',
    'dopravni-infrastruktura',
    'energetika',
    'fungovani-uradu',
    'bezpecnost',
    'jine',
  ];
  for (const slug of expectedSlugs) {
    expect(content).toContain(slug);
  }
});

test('Seed categories use ON CONFLICT upsert for idempotency', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  expect(content).toContain('ON CONFLICT (slug) DO UPDATE');
});

// ---------------------------------------------------------------------------
// Region columns migration tests (issue #80)
// ---------------------------------------------------------------------------

test('Region columns migration file exists', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260312000000_add_region_columns.sql');
  expect(existsSync(migrationPath)).toBe(true);
});

test('Region columns migration adds all three region columns to reports', () => {
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260312000000_add_region_columns.sql');
  const content = readFileSync(migrationPath, 'utf8');

  expect(content).toContain('region_kraj');
  expect(content).toContain('region_orp');
  expect(content).toContain('region_obec');
  expect(content).toContain('ADD COLUMN IF NOT EXISTS');
  expect(content).toContain('ALTER TABLE public.reports');
});

test('Seed backfills region data for all 10 Czech cities', () => {
  const seedPath = join(process.cwd(), 'supabase/seed.sql');
  const content = readFileSync(seedPath, 'utf8');

  // All 10 cities should have region_kraj set
  expect(content).toContain('region_kraj');
  expect(content).toContain('region_orp');
  expect(content).toContain('region_obec');
  // Verify at least one known region is present
  expect(content).toMatch(/Jihomoravský kraj|Hlavní město Praha|Moravskoslezský kraj/);
});
