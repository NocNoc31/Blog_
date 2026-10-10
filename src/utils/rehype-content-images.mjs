import path from 'node:path';
import { readImageSize } from './image-size.mjs';

/**
 * Give markdown images a reserved size and keep them off the initial load.
 * The post hero is not part of the markdown tree.
 */
export default function rehypeContentImages(base = '/Blog_/') {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

  const localFile = (src) => {
    if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return null;
    const pathOnly = src.split(/[?#]/)[0];
    let relative = pathOnly;
    if (prefix && (relative === prefix || relative.startsWith(`${prefix}/`))) {
      relative = relative.slice(prefix.length);
    }
    if (!relative.startsWith('/') || relative.includes('..')) return null;
    return path.join(process.cwd(), 'public', relative.slice(1));
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element' && node.tagName === 'img') {
      const props = node.properties || (node.properties = {});
      const file = localFile(props.src);
      if (file && props.width == null && props.height == null) {
        const size = readImageSize(file);
        if (size) {
          props.width = size.width;
          props.height = size.height;
        }
      }
      if (props.loading == null) props.loading = 'lazy';
      if (props.decoding == null) props.decoding = 'async';
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };

  return (tree) => walk(tree);
}
