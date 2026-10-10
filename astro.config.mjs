import { defineConfig } from 'astro/config';
import { settings } from './src/data/settings';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBasePath from './src/utils/remark-base-path.mjs';
// Astro 7 renders Markdown with Sätteri unless a processor is set. Keep unified
// so remark-math, rehype-katex, and remark-base-path still run.
// Source: https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri
// Source: https://docs.astro.build/en/reference/markdown-processors/unified/#optionsremarkplugins
import { unified } from '@astrojs/markdown-remark';

const remarkPlugins = [remarkMath, [remarkBasePath, settings.base]];
const rehypePlugins = [rehypeKatex];

// https://astro.build/config
export default defineConfig({
  site: settings.site,
  base: settings.base,
  // Astro 7 defaults to JSX whitespace collapsing, which drops spaces between inline elements.
  // Source: https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx
  compressHTML: false,
  // Retain :where() scoping from Astro 1/2. The v3 default is attribute selectors.
  // Source: https://docs.astro.build/en/guides/upgrade-to/v3/#changed-default-scopedstylestrategy
  scopedStyleStrategy: 'where',
  build: {
    // Keep styles in linked files. v3 inlines small stylesheets by default.
    // Source: https://docs.astro.build/en/guides/upgrade-to/v3/#changed-default-inlinestylesheets
    inlineStylesheets: 'never',
  },
  markdown: {
    processor: unified({
      remarkPlugins,
      rehypePlugins,
    }),
  },
  // MDX inherits markdown.processor, including GFM, by default.
  // Source: https://docs.astro.build/en/guides/integrations-guide/mdx/#extendmarkdownconfig
  integrations: [sitemap(), mdx(), icon()],
});