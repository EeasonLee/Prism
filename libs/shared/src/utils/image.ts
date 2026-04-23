/**
 * 获取环境变量（避免循环依赖）
 */
function getEnv(key: string): string | undefined {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    // 客户端：从 process.env 获取（Next.js 会在构建时注入）
    return process.env[key];
  }
  // 服务端：从 process.env 获取
  return process.env[key];
}

function isDevelopment(): boolean {
  return process.env['NODE_ENV'] === 'development';
}

function getDefaultImageBaseUrl(): string {
  return isDevelopment()
    ? 'http://localhost:1337'
    : 'https://d2s2mafqv46idp.cloudfront.net/joydeem';
}

const JOYDEEM_PRODUCT_IMAGE_BASE_URL =
  'https://d2s2mafqv46idp.cloudfront.net/joydeem';

function getImageBaseUrl(): string {
  return getEnv('NEXT_PUBLIC_IMAGE_BASE_URL') || getDefaultImageBaseUrl();
}

function isPrivateImageHost(url: string): boolean {
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://192.168') ||
    url.startsWith('http://10.') ||
    url.startsWith('http://172.')
  );
}

/**
 * Strapi 图片格式类型
 */
export interface StrapiImageFormats {
  small?: { url: string };
  medium?: { url: string };
  large?: { url: string };
  thumbnail?: { url: string };
}

/**
 * Strapi 图片对象类型
 */
export interface StrapiImage {
  id?: number;
  documentId?: string;
  name?: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number;
  height?: number;
  formats?: StrapiImageFormats;
  hash?: string;
  ext?: string;
  mime?: string;
  size?: number;
  url: string;
  previewUrl?: string | null;
  provider?: string;
  provider_metadata?: unknown | null;
  folderPath?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  locale?: string | null;
}

const PRODUCT_IMAGE_SIZES = [80, 100, 150, 350, 600, 800] as const;

export type ProductImageSize = (typeof PRODUCT_IMAGE_SIZES)[number];

const PRODUCT_IMAGE_SIZE_SET = new Set<number>(PRODUCT_IMAGE_SIZES);

const MAX_PRODUCT_IMAGE_SIZE: ProductImageSize = 800;
const DEFAULT_PRODUCT_IMAGE_SIZE: ProductImageSize = 80;

