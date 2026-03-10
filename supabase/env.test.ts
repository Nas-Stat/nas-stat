import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expect, test } from 'vitest';

const ENV_DEV_PATH = join(process.cwd(), '.env.development');

test('.env.development file exists and is committed', () => {
  expect(existsSync(ENV_DEV_PATH)).toBe(true);
});

test('.env.development contains required Supabase keys', () => {
  const content = readFileSync(ENV_DEV_PATH, 'utf8');
  expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321');
  expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
  expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY=');
});

test('.env.development contains required app keys', () => {
  const content = readFileSync(ENV_DEV_PATH, 'utf8');
  expect(content).toContain('NEXT_PUBLIC_MAPTILER_KEY=');
  expect(content).toContain('NEXT_PUBLIC_APP_URL=http://localhost:3000');
});

test('.env.example documents env strategy', () => {
  const examplePath = join(process.cwd(), '.env.example');
  expect(existsSync(examplePath)).toBe(true);
  const content = readFileSync(examplePath, 'utf8');
  expect(content).toContain('.env.development');
  expect(content).toContain('.env.local');
  expect(content).toContain('priority');
});
