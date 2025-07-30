'use server';

import { unstable_cache } from 'next/cache';
import { getPlaiceholder } from 'plaiceholder';
import 'server-only';
import { logger } from '../../utils/logger.js';

const calculateImageInfo = unstable_cache(
  async (src: string) => {
    const isLocalImage = src.startsWith('/') && !src.startsWith('//');
    let imageUrl = src;

    if (isLocalImage) {
      imageUrl = process.env.NEXT_PUBLIC_WEBSITE_URL + src.split('?')[0];
    }

    const res = await fetch(imageUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${imageUrl}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    let result;

    try {
      result = await getPlaiceholder(buffer, { size: 10 });
    } catch (err) {
      logger.error('getPlaiceholder failed:', err);
      throw err;
    }

    const { base64, metadata, color, css } = result;

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata');
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
      blurDataURL: base64,
      color: color?.hex || '',
      css,
    };
  },
  undefined,
  {
    tags: ['image-info'],
    revalidate: false,
  }
);

export const getImageInfo = async (src: unknown) => {
  let result = {
    width: 0,
    height: 0,
    blurDataURL: '',
    format: '',
    color: '',
    css: {},
  };

  if (typeof src === 'string' && src) {
    try {
      result = await calculateImageInfo(src);
    } catch (err) {
      logger.error('Error getting image:', err);
    }
  }

  return result;
};
