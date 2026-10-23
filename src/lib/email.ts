import { Resend } from 'resend';

type EmailInput = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  footnote: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char];
  });

const renderEmail = ({ heading, body, actionLabel, actionUrl, footnote }: Omit<EmailInput, 'to' | 'subject'>) => `
<!doctype html>
<html lang="vi">
  <body style="margin:0;padding:32px 16px;background:#f4efe6;color:#24342b;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid #d8d0c1;border-radius:20px;">
      <tr>
        <td style="padding:36px 36px 12px;">
          <p style="margin:0;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#6b7c70;">nét mực.</p>
          <h1 style="margin:18px 0 14px;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:500;color:#1f3027;">${escapeHtml(heading)}</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#4b5a51;">${escapeHtml(body)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 36px 8px;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#2f5d46;color:#fffdf8;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(actionLabel)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 36px 36px;">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#7a877e;">${escapeHtml(footnote)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export async function sendEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'nét mực. <no-reply@example.com>';
  const html = renderEmail(input);

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email provider chưa được cấu hình.');
    }

    console.info(`\n[email:dev] ${input.subject}\nTo: ${input.to}\n${input.actionUrl}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html,
    text: `${input.heading}\n\n${input.body}\n\n${input.actionLabel}: ${input.actionUrl}\n\n${input.footnote}`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
