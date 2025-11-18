// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

import partytown from '@astrojs/partytown';

import markdoc from '@astrojs/markdoc';

import alpinejs from '@astrojs/alpinejs';

import icon from 'astro-icon';

import robotsTxt from 'astro-robots-txt';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), sitemap(), partytown(), markdoc(), alpinejs(), icon(), robotsTxt(), svelte()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});