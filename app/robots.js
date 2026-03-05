const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobtracker.ai';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/login', '/auth/register', '/legal/'],
        disallow: ['/dashboard/', '/profile/', '/document/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
