import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import icon from 'astro-icon';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBasePath from './src/utils/remark-base-path.mjs';
import rehypeTableWrap from './src/utils/rehype-table-wrap.mjs';

const base = '/';
const site = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
const slugify = (value) =>
  value
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

const blogDir = new URL('./src/pages/blog/', import.meta.url);
const categorySlugs = [
  ...new Set(
    readdirSync(blogDir)
      .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
      .map((file) => {
        const source = readFileSync(new URL(file, blogDir), 'utf8');
        const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
        return frontmatter?.match(/^category:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
      })
      .filter(Boolean)
      .map(slugify)
  ),
];

const privatePrefixes = [
  '/dang-nhap',
  '/dang-ky',
  '/quen-mat-khau',
  '/dat-lai-mat-khau',
  '/xac-thuc-email',
  '/tai-khoan',
];

const processor = unified({
  remarkPlugins: [remarkMath, [remarkBasePath, base]],
  rehypePlugins: [rehypeKatex, rehypeTableWrap],
});

export default defineConfig({
  site,
  base,
  output: 'server',
  adapter: vercel(),
  security: {
    checkOrigin: true,
  },
  markdown: {
    processor,
  },
  integrations: [
    icon({
      include: {
        mdi: ['facebook', 'github', 'instagram'],
      },
    }),
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        return !privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
      },
      customPages: categorySlugs.map((slug) => new URL(`/blog/category/${slug}/`, site).href),
    }),
    mdx(),
  ],
  vite: {
    ssr: {
      external: ['svgo'],
    },
  },
});
