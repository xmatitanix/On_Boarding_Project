/**
 * Vercel Serverless Function — webhook proxy
 *
 * Forwards form submissions to Make.com without exposing webhook URLs
 * in client-side code. URLs are stored in Vercel environment variables.
 *
 * Environment variables to configure in Vercel dashboard:
 *   MAKE_WEBHOOK_CHAT
 *   MAKE_WEBHOOK_SAAS
 *   MAKE_WEBHOOK_ECOMMERCE
 *   MAKE_WEBHOOK_FINANCE
 *   MAKE_WEBHOOK_WELLNESS
 *   MAKE_WEBHOOK_CRM
 *   MAKE_WEBHOOK_SPORTS
 *   MAKE_WEBHOOK_INDUSTRIAL
 */

const ROUTE_MAP = {
  chat:       'MAKE_WEBHOOK_CHAT',
  saas:       'MAKE_WEBHOOK_SAAS',
  ecommerce:  'MAKE_WEBHOOK_ECOMMERCE',
  finance:    'MAKE_WEBHOOK_FINANCE',
  wellness:   'MAKE_WEBHOOK_WELLNESS',
  crm:        'MAKE_WEBHOOK_CRM',
  sports:     'MAKE_WEBHOOK_SPORTS',
  industrial: 'MAKE_WEBHOOK_INDUSTRIAL',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { _route, ...payload } = body;

  if (!_route || !ROUTE_MAP[_route]) {
    return res.status(400).json({ error: 'Unknown route' });
  }

  const webhookUrl = process.env[ROUTE_MAP[_route]];

  // Webhook not configured — return success silently so UI shows confirmation
  if (!webhookUrl) {
    return res.status(200).json({ ok: true, note: 'webhook not configured' });
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const upstream = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (upstream.ok) {
        return res.status(200).json({ ok: true });
      }
      // Non-2xx from Make.com — retry
    } catch (_err) {
      // Network error — retry
    }
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, attempt * 900));
    }
  }

  return res.status(502).json({ ok: false, error: 'upstream failed' });
};
