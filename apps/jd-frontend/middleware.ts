import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 旧 Joydeem URL 特殊分类 slug 映射（命中 → /categories/{映射值}）
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'kitchen-appliances': 'kitchen-appliances',
  beverage: 'blenders--juicers',
  specialty: 'dough-makers',
  'blenders-juicers-html': 'blenders--juicers',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只处理 .html 结尾的旧 URL
  if (!pathname.endsWith('.html')) return;

  // 提取不含 .html 后缀的路径
  const pathWithoutHtml = pathname.replace(/\.html$/, '').replace(/^\//, '');
  const segments = pathWithoutHtml.split('/');

  // 根层级：先查特殊映射，命中 → /categories/{slug}，否则 → /products/{slug}
  // /kitchen-appliances.html → /categories/kitchen-appliances
  // /joydeem-mini-ceramic-rice-cooker-dfb-c120.html → /products/joydeem-mini-ceramic-rice-cooker-dfb-c120
  if (segments.length === 1) {
    const slug = segments[0];
    const mappedSlug = CATEGORY_SLUG_MAP[slug];
    if (mappedSlug) {
      return NextResponse.redirect(
        new URL(`/categories/${mappedSlug}`, request.url),
        { status: 301 }
      );
    }
    return NextResponse.redirect(new URL(`/products/${slug}`, request.url), {
      status: 301,
    });
  }

  // 有目录层级：/kitchen-appliances/rice-cookers.html → /categories/rice-cookers
  // 取最后一段作为 slug，检查是否有特殊映射
  const lastSegment = segments[segments.length - 1];
  const mappedSlug = CATEGORY_SLUG_MAP[lastSegment] ?? lastSegment;

  return NextResponse.redirect(
    new URL(`/categories/${mappedSlug}`, request.url),
    { status: 301 }
  );
}

export const config = {
  matcher: '/:path*',
};