function extractExistingProductImageSize(pathname: string): number | null {
  const normalizedPath = pathname.replace(/\/{2,}/g, '/');
  const match = normalizedPath.match(/\/media\/(\d+)\/catalog\/product\/.+/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractProductMediaSubPath(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/{2,}/g, '/');
  const patterns = [
    /\/media\/catalog\/product\/cache\/[^/]+\/(.+)/i,
    /\/media\/(\d+)\/catalog\/product\/(.+)/i,
    /\/media\/catalog\/product\/(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedPath.match(pattern);
    if (!match) continue;

    const subPath = (match[2] ?? match[1] ?? '').replace(/^\/+/, '');
    if (subPath) {
      return subPath;
    }
  }

  return null;
}

function normalizeProductImageSize(
  preferredSize?: number
): ProductImageSize | null {
  if (preferredSize === undefined || preferredSize === null) {
    return null;
  }

  if (!Number.isFinite(preferredSize) || preferredSize <= 0) {
    return null;
  }

  if (preferredSize > MAX_PRODUCT_IMAGE_SIZE) {
    return null;
  }

  if (PRODUCT_IMAGE_SIZE_SET.has(preferredSize)) {
    return preferredSize as ProductImageSize;
  }

  let nearest: ProductImageSize = PRODUCT_IMAGE_SIZES[0];
  let minDelta = Math.abs(preferredSize - nearest);
  for (const size of PRODUCT_IMAGE_SIZES) {
    const delta = Math.abs(preferredSize - size);
    if (delta < minDelta) {
      nearest = size;
      minDelta = delta;
    }
  }
  return nearest;
}

function normalizeProductImageBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const withoutPagesSegment = trimmed.replace(/\/media\/pages(?:\/.*)?$/i, '');
  const normalized = withoutPagesSegment || trimmed;

  // 统一将 Joydeem 商品图指向 CloudFront，避免回落到源站域名。
  if (/^https?:\/\/(?:www\.)?joydeem\.com(?:\/|$)/i.test(normalized)) {
    return JOYDEEM_PRODUCT_IMAGE_BASE_URL;
  }

  return normalized;
}

/**
 * 规范化 Joydeem 商品图 URL：
 * - 自动识别并移除 Magento cache 路径段
 * - 输出到 CloudFront joydeem 根路径
 * - 支持 80/100/150/350/600/800 尺寸目录（仅显式传入时）
 * - 请求尺寸 > 800 时，回退到默认尺寸目录（80）
 */
export function processProductImageUrl(
  url: string | null | undefined,
  preferredSize?: number
): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
  }

  const subPath = extractProductMediaSubPath(pathname);
  if (!subPath) return null;

  const normalizedBaseUrl = normalizeProductImageBaseUrl(getImageBaseUrl());
  const normalizedSubPath = subPath.replace(/^\/+/, '');
  const existingSize = extractExistingProductImageSize(pathname);
  const targetSize = normalizeProductImageSize(preferredSize);

  if (targetSize === null) {
    const normalizedExistingSize = normalizeProductImageSize(
      existingSize ?? undefined
    );
    if (normalizedExistingSize !== null) {
      return `${normalizedBaseUrl}/media/${normalizedExistingSize}/catalog/product/${normalizedSubPath}`;
    }
    return `${normalizedBaseUrl}/media/${DEFAULT_PRODUCT_IMAGE_SIZE}/catalog/product/${normalizedSubPath}`;
  }

  return `${normalizedBaseUrl}/media/${targetSize}/catalog/product/${normalizedSubPath}`;
}

/**
 * 处理图片 URL
 * - 完整路径（http:// 或 https:// 开头）：直接返回
 * - 相对路径：根据环境变量拼接前缀
 *   - 开发环境：http://localhost:1337（可通过 NEXT_PUBLIC_IMAGE_BASE_URL 覆盖）
 *   - 生产环境：https://d2s2mafqv46idp.cloudfront.net/joydeem（可通过 NEXT_PUBLIC_IMAGE_BASE_URL 覆盖）
 */
export function processImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalizedProductImageUrl = processProductImageUrl(url);
  if (normalizedProductImageUrl) {
    return normalizedProductImageUrl;
  }

  // 完整路径，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 相对路径，根据环境变量拼接前缀
  const baseUrl = getImageBaseUrl();

  // 确保 baseUrl 不以 / 结尾（除了根路径）
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '') || baseUrl;

  // 确保路径以 / 开头
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedBaseUrl}${path}`;
}

/**
 * 从 Strapi 图片对象中提取 URL
 * 优先使用指定格式；original 表示直接用原图；若指定格式不存在则回退：large -> medium -> small -> original
 */
export function extractImageUrl(
  image: StrapiImage | null | undefined,
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original'
): string | null {
  if (!image) return null;

  let url: string | undefined;

  if (preferredFormat === 'original') {
    url = image.url;
  } else if (preferredFormat && image.formats?.[preferredFormat]) {
    url = image.formats[preferredFormat].url;
  }
  if (!url) {
    // 指定格式不存在或未指定时，按优先级回退
    url =
      image.formats?.large?.url ||
      image.formats?.medium?.url ||
      image.formats?.small?.url ||
      image.url;
  }

  return url || null;
}

/**
 * 判断图片是否需要禁用优化（用于 Next.js Image 组件的 unoptimized 属性）
 */
export function shouldDisableImageOptimization(url: string | null): boolean {
  if (!url) return false;

  return !isPrivateImageHost(url);
}
