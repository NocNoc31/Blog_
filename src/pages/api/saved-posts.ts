import type { APIRoute } from 'astro';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../lib/db';
import { savedPosts } from '../../lib/db/schema';
import { recordSecurityEvent } from '../../lib/security';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const readBody = async (request: Request) => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const validPostPath = (value: string) =>
  value.startsWith('/blog/') && !value.includes('..') && value.length <= 300;

const sameOrigin = (request: Request, url: URL) => {
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return json({ message: 'Bạn cần đăng nhập để xem bài đã lưu.' }, 401);
  }

  const posts = await db
    .select({
      id: savedPosts.id,
      postSlug: savedPosts.postSlug,
      postTitle: savedPosts.postTitle,
      postUrl: savedPosts.postUrl,
      createdAt: savedPosts.createdAt,
    })
    .from(savedPosts)
    .where(eq(savedPosts.userId, locals.user.id))
    .orderBy(desc(savedPosts.createdAt));

  return json({ posts });
};

export const POST: APIRoute = async ({ request, locals, url }) => {
  if (!sameOrigin(request, url)) {
    return json({ message: 'Yêu cầu không hợp lệ.' }, 403);
  }

  if (!locals.user) {
    return json({ message: 'Bạn cần đăng nhập để lưu bài.' }, 401);
  }

  const body = await readBody(request);
  const postSlug = cleanText(body?.postSlug, 300).replace(/\/+$/, '');
  const postTitle = cleanText(body?.postTitle, 240);
  const postUrl = cleanText(body?.postUrl, 300).replace(/\/+$/, '');

  if (!validPostPath(postSlug) || !postTitle || !validPostPath(postUrl)) {
    return json({ message: 'Thông tin bài viết không hợp lệ.' }, 400);
  }

  const existing = await db
    .select({ id: savedPosts.id })
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, locals.user.id), eq(savedPosts.postSlug, postSlug)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(savedPosts).where(eq(savedPosts.id, existing[0].id));
    return json({ saved: false });
  }

  await db.insert(savedPosts).values({
    id: crypto.randomUUID(),
    userId: locals.user.id,
    postSlug,
    postTitle,
    postUrl,
  });

  await recordSecurityEvent({
    userId: locals.user.id,
    event: 'saved_post.created',
    request,
    metadata: { postSlug },
  });

  return json({ saved: true });
};

export const DELETE: APIRoute = async ({ request, locals, url }) => {
  if (!sameOrigin(request, url)) {
    return json({ message: 'Yêu cầu không hợp lệ.' }, 403);
  }

  if (!locals.user) {
    return json({ message: 'Bạn cần đăng nhập để bỏ lưu bài.' }, 401);
  }

  const body = await readBody(request);
  const postSlug = cleanText(body?.postSlug, 300).replace(/\/+$/, '');

  if (!validPostPath(postSlug)) {
    return json({ message: 'Thông tin bài viết không hợp lệ.' }, 400);
  }

  await db
    .delete(savedPosts)
    .where(and(eq(savedPosts.userId, locals.user.id), eq(savedPosts.postSlug, postSlug)));

  return json({ saved: false });
};
