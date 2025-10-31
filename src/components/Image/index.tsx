import NextImage from 'next/image';
import { getImageInfo } from './utils';

type TClutchImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: string;
  loading?: 'eager' | 'lazy' | undefined;
  className?: string;
  'data-d'?: string;
};

type PlaceholderValue = 'blur' | 'empty' | `data:image/${string}`;

export async function Image({
  src,
  className,
  placeholder,
  sizes = 'auto',
  ...props
}: TClutchImageProps) {
  if (!src) return null;

  const { width, height, format, blurDataURL } =
    typeof src === 'string' ? await getImageInfo(src) : src;

  let placeholderVal: PlaceholderValue = placeholder ? 'blur' : 'empty';
  const size = width + height;

  if (placeholder === undefined && format !== 'svg' && size > 80) {
    placeholderVal = 'blur';
  }

  return (
    <NextImage
      src={src}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      placeholder={placeholderVal}
      blurDataURL={blurDataURL}
      {...props}
    />
  );
}
