'use client';

import { Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoShowcaseProps } from '../types';

export function VideoShowcase({ title, videos }: VideoShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const playRequestVersionRef = useRef<number[]>([]);
  const isSingleVideo = videos.length === 1;

  const currentPlayingIndex = hoveredIndex ?? playingIndex;

  const goToNextVideo = useCallback(() => {
    setPlayingIndex(prev => (prev + 1) % videos.length);
  }, [videos.length]);

  const handleVideoEnded = useCallback(() => {
    goToNextVideo();
  }, [goToNextVideo]);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      const shouldPlay = isInView && i === currentPlayingIndex;
      if (shouldPlay) {
        const nextVersion = (playRequestVersionRef.current[i] ?? 0) + 1;
        playRequestVersionRef.current[i] = nextVersion;

        void video.play().catch(error => {
          // play() 被 pause()/src 变化打断时，浏览器会抛 AbortError —— 这是预期竞态，不应当污染控制台
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

  return (
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
          className={`-mx-6 px-6 lg:mx-0 lg:px-0 ${
            isSingleVideo
              ? 'overflow-visible'
              : 'overflow-x-auto scrollbar-hide snap-x snap-mandatory lg:overflow-visible'
          }`}
        >
          <div className="flex w-full gap-4 lg:justify-between lg:gap-6">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className={`group relative ${
                  isSingleVideo
                    ? 'mx-auto w-[70vw] max-w-[320px] flex-none lg:w-full lg:max-w-[420px]'
                    : 'w-[42vw] min-w-[120px] max-w-[180px] flex-1 flex-shrink-0 snap-start lg:min-w-0 lg:max-w-none'
                }`}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setPlayingIndex(index);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black/20 shadow-lg">
                  <video
                    ref={el => {
                      videoRefs.current[index] = el;
                    }}
                    src={isInView ? video.videoUrl : undefined}
                    preload={isInView ? 'metadata' : 'none'}
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                    className="h-full w-full object-cover"
                    aria-label={`Play ${video.title} video`}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity ${
                      currentPlayingIndex === index
                        ? 'opacity-0'
                        : 'opacity-100'
                    }`}
                  >
                    <div className="rounded-full bg-white/40 p-3">
                      <Play className="h-6 w-6 fill-white text-white lg:h-8 lg:w-8" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
