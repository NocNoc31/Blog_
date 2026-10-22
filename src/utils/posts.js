import { slugify } from './helpers.js';

export function sortPosts(posts = []) {
  return [...posts].sort(
    (a, b) => new Date(b.frontmatter.publishedAt).valueOf() - new Date(a.frontmatter.publishedAt).valueOf()
  );
}

export function getCategories(posts = []) {
  const categories = new Map();

  for (const post of posts) {
    const name = post.frontmatter?.category;
    if (!name) continue;

    const slug = slugify(name);
    const entry = categories.get(slug) ?? { name, slug, count: 0 };
    entry.count += 1;
    categories.set(slug, entry);
  }

  return [...categories.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

export function getRelatedPosts(posts = [], currentFile, category, limit = 2) {
  const sorted = sortPosts(posts.filter((post) => post.file !== currentFile));
  if (!category) return sorted.slice(0, limit);

  const sameCategory = sorted.filter((post) => post.frontmatter?.category === category);
  const otherCategories = sorted.filter((post) => post.frontmatter?.category !== category);
  return [...sameCategory, ...otherCategories].slice(0, limit);
}
