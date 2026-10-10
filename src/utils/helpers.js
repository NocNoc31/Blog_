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
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function slugify(string) {
  return string
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateCategoryData(categories) {
  let categoryData = [];
  categories.forEach((category) => {
    categoryData.push({
      name: category,
      slug: `${slugify(category)}`,
    });
  });
  return categoryData;
}