import { MetadataRoute } from 'next';
import { Sitemap } from './types.js';

export * from './types.js';

const parsePathSegments = (value: string | undefined): string[] => {
  if (!value) return [];

  const regex = /\[\[?([^\]]+)\]?\]/g;
  const segments: string[] = [];
  let match;

  while ((match = regex.exec(value))) {
    segments.push(match[1]);
  }

  return segments;
};

export function parseSitemap(
  sitemap: Sitemap,
  pagePath?: string
): MetadataRoute.Sitemap {
  const segments = pagePath ? parsePathSegments(pagePath) : [];

  if (!segments?.length) {
    return [];
  }

  return sitemap.reduce<MetadataRoute.Sitemap>((acc, item) => {
    let resultUrl = pagePath || '';

    if (!item.url || typeof item.url !== 'object' || Array.isArray(item.url)) {
      return acc;
    }

    // object to replace segments
    segments.forEach(paramName => {
      let paramValue = item.url?.[paramName] ?? paramName;

      // Arrays are only allowed for catch-all segments
      if (Array.isArray(paramValue)) {
        paramValue =
          paramName.startsWith('...') && paramValue.length > 0
            ? paramValue.join('/')
            : '';
      }

      resultUrl = resultUrl
        .replace(`[[${paramName}]]`, paramValue)
        .replace(`[${paramName}]`, paramValue)
        .replace('//', '/');
    });

    if (resultUrl.startsWith('/')) {
      resultUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}${resultUrl}`;
    }

    acc.push({
      ...item,
      url: resultUrl,
    });

    return acc;
  }, []);
}
