import type { MetadataRoute } from 'next';

export type SitemapEntry = Omit<MetadataRoute.Sitemap[0], 'url'> & {
  url: { [pathSegment: string]: string | string[] };
};

export type Sitemap = Array<SitemapEntry>;
