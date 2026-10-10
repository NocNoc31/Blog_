/**
 * Prefix root-absolute markdown URLs with the GitHub Pages project base.
 * Astro's `base` rewrites bundled assets, not markdown image/HTML paths.
 */
export default function remarkBasePath(base = '/Blog_') {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

  const withBase = (url) => {
    if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return url;
    if (url === prefix || url.startsWith(`${prefix}/`)) return url;
    return prefix + url;
  };

  const rewriteHtml = (value) =>
    value.replace(
      /(\s(?:src|href|srcset)\s*=\s*["'])(\/(?!\/)[^"']*)/gi,
      (_, attr, path) => attr + withBase(path)
    );

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if ((node.type === 'image' || node.type === 'link' || node.type === 'definition') && node.url) {
      node.url = withBase(node.url);
    }
    if (node.type === 'html' && typeof node.value === 'string') {
      node.value = rewriteHtml(node.value);
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };

  return (tree) => walk(tree);
}
