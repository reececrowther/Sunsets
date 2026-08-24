import type { MetadataRoute } from 'next'
import { getAllLocationSlugs } from '@/lib/database/locations'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sunsetscore.com'
  const slugs = await getAllLocationSlugs()

  return [
    {
      url:             base,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        1,
    },
    ...slugs.map(slug => ({
      url:             `${base}/sunset/${slug}`,
      lastModified:    new Date(),
      changeFrequency: 'hourly' as const,
      priority:        0.8,
    })),
  ]
}
