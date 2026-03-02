import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'


const workflowsDir = join(__dirname)

function readWorkflow(filename: string): string {
  return readFileSync(join(workflowsDir, filename), 'utf-8')
}

describe('ci.yml', () => {
  const content = readWorkflow('ci.yml')

  it('triggers on pull_request to main', () => {
    expect(content).toContain('pull_request')
    expect(content).toContain('branches: [main]')
  })

  it('runs on ubuntu-latest', () => {
    expect(content).toContain('ubuntu-latest')
  })

  it('uses Node.js 20', () => {
    expect(content).toContain("node-version: '20'")
  })

  it('caches npm dependencies', () => {
    expect(content).toContain("cache: 'npm'")
  })

  it('installs dependencies with npm ci', () => {
    expect(content).toContain('npm ci')
  })

  it('runs lint step', () => {
    expect(content).toContain('npm run lint')
  })

  it('runs test step', () => {
    expect(content).toContain('npm run test')
  })

  it('runs build step', () => {
    expect(content).toContain('npm run build')
  })

  it('provides Supabase env vars for build', () => {
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('provides fallback values for optional secrets', () => {
    expect(content).toContain('placeholder')
  })
})

describe('deploy.yml', () => {
  const content = readWorkflow('deploy.yml')

  it('triggers on push to main', () => {
    expect(content).toContain('push')
    expect(content).toContain('branches: [main]')
  })

  it('runs on ubuntu-latest', () => {
    expect(content).toContain('ubuntu-latest')
  })

  it('uses Node.js 20', () => {
    expect(content).toContain("node-version: '20'")
  })

  it('references VERCEL_TOKEN secret', () => {
    expect(content).toContain('VERCEL_TOKEN')
  })

  it('references VERCEL_ORG_ID secret', () => {
    expect(content).toContain('VERCEL_ORG_ID')
  })

  it('references VERCEL_PROJECT_ID secret', () => {
    expect(content).toContain('VERCEL_PROJECT_ID')
  })

  it('passes staging Supabase env vars to Vercel', () => {
    expect(content).toContain('STAGING_SUPABASE_URL')
    expect(content).toContain('STAGING_SUPABASE_ANON_KEY')
    expect(content).toContain('STAGING_SUPABASE_SERVICE_ROLE_KEY')
  })

  it('passes staging MapTiler key', () => {
    expect(content).toContain('STAGING_MAPTILER_KEY')
  })

  it('passes staging Resend key', () => {
    expect(content).toContain('STAGING_RESEND_API_KEY')
  })

  it('documents required secrets in comments', () => {
    expect(content).toContain('vercel.com/account/tokens')
    expect(content).toContain('vercel link')
  })

  it('does NOT use --prod flag (staging is a preview deployment)', () => {
    expect(content).not.toContain('--prod')
  })

  it('runs lint before deploying', () => {
    expect(content).toContain('npm run lint')
  })

  it('runs tests before deploying', () => {
    expect(content).toContain('npm run test')
  })

  it('runs build before deploying', () => {
    expect(content).toContain('npm run build')
  })
})

describe('deploy-production.yml', () => {
  const content = readWorkflow('deploy-production.yml')

  it('triggers on version tags', () => {
    expect(content).toContain('tags:')
    expect(content).toContain("- 'v*'")
  })

  it('supports manual workflow_dispatch trigger', () => {
    expect(content).toContain('workflow_dispatch')
  })

  it('runs on ubuntu-latest', () => {
    expect(content).toContain('ubuntu-latest')
  })

  it('uses Node.js 20', () => {
    expect(content).toContain("node-version: '20'")
  })

  it('caches npm dependencies', () => {
    expect(content).toContain("cache: 'npm'")
  })

  it('runs lint before deploying', () => {
    expect(content).toContain('npm run lint')
  })

  it('runs tests before deploying', () => {
    expect(content).toContain('npm run test')
  })

  it('runs build before deploying', () => {
    expect(content).toContain('npm run build')
  })

  it('references PROD_ prefixed Supabase secrets', () => {
    expect(content).toContain('PROD_SUPABASE_URL')
    expect(content).toContain('PROD_SUPABASE_ANON_KEY')
    expect(content).toContain('PROD_SUPABASE_SERVICE_ROLE_KEY')
  })

  it('references PROD_MAPTILER_KEY secret', () => {
    expect(content).toContain('PROD_MAPTILER_KEY')
  })

  it('references PROD_RESEND_API_KEY secret', () => {
    expect(content).toContain('PROD_RESEND_API_KEY')
  })

  it('references PROD_APP_URL secret', () => {
    expect(content).toContain('PROD_APP_URL')
  })

  it('references PROD_APP_URL for public domain', () => {
    expect(content).toContain('PROD_APP_URL')
  })

  it('references VERCEL_TOKEN secret', () => {
    expect(content).toContain('VERCEL_TOKEN')
  })

  it('references VERCEL_ORG_ID and VERCEL_PROJECT_ID', () => {
    expect(content).toContain('VERCEL_ORG_ID')
    expect(content).toContain('VERCEL_PROJECT_ID')
  })

  it('documents supabase migration step in comments', () => {
    expect(content).toContain('supabase db push')
  })

  it('documents DNS setup in comments', () => {
    expect(content).toContain('DNS')
  })
})
