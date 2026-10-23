import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

const skipPrefixes = ['/_astro/', '/api/auth/', '/favicon', '/images/', '/fonts/'];

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  context.locals.user = null;
  context.locals.session = null;

  if (skipPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  try {
    const result = await auth.api.getSession({ headers: context.request.headers });
    context.locals.user = result?.user ?? null;
    context.locals.session = result?.session ?? null;
  } catch (error) {
    console.error('Unable to resolve auth session', error);
  }

  return next();
});
