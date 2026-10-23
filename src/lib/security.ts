import { db } from './db';
import { securityEvents } from './db/schema';

type SecurityEventInput = {
  userId?: string | null;
  event: string;
  request?: Request;
  metadata?: Record<string, unknown>;
};

export async function recordSecurityEvent({
  userId = null,
  event,
  request,
  metadata = {},
}: SecurityEventInput) {
  try {
    await db.insert(securityEvents).values({
      id: crypto.randomUUID(),
      userId,
      event,
      ipAddress:
        request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request?.headers.get('x-real-ip') ||
        null,
      userAgent: request?.headers.get('user-agent') || null,
      metadata,
    });
  } catch (error) {
    console.error('Unable to record security event', error);
  }
}
