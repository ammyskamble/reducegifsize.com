import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const siteUrl = site ? site.href.replace(/\/$/, '') : (process.env.SITE_URL || 'https://reducegifsize.pages.dev');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
  </url>
  <url>
    <loc>${siteUrl}/about/</loc>
  </url>
  <url>
    <loc>${siteUrl}/blog/</loc>
  </url>
  <url>
    <loc>${siteUrl}/blog/reduce-gif-size-without-losing-quality/</loc>
  </url>
  <url>
    <loc>${siteUrl}/blog/korean-platform-gif-upload-limits/</loc>
  </url>
  <url>
    <loc>${siteUrl}/blog/ecommerce-smartstore-gif-optimization/</loc>
  </url>
  <url>
    <loc>${siteUrl}/blog/why-webp-is-better-than-gif/</loc>
  </url>
  <url>
    <loc>${siteUrl}/contact/</loc>
  </url>
  <url>
    <loc>${siteUrl}/privacy/</loc>
  </url>
  <url>
    <loc>${siteUrl}/terms/</loc>
  </url>
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
