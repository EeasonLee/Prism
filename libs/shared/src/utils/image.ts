/**
 * 图片 URL 处理工具
 *
 * 统一入口：resolveImageUrl() —— 处理商品图、评论图、CMS 页面图、Strapi 内容图、外部 URL。
 *
 * 纯函数，零环境依赖。baseUrl / domainRewriteMap 由调用方显式传入。
 *
 * CDN 路径结构：
 * - 商品图：  ${baseUrl}/media/{size}/catalog/product/${subPath}
 * - 评论图：  ${baseUrl}/media/{size}/amasty/review/${subPath}
 * - 页面图：  ${baseUrl}/media/{size}/pages/${subPath}
 */

// ─── 尺寸常量 ──────────────────────────────────────────────────────────────────

const CDN_IMAGE_SIZES = [80, 100, 150, 350, 800] as const;

export type ProductImageSize = (typeof CDN_IMAGE_SIZES)[number];

const CDN_IMAGE_SIZE_SET = new Set<number>(CDN_IMAGE_SIZES);
const MAX_CDN_IMAGE_SIZE = 800;

// ─── 类型 ──────────────────────────────────────────────────────────────────────

/** Strapi 图片格式 URL */
export interface StrapiImageFormats {
  small?: { url: string; width?: number; height?: number };
  medium?: { url: string; width?: number; height?: number };
  large?: { url: string; width?: number; height?: number };
  thumbnail?: { url: string; width?: number; height?: number };
}

/** Strapi 图片对象（完整版，兼容 Strapi v4/v5） */
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

/** StrapiImage 的宽松版本——resolveImageUrl 只要求 url 和可选的 formats */
export interface StrapiImageLike {
  url?: string | null;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: {
    large?: { url?: string | null } | null;
    medium?: { url?: string | null } | null;
    small?: { url?: string | null } | null;
    thumbnail?: { url?: string | null } | null;
  } | null;
}

// ─── CDN 子目录枚举 ────────────────────────────────────────────────────────────

/** CDN 图片子目录，对应不同的媒体类型 */
export type ImageCdnSubPath = 'catalog/product' | 'amasty/review' | 'pages';

// ─── resolveImageUrl 选项 ──────────────────────────────────────────────────────

export interface ResolveImageUrlOptions {
  /**
   * CDN 图片尺寸：80 / 100 / 150 / 350 / 800
   * - 未传入时保持原尺寸（若 URL 已有尺寸）或原始路径
   * - 超出 800 时取最接近的合法尺寸
   */
  size?: number;
  /**
   * Strapi 图片格式偏好（仅 source 是 StrapiImage/StrapiImageLike 对象时生效）
   * - 'original' 使用原图 url
   * - 指定格式不存在时回退：large → medium → small → original
   */
  format?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  /**
   * CDN 子目录，仅在 URL 路径无法自动识别类型时需要显式指定
   * - URL 中含有 /catalog/product/ 时自动识别为商品图，无需指定
   * - 评论图 /pages/ 等需要显式传入
   */
  subPath?: ImageCdnSubPath;
  /**
   * CDN 基础 URL（不含 /media 后缀）
   * 不传时：对绝对 URL 保持原样，对相对路径直接返回相对路径
   */
  baseUrl?: string;
  /**
   * 域名重写映射，键为匹配正则（如 'joydeem.com'），值为替换后的 base URL
   * 用于将历史域名重写到 CDN
   */
  domainRewriteMap?: Record<string, string>;
}

// ─── 内部：URL 解析工具 ────────────────────────────────────────────────────────

function extractPathname(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }
  return trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
}

