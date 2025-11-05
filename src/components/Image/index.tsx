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

export function Image(props: TClutchImageProps) {
  const { src } = props;

  if (!src) return null;

  // If not in browser (server-side), use ServerImage
  if (typeof window === 'undefined') {
    return <ServerImage {...props} />;
  }

  return <ClientImage {...props} />;
}

async function ServerImage({
  src,
  className,
  placeholder,
  sizes = 'auto',
  ...props
}: TClutchImageProps) {
  const imageInfo = typeof src === 'string' ? await getImageInfo(src) : src;
  const { width, height, format, blurDataURL } = imageInfo;

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

function ClientImage({
  src,
  className,
  sizes = 'auto',
  placeholder,
  ...props
}: TClutchImageProps) {
  if (typeof src === 'string') {
    return <img src={src} className={className} {...props} />;
  }

  return <NextImage src={src} className={className} sizes={sizes} {...props} />;
}
