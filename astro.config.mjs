import { defineConfig } from 'astro/config';
import { settings } from './src/data/settings';
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBasePath from './src/utils/remark-base-path.mjs';

const remarkPlugins = [remarkMath, [remarkBasePath, settings.base]];
const rehypePlugins = [rehypeKatex];

// https://astro.build/config
export default defineConfig({
  site: settings.site,
  base: settings.base,
  markdown: {
    // Keep remark-gfm (tables) and remark-smartypants when custom plugins are set.
    extendDefaultPlugins: true,
    remarkPlugins,
    rehypePlugins,
  },
  integrations: [
    sitemap(),
    mdx({
      // astroDefaults keeps GFM without inheriting markdown plugins a second time.
      extendPlugins: 'astroDefaults',
      remarkPlugins,
      rehypePlugins,
    }),
  ],
  vite: {
    ssr: {
      external: ["svgo"]
    }
  }
});