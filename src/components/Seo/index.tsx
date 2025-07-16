import React from 'react';

function buildRobots(robots) {
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

function TwitterMeta({ twitter }) {
  if (!twitter || typeof twitter !== 'object') return null;
  let result = [];

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

function OgMeta({ og }) {
  if (!og || typeof og !== 'object') return null;

  let result = [];

  Object.entries(og).map(([key, value]) => {
    if (key === 'images' && value && Array.isArray(value)) {
      result.push(
        ...value?.map((image, index) => (
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

export function Seo({ seoData }) {
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
      {seoData?.canonical && <link rel='canonical' href={seoData.canonical} />}
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
