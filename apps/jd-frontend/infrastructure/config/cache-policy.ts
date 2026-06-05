export const REVALIDATE_SECONDS_STATIC_PAGE = 3600;
export const REVALIDATE_SECONDS_DYNAMIC_PAGE = 60;
export const REVALIDATE_SECONDS_REALTIME = 0;

export function cacheTagPage(slug: string): string {
  return `page:${slug}`;
}
