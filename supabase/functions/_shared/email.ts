import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

type RenderEmailInput = {
  title: string
  body?: string | null
  cta?: { href: string; label: string } | null
  previewText?: string | null
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderBaseEmail({ title, body, cta, previewText }: RenderEmailInput) {
  const safeTitle = escapeHtml(title)
  const safePreview = previewText ? escapeHtml(previewText) : ''
  const bodyHtml = body ? `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${escapeHtml(body)}</p>` : ''
  const ctaHtml = cta
    ? `<p style="margin:24px 0 0;"><a href="${cta.href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:600;">${escapeHtml(
        cta.label,
      )}</a></p>`
    : ''

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(90deg,#0ea5e9,#10b981);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.95;">Guess to Survive</div>
                <div style="font-size:18px;font-weight:700;margin-top:4px;">${safeTitle}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                ${bodyHtml}
                ${ctaHtml}
                <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
                  You are receiving this because you have an account on Guess to Survive.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

type SendEmailInput = {
  html: string
  subject: string
  to: string
}

export async function sendResendEmail({ html, subject, to }: SendEmailInput) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return { skipped: true as const, reason: 'missing_resend_api_key' as const }
  }

  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Guess to Survive <onboarding@resend.dev>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      html,
      subject,
      to,
    }),
  })

  if (!response.ok) {
    const payload = await response.text().catch(() => '')
    throw new Error(`Resend API failed (${response.status}): ${payload}`)
  }

  return { skipped: false as const }
}

export async function sendEmailToUserId(
  supabase: SupabaseClient,
  userId: string,
  {
    body,
    cta,
    previewText,
    subject,
    title,
  }: { subject: string; title: string; body?: string | null; previewText?: string | null; cta?: RenderEmailInput['cta'] },
) {
  const {
    data: userResult,
    error: userError,
  } = await supabase.auth.admin.getUserById(userId)

  if (userError) {
    throw userError
  }

  const email = userResult.user?.email
  if (!email) {
    return { skipped: true as const, reason: 'missing_user_email' as const }
  }

  const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? 'http://localhost:5173'
  const html = renderBaseEmail({
    title,
    body,
    previewText,
    cta: cta ?? { href: appBaseUrl, label: 'Open Guess to Survive' },
  })

  return await sendResendEmail({ html, subject, to: email })
}

