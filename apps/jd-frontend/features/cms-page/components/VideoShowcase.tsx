'use client';

import { Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoItem, VideoShowcaseProps } from '../types';
import { VideoShowcaseModal } from './VideoShowcaseModal';

export function VideoShowcase({ title, videos }: VideoShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const playRequestVersionRef = useRef<number[]>([]);
  const isSingleVideo = videos.length === 1;
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null);

  // 控制哪些视频需要设置 src（进入预加载范围后才加载）
  // 没有 thumbnail 的视频直接加载，用浏览器首帧作为封面
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    videos.forEach((v, i) => {
      if (!v.thumbnail?.url) initial.add(i);
    });
    return initial;
  });

  const currentPlayingIndex = hoveredIndex ?? playingIndex;

  const goToNextVideo = useCallback(() => {
    setPlayingIndex(prev => (prev + 1) % videos.length);
  }, [videos.length]);

  const handleVideoEnded = useCallback(() => {
    goToNextVideo();
  }, [goToNextVideo]);

  // 播放控制（基于 section 可见性 + 当前播放目标）
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      const shouldPlay = isInView && i === currentPlayingIndex && !modalVideo;
      if (shouldPlay) {
        const nextVersion = (playRequestVersionRef.current[i] ?? 0) + 1;
        playRequestVersionRef.current[i] = nextVersion;

        void video.play().catch(error => {
          if (playRequestVersionRef.current[i] !== nextVersion) return;
          if (error instanceof DOMException && error.name === 'AbortError')
            return;
          console.error('Video playback failed:', error);
        });
      } else {
        playRequestVersionRef.current[i] =
          (playRequestVersionRef.current[i] ?? 0) + 1;
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentPlayingIndex, isInView]);

  // Section 级别可见性检测（控制播放）
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry?.isIntersecting ?? false);
      },
      { threshold: 0.2, rootMargin: '50px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Per-video 级别可见性检测（控制 src 加载，rootMargin 提前预加载）
  useEffect(() => {
    const elements = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        setLoadedIndices(prev => {
          const next = new Set(prev);
          let changed = false;
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = videoRefs.current.indexOf(
                entry.target as HTMLVideoElement
              );
              if (idx >= 0 && !next.has(idx)) {
                next.add(idx);
                changed = true;
              }
            }
          }
          return changed ? next : prev;
        });
      },
      { rootMargin: '200px' }
    );

    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [videos.length]);

  return (
    <>
      <section
        ref={sectionRef}
        aria-labelledby="video-showcase-title"
        className="relative w-full overflow-hidden bg-white py-12 lg:py-20"
      >
        <div className="w-full px-6 lg:px-[8vw]">
          <div className="mb-8">
            <h2
              id="video-showcase-title"
              className="heading-2 text-center text-ink"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {title}
            </h2>
          </div>

          <div
            className={`-my-3 py-3 ${
              isSingleVideo
                ? 'overflow-visible'
                : 'overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:overflow-visible'
            }`}
          >
            <div className="flex w-full gap-4 lg:justify-between lg:gap-6">
              {videos.map((video, index) => {
                const shouldLoad = loadedIndices.has(index);
                const isPlaying = isInView && currentPlayingIndex === index;

                return (
                  <div
                    key={video.id}
                    className={`group relative cursor-pointer ${
                      isSingleVideo
                        ? 'mx-auto w-[70vw] max-w-[320px] flex-none lg:w-full lg:max-w-[420px]'
                        : 'w-[42vw] min-w-[120px] max-w-[180px] flex-1 flex-shrink-0 snap-start lg:min-w-0 lg:max-w-none'
                    }`}
                    onMouseEnter={() => {
                      setHoveredIndex(index);
                      setPlayingIndex(index);
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setModalVideo(video)}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black/20 shadow-md">
                      <video
                        ref={el => {
                          videoRefs.current[index] = el;
                        }}
                        src={shouldLoad ? video.videoUrl : undefined}
                        poster={video.thumbnail?.url}
                        preload={shouldLoad ? 'metadata' : 'none'}
                        muted
                        playsInline
                        onEnded={handleVideoEnded}
                        className="h-full w-full object-cover"
                        aria-label={`Play ${video.title} video`}
                      />
                      {/* 播放按钮叠加层：视频未真正播放时始终显示 */}
                      <div
                        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                          isPlaying ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <div className="rounded-full bg-white/40 p-3">
                          <Play className="h-6 w-6 fill-white text-white lg:h-8 lg:w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {modalVideo && (
        <VideoShowcaseModal
          video={modalVideo}
          open={modalVideo !== null}
          onClose={() => setModalVideo(null)}
        />
      )}
    </>
  );
}
