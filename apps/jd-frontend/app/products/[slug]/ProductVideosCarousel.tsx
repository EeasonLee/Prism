'use client';

import { OptimizedImage } from '@prism/ui';
import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@prism/shared';
import type { ProductVideoCard } from '@/features/product';

interface ProductVideosCarouselProps {
  videos: ProductVideoCard[];
  className?: string;
}

/** 可用 <video src> 直链播放的地址；平台页则仅用封面 + 跳转 */
function isDirectVideoSource(url: string): boolean {
  const lower = url.trim().toLowerCase();
  if (
    /youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|facebook\.com\/watch/i.test(
      lower
    )
  ) {
    return false;
  }
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(lower)) {
    return true;
  }
  // Strapi /uploads/ 下常见为视频且无图片扩展名
  if (/\/uploads\//i.test(lower)) {
    if (/\.(jpe?g|png|gif|webp|svg|avif)(\?|#|$)/i.test(lower)) {
      return false;
    }
    return true;
  }
  return false;
}

interface HoverVideoCardProps {
  video: ProductVideoCard;
}

function HoverVideoCard({ video }: HoverVideoCardProps) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);

  const isDirect = isDirectVideoSource(video.videoUrl);
  const poster = video.thumbnailUrl.trim() || undefined;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !isDirect) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false);
      },
      { threshold: 0.15, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDirect]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isDirect) return;
    if (!inView) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    if (hovering) {
      void v.play().catch(() => {
        // 自动播放策略或资源失败时静默失败，保留封面
      });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovering, inView, isDirect, video.videoUrl]);

  const showPlayDecoration = !isDirect || !mediaPlaying || !hovering;

  return (
    <a
      ref={wrapRef}
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-black/20 shadow-sm transition hover:border-brand/30 hover:shadow-md"
      aria-label={`Play video: ${video.title}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={e => {
        const next = e.relatedTarget;
        if (next instanceof Node && e.currentTarget.contains(next)) return;
        setHovering(false);
      }}
    >
      <div className="relative aspect-[9/16] w-full">
        {isDirect ? (
          <video
            ref={videoRef}
            src={inView ? video.videoUrl : undefined}
            poster={poster}
            preload={inView ? 'metadata' : 'none'}
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover"
            onPlay={() => setMediaPlaying(true)}
            onPause={() => setMediaPlaying(false)}
            onEnded={() => setMediaPlaying(false)}
            aria-label={video.title}
          />
        ) : video.thumbnailUrl ? (
          <OptimizedImage
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 42vw, 220px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-muted" aria-hidden />
        )}

        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200',
            showPlayDecoration ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        >
          <span className="rounded-full bg-white/40 p-3 shadow-sm ring-1 ring-white/30">
            <Play className="h-6 w-6 fill-white text-white" aria-hidden />
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent px-3 pb-3 pt-10">
          <p className="line-clamp-3 text-left text-xs font-medium leading-snug text-white">
            {video.caption}
          </p>
        </div>
      </div>
    </a>
  );
}

export function ProductVideosCarousel({
  videos,
  className,
}: ProductVideosCarouselProps) {
  if (videos.length === 0) return null;

  return (
    <div className={cn(className)}>
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5"
        aria-label="Product videos"
      >
        {videos.map(v => (
          <HoverVideoCard key={v.id} video={v} />
        ))}
      </div>
    </div>
  );
}
