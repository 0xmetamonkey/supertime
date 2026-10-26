/**
 * HTML-escape dynamic values before interpolating them into email HTML.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PRODUCTION_ORIGIN = 'https://supertime.wtf';

/**
 * SECURITY: never build outbound email links from the attacker-controllable
 * Host/X-Forwarded-Host header. Prefer configured APP_URL; only trust the
 * request host when it is obviously localhost (local development).
 */
export function getCanonicalBaseUrl(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  const host =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `http://${host}`;
  }

  return (configured || PRODUCTION_ORIGIN).replace(/\/$/, '');
}