function extractExistingSize(pathname: string): number | null {
  const normalizedPath = pathname.replace(/\/{2,}/g, '/');
  const match = normalizedPath.match(/\/media\/(\d+)\/[^/]+\/.+/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCdnSize(preferredSize?: number): number | null {
  if (preferredSize === undefined || preferredSize === null) return null;
  if (!Number.isFinite(preferredSize) || preferredSize <= 0) return null;
  if (preferredSize > MAX_CDN_IMAGE_SIZE) return null;

  if (CDN_IMAGE_SIZE_SET.has(preferredSize)) return preferredSize;

  let nearest: ProductImageSize = CDN_IMAGE_SIZES[0];
  let minDelta = Math.abs(preferredSize - nearest);
  for (const size of CDN_IMAGE_SIZES) {
    const delta = Math.abs(preferredSize - size);
    if (delta < minDelta) {
      nearest = size;
      minDelta = delta;
    }
  }
  return nearest;
}

/** 规范化 CDN base URL：剥离 /media 后缀，去除末尾斜杠 */
function normalizeBaseUrl(rawBaseUrl: string): string {
  const trimmed = rawBaseUrl.replace(/\/+$/, '');
  const withoutMediaPages = trimmed.replace(/\/media\/pages(?:\/.*)?$/i, '');
  const normalized =
    withoutMediaPages.replace(/\/media$/i, '') || withoutMediaPages || trimmed;
  return normalized;
}

/** 判断是否为私有/本地地址（开发环境 Strapi） */
function isPrivateImageHost(url: string): boolean {
  return (
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url.startsWith('http://192.168') ||
    url.startsWith('http://10.') ||
    url.startsWith('http://172.')
  );
}

// ─── 内部：从绝对 URL 提取 base 和路径信息 ───────────────────────────────────

interface ParsedAbsoluteUrl {
  baseUrl: string;
  pathname: string;
  existingSize: number | null;
  detectedSubPath: ImageCdnSubPath | null;
  fileSubPath: string | null;
}

function parseAbsoluteUrl(url: string): ParsedAbsoluteUrl | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    const origin = `${parsed.protocol}//${parsed.host}`;

    const pathInfo = detectPathInfo(pathname);
    return {
      baseUrl: normalizeBaseUrl(origin),
      pathname,
      existingSize: extractExistingSize(pathname),
      detectedSubPath: pathInfo?.subPath ?? null,
      fileSubPath: pathInfo?.fileSubPath ?? null,
    };
  } catch {
    return null;
  }
}

interface PathInfo {
  subPath: ImageCdnSubPath;
  fileSubPath: string;
}

function detectPathInfo(pathname: string): PathInfo | null {
  const normalizedPath = pathname.replace(/\/{2,}/g, '/');

  // 商品图 /catalog/product/...
  let match = normalizedPath.match(
    /\/media\/(?:\d+\/)?catalog\/product\/(?:cache\/[^/]+\/)?(.+)/i
  );
  if (match) {
    return {
      subPath: 'catalog/product',
      fileSubPath: match[1].replace(/^\/+/, ''),
    };
  }

  // 评论图 /amasty/review/...
  match = normalizedPath.match(/\/media\/(?:\d+\/)?amasty\/review\/(.+)/i);
  if (match) {
    return {
      subPath: 'amasty/review',
      fileSubPath: match[1].replace(/^\/+/, ''),
    };
  }

  // 页面图 /pages/...
  match = normalizedPath.match(/\/media\/(?:\d+\/)?pages\/(.+)/i);
  if (match) {
    return { subPath: 'pages', fileSubPath: match[1].replace(/^\/+/, '') };
  }

  return null;
}

// ─── 内部：构建 CDN URL ────────────────────────────────────────────────────────

/** CDN 支持格式转换的位图扩展名 */
const WEBP_CONVERTIBLE = /\.(jpe?g|png|tiff?|bmp)(\?.*)?$/i;

/** 已是现代格式或不宜转换的扩展名 */
const WEBP_SKIP = /\.(webp|avif|svg|gif)(\?.*)?$/i;

/** 对位图文件追加 .webp 后缀，利用 CDN 格式转换 */
function appendWebp(filename: string): string {
  if (WEBP_SKIP.test(filename)) return filename;
  if (WEBP_CONVERTIBLE.test(filename)) return `${filename}.webp`;
  return filename;
}

function buildCdnUrl(
  subPath: ImageCdnSubPath,
  fileSubPath: string,
  baseUrl: string,
  size?: number
): string {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const resolvedSize = normalizeCdnSize(size);
  const normalizedFile = fileSubPath.replace(/^\/+/, '');
  const webpFile = appendWebp(normalizedFile);

  // 只有显式传入合法 size 时才插入 /media/{size}/ 层级
  if (resolvedSize !== null) {
    return `${normalizedBase}/media/${resolvedSize}/${subPath}/${webpFile}`;
  }
  return `${normalizedBase}/media/${subPath}/${webpFile}`;
}

// ─── 内部：应用域名重写 ────────────────────────────────────────────────────────

