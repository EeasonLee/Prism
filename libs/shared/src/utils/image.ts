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

/**
 * 处理图片 URL
 * - 完整路径（http:// 或 https:// 开头）：直接返回
 * - 相对路径：根据环境变量拼接前缀
 *   - 开发环境：http://localhost:1337（可通过 NEXT_PUBLIC_IMAGE_BASE_URL 覆盖）
 *   - 生产环境：https://d2s2mafqv46idp.cloudfront.net/joydeem/media/pages（可通过 NEXT_PUBLIC_IMAGE_BASE_URL 覆盖）
 */
export function processImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // 完整路径，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 相对路径，根据环境拼接前缀
  // 优先使用环境变量，否则使用默认值
  const imageBaseUrl = getEnv('NEXT_PUBLIC_IMAGE_BASE_URL');
  const baseUrl = imageBaseUrl
    ? imageBaseUrl
    : isDevelopment()
    ? 'http://localhost:1337'
    : 'https://d2s2mafqv46idp.cloudfront.net/joydeem/media/pages';

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
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://192.168') ||
    url.startsWith('http://10.') ||
    url.startsWith('http://172.')
  );
}
