import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { BlogPost } from './mock-data';

interface BlogSectionProps {
  posts: BlogPost[];
}

export function BlogSection({ posts }: BlogSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="blog-heading" className="py-12 lg:py-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 id="blog-heading" className="heading-3 text-ink">
          From the Blog
        </h2>
        <Link
          href="/blog"
          className="text-sm font-medium text-brand hover:underline"
        >
          View all articles
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <article
            key={post.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-brand/30 hover:shadow-md"
          >
            {/* 图片 */}
            <div className="relative aspect-[16/9] overflow-hidden bg-surface">
              <Image
                src={post.image}
                alt={post.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition group-hover:scale-105"
              />
            </div>

            {/* 内容 */}
            <div className="flex flex-1 flex-col p-5">
              {/* 日期 + 阅读时间 */}
              <div className="mb-3 flex items-center gap-3 text-xs text-ink-muted">
                <span>{post.date}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
              </div>

              <h3 className="mb-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-brand">
                {post.title}
              </h3>

              <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                {post.excerpt}
              </p>

              <Link
                href={post.href}
                className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand hover:gap-2 transition-all"
                aria-label={`Read more about ${post.title}`}
              >
                Read more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
