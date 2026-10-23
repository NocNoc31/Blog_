import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = (site?.toString() || 'http://localhost:4321').replace(/\/$/, '');
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /tai-khoan',
    'Disallow: /dang-nhap',
    'Disallow: /dang-ky',
    'Disallow: /quen-mat-khau',
    'Disallow: /dat-lai-mat-khau',
    'Disallow: /xac-thuc-email',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
