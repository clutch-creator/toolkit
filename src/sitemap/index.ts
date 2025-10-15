import { MetadataRoute } from 'next';
import { Sitemap } from './types.js';

export * from './types.js';

const parsePathSegments = (value: string | undefined): string[] => {
  if (!value) return [];

  const regex = /\[\[?([^\]]+)\]?\]/g;
  const segments: string[] = [];
  let match;

  while ((match = regex.exec(value))) {
    if (match[1]) {
      segments.push(match[1]);
    }
  }

  return segments;
};

export function parseSitemap(
  sitemap: Sitemap,
  pagePath?: string
): MetadataRoute.Sitemap {
  const segments = pagePath ? parsePathSegments(pagePath) : [];

  return sitemap.reduce<MetadataRoute.Sitemap>((acc, item) => {
    let resultUrl = pagePath || '';

    if (!item.url) return acc;

    if (typeof item.url === 'string') {
      resultUrl = item.url;
    }

    // object to replace segments
    if (typeof item.url === 'object') {
      segments.forEach(paramName => {
        let paramValue =
          typeof item.url === 'object' && item.url !== null
            ? (item.url[paramName] ?? paramName)
            : paramName;

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
    }

    if (resultUrl.startsWith('/')) {
      const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';

      resultUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL}${basePath}${resultUrl}`;
    }

    acc.push({
      ...item,
      url: resultUrl,
    });

    return acc;
  }, []);
}
