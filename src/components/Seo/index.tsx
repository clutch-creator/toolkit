import React from 'react';
import { TRobots, TSeo, TSeoOg, TSeoTwitter } from './types.js';

function buildRobots(robots: TRobots) {
  return robots
    ? Object.entries(robots)
        .map(([key, value]) => `${key}:${value}`)
        .join(', ')
    : '';
}

function camelCaseToMeta(name: string) {
  return name
    .replace(/([A-Z])/g, match => `:${match.toLowerCase()}`)
    .replace(/^:/, '');
}

type TwitterMetaProps = {
  twitter?: TSeoTwitter;
};

function TwitterMeta({ twitter }: TwitterMetaProps) {
  if (!twitter || typeof twitter !== 'object') return null;
  const result: React.ReactElement[] = [];

  Object.entries(twitter).map(([key, value]) => {
    if (key && typeof value === 'string') {
      result.push(
        <meta
          name={`twitter:${camelCaseToMeta(key)}`}
          content={value}
          key={key}
        />
      );
    }
  });

  return <>{result}</>;
}

type TOgMetaProps = {
  og?: TSeoOg;
};

function OgMeta({ og }: TOgMetaProps) {
  if (!og || typeof og !== 'object') return null;

  const result: React.ReactElement[] = [];

  Object.entries(og).map(([key, value]) => {
    if (key === 'images' && og.images && Array.isArray(og.images)) {
      result.push(
        ...og.images.map((image, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={`images-${index}`}>
            {image.url && <meta property='og:image' content={image.url} />}
            {image.type && (
              <meta property='og:image:type' content={image.type} />
            )}
            {image.width && (
              <meta
                property='og:image:width'
                content={image.width.toString()}
              />
            )}
            {image.height && (
              <meta
                property='og:image:height'
                content={image.height.toString()}
              />
            )}
            {image.alt && <meta property='og:image:alt' content={image.alt} />}
          </React.Fragment>
        ))
      );
    } else if (key && typeof value === 'string') {
      result.push(
        <meta
          property={`og:${camelCaseToMeta(key)}`}
          content={value}
          key={key}
        />
      );
    }
  });

  return <>{result}</>;
}

function getAbsoluteUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_WEBSITE_URL}${url}`;
  }

  return url;
}

type TSeoProps = {
  seoData: TSeo;
};

export function Seo({ seoData }: TSeoProps) {
  if (!seoData) return null;

  return (
    <>
      {seoData?.title && <title>{seoData.title}</title>}
      {seoData?.description && (
        <meta name='description' content={seoData.description} />
      )}
      {seoData?.robots && (
        <meta name='robots' content={buildRobots(seoData.robots)} />
      )}
      {seoData?.canonical && typeof seoData?.canonical == 'string' && (
        <link rel='canonical' href={getAbsoluteUrl(seoData.canonical)} />
      )}
      {seoData?.favicon && <link rel='icon' href={seoData.favicon} />}
      {seoData?.schema && (
        <script
          type='application/ld+seoData'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData.schema) }}
        />
      )}
      <OgMeta og={seoData?.og} />
      <TwitterMeta twitter={seoData?.twitter} />
    </>
  );
}
