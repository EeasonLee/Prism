const IMAGE_SIZES = [80, 100, 150, 300, 350, 500, 650, 800, 1200] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number];

export interface RemoteImageFormat {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface RemoteImageFormats {
  large?: RemoteImageFormat | null;
  medium?: RemoteImageFormat | null;
  small?: RemoteImageFormat | null;
  thumbnail?: RemoteImageFormat | null;
}

export interface RemoteImage {
  url?: string | null;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: RemoteImageFormats | null;
}

export interface ResolveImageUrlOptions {
  size?: number;
  format?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  baseUrl?: string;
  domainRewriteMap?: Record<string, string>;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeSize(preferredSize?: number): ImageSize | null {
  if (!preferredSize || !Number.isFinite(preferredSize) || preferredSize <= 0) {
    return null;
  }

  let nearest: ImageSize = IMAGE_SIZES[0];
  let minDelta = Math.abs(preferredSize - nearest);

  for (const size of IMAGE_SIZES) {
    const delta = Math.abs(preferredSize - size);
    if (delta < minDelta) {
      nearest = size;
      minDelta = delta;
    }
  }

  return nearest;
}

function isAbsoluteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function applyDomainRewrite(
  url: string,
  rewriteMap?: Record<string, string>
): string | null {
  if (!rewriteMap) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, '');

    for (const [pattern, target] of Object.entries(rewriteMap)) {
      const normalizedPattern = pattern.replace(/^www\./, '');
      if (host === normalizedPattern) {
        return `${trimTrailingSlash(target)}${parsed.pathname}${parsed.search}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function appendSizeParam(url: string, size?: number): string {
  const normalizedSize = normalizeSize(size);
  if (!normalizedSize) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(normalizedSize));
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractUrlFromImage(
  image: RemoteImage,
  preferredFormat?: ResolveImageUrlOptions['format']
): string | null {
  if (preferredFormat === 'original') {
    return image.url ?? null;
  }

  if (preferredFormat) {
    const formatUrl = image.formats?.[preferredFormat]?.url;
    if (formatUrl) {
      return formatUrl;
    }
  }

  return (
    image.formats?.large?.url ??
    image.formats?.medium?.url ??
    image.formats?.small?.url ??
    image.formats?.thumbnail?.url ??
    image.url ??
    null
  );
}

function resolveRawUrl(
  rawUrl: string,
  options?: ResolveImageUrlOptions
): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const rewritten = isAbsoluteUrl(trimmed)
    ? applyDomainRewrite(trimmed, options?.domainRewriteMap)
    : null;
  const resolved = rewritten ?? trimmed;

  if (isAbsoluteUrl(resolved)) {
    return appendSizeParam(resolved, options?.size);
  }

  if (resolved.startsWith('/')) {
    const baseUrl = options?.baseUrl ? trimTrailingSlash(options.baseUrl) : '';
    return baseUrl ? `${baseUrl}${resolved}` : resolved;
  }

  const baseUrl = options?.baseUrl ? trimTrailingSlash(options.baseUrl) : '';
  return baseUrl ? `${baseUrl}/${resolved}` : `/${resolved}`;
}

export function resolveImageUrl(
  source: string | RemoteImage | null | undefined,
  options?: ResolveImageUrlOptions
): string | null {
  if (!source) {
    return null;
  }

  if (typeof source === 'object') {
    const imageUrl = extractUrlFromImage(source, options?.format);
    return imageUrl ? resolveRawUrl(imageUrl, options) : null;
  }

  return resolveRawUrl(source, options);
}

export function getOptimalCdnSize(
  maxDisplayWidth: number,
  pixelRatio = 2
): ImageSize | null {
  return normalizeSize(maxDisplayWidth * pixelRatio);
}

export function extractImageUrl(
  image: RemoteImage | null | undefined,
  preferredFormat?: ResolveImageUrlOptions['format']
): string | null {
  return image ? extractUrlFromImage(image, preferredFormat) : null;
}

export function shouldDisableImageOptimization(url: string | null): boolean {
  if (!url) {
    return false;
  }

  return isAbsoluteUrl(url);
}
