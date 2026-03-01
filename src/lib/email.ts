const STATUS_LABELS: Record<string, string> = {
  pending: 'Čeká na zpracování',
  in_review: 'V řešení',
  resolved: 'Vyřešeno',
  rejected: 'Zamítnuto',
};

export function buildStatusChangeEmail(
  reportTitle: string,
  newStatus: string,
  reportUrl: string
): { subject: string; html: string } {
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const subject = `Stav vašeho hlášení byl změněn: ${statusLabel}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #111827;">Aktualizace hlášení: ${reportTitle}</h2>
      <p>Dobrý den,</p>
      <p>stav vašeho hlášení <strong>&quot;${reportTitle}&quot;</strong> byl změněn na: <strong>${statusLabel}</strong>.</p>
      <p style="margin-top: 24px;">
        <a href="${reportUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">
          Zobrazit hlášení
        </a>
      </p>
      <p style="margin-top: 32px; color: #6b7280; font-size: 0.875rem;">
        Tuto zprávu jste obdrželi, protože jste autorem hlášení na platformě Náš stát.
      </p>
    </div>
  `;
  return { subject, html };
}

export async function sendStatusChangeEmail(
  to: string,
  reportTitle: string,
  newStatus: string,
  reportId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const from = process.env.EMAIL_FROM ?? 'Náš stát <noreply@nasstat.cz>';
  const reportUrl = `${appUrl}/reports/${reportId}`;

  const { subject, html } = buildStatusChangeEmail(reportTitle, newStatus, reportUrl);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
}
