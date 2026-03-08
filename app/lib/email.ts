export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('[Resend API] Missing RESEND_API_KEY in environment variables.');
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use the domain the user configured previously
        from: 'Supertime <hello@supertime.wtf>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend API] Error sending email:', data);
      return { success: false, error: data.message || 'Error sending email' };
    }

    console.log('[Resend API] Successfully sent email to:', to);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend API] Fatal network error:', error);
    return { success: false, error: error.message };
  }
}
