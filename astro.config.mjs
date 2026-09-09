// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://reducegifsize.pages.dev';

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['omggif', 'gifenc', 'lucide-react']
    }
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/500'),
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
    })
  ]
});