function applyDomainRewrite(
  url: string,
  rewriteMap?: Record<string, string>
): string | null {
  if (!rewriteMap) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, '');
    const hostWithWww = `www.${host}`;

    // 精确匹配优先，再试不带 www 的匹配
    for (const [pattern, target] of Object.entries(rewriteMap)) {
      const normalizedPattern = pattern.replace(/^www\./, '');
      if (
        host === normalizedPattern ||
        hostWithWww === `www.${normalizedPattern}`
      ) {
        return `${target}${parsed.pathname}`;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

// ─── 内部：处理相对路径 ────────────────────────────────────────────────────────

function resolveRelativePath(
  rawUrl: string,
  options?: ResolveImageUrlOptions
): string | null {
  const pathname = extractPathname(rawUrl);
  if (!pathname) return null;

  // Next.js 本地静态资源（public 目录），不走 CDN
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return pathname;
  }

  const pathInfo = detectPathInfo(pathname);
  const effectiveSubPath = options?.subPath ?? pathInfo?.subPath;
  const fileSubPath = pathInfo?.fileSubPath ?? pathname.replace(/^\/+/, '');

  if (effectiveSubPath && options?.baseUrl) {
    return buildCdnUrl(
      effectiveSubPath,
      fileSubPath,
      options.baseUrl,
      options?.size
    );
  }

  if (effectiveSubPath && !options?.baseUrl) {
    // 有 CDN 路径信息但没有 baseUrl，返回规范化相对路径
    const normalizedFile = fileSubPath.replace(/^\/+/, '');
    const resolvedSize = normalizeCdnSize(options?.size);
    if (resolvedSize !== null) {
      return `/media/${resolvedSize}/${effectiveSubPath}/${normalizedFile}`;
    }
    return `/media/${effectiveSubPath}/${normalizedFile}`;
  }

  // 未知路径类型
  if (options?.baseUrl) {
    const normalizedBaseUrl = options.baseUrl.replace(/\/+$/, '');
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  // 无 baseUrl，返回原始相对路径
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

// ─── 内部：处理完整 URL ───────────────────────────────────────────────────────

function resolveAbsoluteUrl(
  url: string,
  options?: ResolveImageUrlOptions
): string | null {
  const trimmed = url.trim();
  const parsed = parseAbsoluteUrl(trimmed);

  if (!parsed) return trimmed;

  // 域名重写：使用 domainRewriteMap
  const rewritten = applyDomainRewrite(trimmed, options?.domainRewriteMap);
  if (rewritten) {
    // 重写后重新解析
    const rewrittenParsed = parseAbsoluteUrl(rewritten);
    if (rewrittenParsed?.detectedSubPath && rewrittenParsed.fileSubPath) {
      const effectiveSubPath =
        options?.subPath ?? rewrittenParsed.detectedSubPath;
      return buildCdnUrl(
        effectiveSubPath,
        rewrittenParsed.fileSubPath,
        options?.baseUrl ?? rewrittenParsed.baseUrl,
        options?.size ??
          normalizeCdnSize(rewrittenParsed.existingSize ?? undefined) ??
          undefined
      );
    }
    return rewritten;
  }

  // 有 CDN 路径信息，重构 URL
  const effectiveSubPath = options?.subPath ?? parsed.detectedSubPath;
  if (effectiveSubPath && parsed.fileSubPath) {
    const resolvedSize =
      normalizeCdnSize(options?.size) ??
      normalizeCdnSize(parsed.existingSize ?? undefined);
    const finalBase = options?.baseUrl
      ? normalizeBaseUrl(options.baseUrl)
      : parsed.baseUrl;
    return buildCdnUrl(
      effectiveSubPath,
      parsed.fileSubPath,
      finalBase,
      resolvedSize ?? undefined
    );
  }

  // 无需重构，原样返回
  return trimmed;
}

// ─── 内部：从对象提取 URL 字符串 ──────────────────────────────────────────────

function extractUrlFromImage(
  image: StrapiImageLike | StrapiImage,
  preferredFormat?: ResolveImageUrlOptions['format']
): string | null {
  let url: string | undefined;

  if (preferredFormat === 'original') {
    url = image.url ?? undefined;
  } else if (preferredFormat && image.formats?.[preferredFormat]) {
    const fmt = image.formats[preferredFormat];
    url = fmt?.url ?? undefined;
  }

  if (!url) {
    // 回退：large → medium → small → original
    url =
      image.formats?.large?.url ??
      image.formats?.medium?.url ??
      image.formats?.small?.url ??
      image.formats?.thumbnail?.url ??
      image.url ??
      undefined;
  }

  return url || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 公开 API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 统一的图片 URL 处理入口
 *
 * 纯函数，零环境依赖。baseUrl 和 domainRewriteMap 由调用方显式传入。
 *
 * 输入可以是：
 * - URL 字符串（完整/相对）
 * - StrapiImage / StrapiImageLike 对象
 * - null / undefined
 *
 * 自动处理：
 * - 商品图 → CDN /media/{size}/catalog/product/{path}
 * - 评论图 → CDN /media/{size}/amasty/review/{path}（需传 subPath）
 * - 页面图 → CDN /media/{size}/pages/{path}
 * - 域名重写 → 通过 domainRewriteMap 配置
 * - 相对路径 → 拼接 baseUrl（若提供）
 * - StrapiImage 对象 → 自动按 format 提取 URL
 * - 外部域名 → 原样返回
 *
 * @example
 * // 商品图 + 尺寸
 * resolveImageUrl('/media/catalog/product/j/d/jd-123.jpg', { size: 350, baseUrl: 'https://cdn.example.com' })
 *
 * // Strapi 图片对象
 * resolveImageUrl(article.featuredImage, { format: 'large' })
 *
 * // 评论图
 * resolveImageUrl('/uploads/review.jpg', { subPath: 'amasty/review', size: 800, baseUrl: 'https://cdn.example.com' })
 */
export function resolveImageUrl(
  source: string | StrapiImage | StrapiImageLike | null | undefined,
  options?: ResolveImageUrlOptions
): string | null {
  if (!source) return null;

  if (typeof source === 'object') {
    const rawUrl = extractUrlFromImage(source, options?.format);
    if (!rawUrl) return null;
    return resolveRawUrl(rawUrl, options);
  }

  return resolveRawUrl(source, options);
}

function resolveRawUrl(
  rawUrl: string,
  options?: ResolveImageUrlOptions
): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return resolveAbsoluteUrl(trimmed, options);
  }

  return resolveRelativePath(trimmed, options);
}

/**
 * 根据显示宽度自动选择最优 CDN 尺寸
 * 按 retina 屏计算所需像素，选最接近的 CDN 尺寸
 *
 * 阈值规则：maxDisplayWidth ≤ 800 → 匹配 CDN 尺寸；> 800 → 返回 null 使用原图（全屏 banner）
 *
 * @example
 * getOptimalCdnSize(350)  // 卡片宽 350px → 350*2=700 → CDN 800
 * getOptimalCdnSize(80)   // 缩略图 80px → 80*2=160 → CDN 150
 * getOptimalCdnSize(48)   // 图标 48px → 48*2=96 → CDN 100
 * getOptimalCdnSize(1080) // 1080 > 800 → null（全屏 banner，使用原图）
 */
export function getOptimalCdnSize(
  maxDisplayWidth: number,
  pixelRatio = 2
): ProductImageSize | null {
  // 超过 CDN 最大尺寸 → 原图
  if (maxDisplayWidth > MAX_CDN_IMAGE_SIZE) return null;

  const requiredPx = maxDisplayWidth * pixelRatio;

  // 从小到大遍历 CDN 尺寸，找到第一个大于等于所需像素的
  for (const size of CDN_IMAGE_SIZES) {
    if (size >= requiredPx) return size;
  }

  // 所需超过 CDN 最大值，返回最大值
  return MAX_CDN_IMAGE_SIZE;
}

/** StrapiImage 对象 URL 提取，内部使用。外部优先用 resolveImageUrl() */
export function extractImageUrl(
  image: StrapiImage | null | undefined,
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original'
): string | null {
  if (!image) return null;
  return extractUrlFromImage(image, preferredFormat);
}

/**
 * 判断图片是否需要禁用优化（用于 Next.js Image 组件的 unoptimized 属性）
 * - 外部 CDN 域名 → true（CDN 已做优化）
 * - 本地地址（localhost / 127.0.0.1 / 192.168.x.x）→ false（走 Next.js 优化）
 */
export function shouldDisableImageOptimization(url: string | null): boolean {
  if (!url) return false;
  return !isPrivateImageHost(url);
}
