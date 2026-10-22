/** Prefix a site-root path with Astro's base (`/Blog_/`). Leaves external URLs alone. */
export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL || '/';
  if (path == null || path === '') return base;
  if (/^(?:[a-z]+:)?\/\//i.test(path)) return path;
  if (path === base || (base !== '/' && path.startsWith(base))) return path;
  if (path === '/') return base;
  const suffix = path.startsWith('/') ? path.slice(1) : path;
  return base.endsWith('/') ? base + suffix : `${base}/${suffix}`;
}

export function formatDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return '';

  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getReadingTime(content = '', wordsPerMinute = 200) {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-\[\]()]/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function slugify(string) {
  return string
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
