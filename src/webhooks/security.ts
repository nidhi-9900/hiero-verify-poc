// Verifies that the webhook actually came from GitHub
// Uses timing-safe comparison to prevent signature attacks

import crypto from 'crypto';

export function verifySignature(payload: Buffer, signature: string, secret: string): boolean {
  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    // buffers were different lengths — definitely not equal
    return false;
  }
}

export function verifyDelivery(deliveryId: string): boolean {
  // checks that GitHub sent a delivery ID — basic sanity check
  // full replay protection via delivery ID deduplication is phase 2
  return !!deliveryId && deliveryId.length > 0;
}