import crypto from "crypto";

/**
 * Verify an inbound Repliz webhook.
 *
 * Repliz's public webhook does not document a signing scheme, so we support two
 * complementary mechanisms (configure whichever your Repliz setup provides):
 *   1. Shared secret in the URL path/query (`?secret=...`) — simplest.
 *   2. HMAC signature header (`x-repliz-signature`) over the raw body, if available.
 *
 * If REPLIZ_WEBHOOK_SECRET is unset, verification is skipped (dev only).
 */
export function verifyReplizWebhook(opts: {
  rawBody: string;
  signatureHeader?: string | null;
  secretFromUrl?: string | null;
}): boolean {
  const secret = process.env.REPLIZ_WEBHOOK_SECRET;
  if (!secret) return true; // not configured → accept (dev)

  // 1) shared secret in URL
  if (opts.secretFromUrl && safeEqual(opts.secretFromUrl, secret)) return true;

  // 2) HMAC over raw body
  if (opts.signatureHeader) {
    const expected = crypto.createHmac("sha256", secret).update(opts.rawBody).digest("hex");
    const provided = opts.signatureHeader.replace(/^sha256=/, "");
    if (safeEqual(provided, expected)) return true;
  }

  return false;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
