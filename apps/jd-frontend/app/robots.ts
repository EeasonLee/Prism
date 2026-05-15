import type { MetadataRoute } from 'next';
import { env } from '@/infrastructure/config/env';

/** 规范化站点根 URL（无末尾斜杠），用于 robots / sitemap 绝对地址 */
const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

/** 全站不应对爬虫公开的路径（与站点路由对齐；参考常见电商 robots 模板） */
const PUBLIC_DISALLOWS = [
  '/api/',
  '/_next/',
  '/login',
  '/search',
  '/cart',
  '/checkout',
  '/user/',
  '/account/',
  '/admin/',
  '/forgot-password',
  '/reset-password',
] as const;

/** 允许抓取但限制节奏的大模型 / 归档类 UA（Crawl-delay 仅部分爬虫会遵守） */
const AI_AND_ARCHIVE_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'MistralAI-User',
  'Novellum',
  'ProRataInc',
  'Timpibot',
  'archive.org_bot',
  'CCBot',
] as const;

/** 整站禁止的第三方 SEO / 采集类爬虫 UA（与参考站点一致） */
const BLOCKED_SEO_USER_AGENTS = [
  'AhrefsBot',
  'SEMrushBot',
  'SemrushBot-SA',
  'Majestic SEO',
  'SISTRIX Crawler',
  'seoscanners.net',
  'BuiltWith',
  'Sitebulb',
  'RavenCrawler',
  'deepcrawl',
  'SEOkicks',
  'SEOkicks-Robot',
  'Searchmetrics',
  'magpie-crawler',
  'NinjaBot',
  'adscanner',
  'AwarioBot',
  'BLEXBot',
  'WBSearchBot',
  'Yeti',
  'DotBot',
  'Linespider',
  'MJ12bot',
  'ICC-Crawler',
  'SeznamBot',
  'naver',
  'Daum Bot',
  'Baiduspider',
  'Sogou web spider',
  '360Spider',
  'HaosouSpider',
  'YisouSpider',
] as const;

function buildRules(): MetadataRoute.Robots['rules'] {
  return [
    {
      userAgent: '*',
      allow: '/',
      disallow: [...PUBLIC_DISALLOWS],
    },
    ...AI_AND_ARCHIVE_USER_AGENTS.map(name => ({
      userAgent: name,
      allow: '/',
      crawlDelay: 5,
    })),
    ...BLOCKED_SEO_USER_AGENTS.map(name => ({
      userAgent: name,
      disallow: '/',
    })),
    { userAgent: 'Googlebot', allow: '/' },
    { userAgent: 'Bingbot', allow: '/' },
    { userAgent: 'PetalBot', allow: '/' },
  ];
}

/**
 * 当前仅存在单一元数据路由 `/sitemap.xml`（app/sitemap.ts 汇总全部 URL）。
 * 若日后拆分为多文件 sitemap，将 `sitemap` 改为 string[] 并逐项列出即可。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: buildRules(),
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
