/** 当前路径是否属于该站内链接（含子路径）；外链不参与匹配 */
export function isRouteActive(pathname: string, href: string | null): boolean {
  if (!href) return false;
  if (/^https?:\/\//i.test(href) || href.startsWith('//')) return false;
  const path = href.split('?')[0] ?? '';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return pathname === '/' || pathname === '';
  return pathname === normalized || pathname.startsWith(`${normalized}/`);
}
