'use client';

import { Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoShowcaseProps } from '@/lib/api/cms-page.types';

export function VideoShowcase({ title, videos }: VideoShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

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
        void video.play().catch(error => {
          console.error('Video playback failed:', error);
        });
      } else {
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

        <div className="-mx-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-full gap-4 lg:justify-between lg:gap-6">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="group relative w-[42vw] min-w-[120px] max-w-[180px] flex-1 flex-shrink-0 snap-start lg:min-w-0 lg:max-w-none"
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
