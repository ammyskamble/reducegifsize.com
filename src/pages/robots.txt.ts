import type { APIRoute } from 'astro';

const getRobotsTxt = (sitemapURL: URL, sitemapIndexURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
Sitemap: ${sitemapIndexURL.href}
`.trim();

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap.xml', site);
  const sitemapIndexURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL, sitemapIndexURL), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
