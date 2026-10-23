import { sortPosts } from './posts.js';

const modules = import.meta.glob('../pages/blog/*.{md,mdx}', { eager: true });

export const allPosts = sortPosts(
  Object.entries(modules).map(([file, post]) => ({
    ...post,
    file: post.file ?? file,
  }))
);
