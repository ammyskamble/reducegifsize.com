import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, '') : (process.env.SITE_URL || 'https://reducegifsize.pages.dev');

  const robotsTxt = `# Allow all search engine crawlers
User-agent: *
Allow: /

# Disallow indexing of standalone error status pages
Disallow: /404.html
Disallow: /500.html

# Host
Host: ${siteUrl}

# Sitemaps
Sitemap: ${siteUrl}/sitemap-index.xml
Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
