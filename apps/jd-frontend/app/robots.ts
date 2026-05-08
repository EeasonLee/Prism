import type { MetadataRoute } from 'next';
import { env } from '@/infrastructure/config/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/blog', '/recipes', '/'],
        disallow: ['/api/', '/_next/', '/admin/'],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
