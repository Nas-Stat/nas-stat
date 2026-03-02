import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildStatusChangeEmail, sendStatusChangeEmail } from './email';

describe('buildStatusChangeEmail', () => {
  it.each([
    ['pending', 'Čeká na zpracování'],
    ['in_review', 'V řešení'],
    ['resolved', 'Vyřešeno'],
    ['rejected', 'Zamítnuto'],
  ] as const)('generates correct subject for status "%s"', (status, label) => {
    const { subject } = buildStatusChangeEmail('Test hlášení', status, 'http://localhost/reports/1');
    expect(subject).toContain(label);
  });

  it('includes report title in email body', () => {
    const { html } = buildStatusChangeEmail('Rozbité hřiště', 'resolved', 'http://localhost/reports/1');
    expect(html).toContain('Rozbité hřiště');
  });

  it('includes report URL as link in email body', () => {
    const reportUrl = 'http://localhost:3000/reports/abc-123';
    const { html } = buildStatusChangeEmail('Test', 'in_review', reportUrl);
    expect(html).toContain(reportUrl);
  });

  it('uses raw status string as fallback label for unknown status', () => {
    const { subject } = buildStatusChangeEmail('Test', 'unknown_status', 'http://localhost/r/1');
    expect(subject).toContain('unknown_status');
  });
});

describe('sendStatusChangeEmail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('does nothing when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    await sendStatusChangeEmail('user@example.com', 'Test', 'resolved', 'report-id');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls Resend API with correct Authorization header and method', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.EMAIL_FROM = 'noreply@test.cz';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendStatusChangeEmail('user@example.com', 'Test hlášení', 'in_review', 'report-uuid');

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-resend-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('sends correct recipient, subject, and report link', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendStatusChangeEmail('recipient@example.com', 'Hlášení XYZ', 'resolved', 'uuid-999');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.to).toBe('recipient@example.com');
    expect(body.subject).toContain('Vyřešeno');
    expect(body.html).toContain('http://localhost:3000/reports/uuid-999');
  });

  it('uses fallback app URL when NEXT_PUBLIC_APP_URL is not set', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    delete process.env.NEXT_PUBLIC_APP_URL;

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendStatusChangeEmail('user@example.com', 'Test', 'pending', 'some-id');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.html).toContain('http://localhost:3000/reports/some-id');
  });

  it('throws when Resend API returns a non-ok HTTP status', async () => {
    process.env.RESEND_API_KEY = 'bad-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      sendStatusChangeEmail('user@example.com', 'Test', 'resolved', 'report-id')
    ).rejects.toThrow('Resend error: 401');
  });

  it.each([
    ['pending', 'Čeká na zpracování'],
    ['in_review', 'V řešení'],
    ['resolved', 'Vyřešeno'],
    ['rejected', 'Zamítnuto'],
  ] as const)('sends correct Czech label for status "%s"', async (status, label) => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    await sendStatusChangeEmail('user@example.com', 'Test', status, 'id-1');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.subject).toContain(label);
  });
});
