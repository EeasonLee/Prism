'use client';

import { Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 竖屏 9:16 转换参数 */
const CLOUDINARY_9_16 =
  'c_crop,ar_9:16,w_720,h_1280,c_fill/c_limit,h_1280,w_720';

/** Mock 数据：每个视频独立 src，后续替换为 Strapi/CMS 真实链接 */
const MOCK_VIDEOS = [
  {
    id: '1',
    src: `https://res.cloudinary.com/benovel/video/upload/f_webm,vc_vp9/q_auto/${CLOUDINARY_9_16}/v1717581791/665f9ec849567e000893626f/videos/beysdczkxtpzdff3o9xd.webm`,
    title: 'Lemon Salmon',
  },
  {
    id: '2',
    src: `https://res.cloudinary.com/benovel/video/upload/f_webm,vc_vp9/q_auto/if_w_gt_h_mul_9_div_16/c_limit,w_w,ar_9:16/b_blurred:2000:-10,c_pad,h_w_div_9_mul_16,w_w/if_end/if_h_gt_w_mul_16_div_9/c_crop,ar_9:16,w_1.0/if_end/c_limit,h_640,w_480/e_accelerate:25/du_5/ac_none/v1717581785/665f9ec849567e000893626f/videos/kc5uzcjuukqihnfg7xhk.webm`,
    title: 'Daily Veggies',
  },
  {
    id: '3',
    src: `https://res.cloudinary.com/benovel/video/upload/f_webm,vc_vp9/q_auto/if_w_gt_h_mul_9_div_16/c_limit,w_w,ar_9:16/b_blurred:2000:-10,c_pad,h_w_div_9_mul_16,w_w/if_end/if_h_gt_w_mul_16_div_9/c_crop,ar_9:16,w_1.0/if_end/c_limit,h_640,w_480/e_accelerate:25/du_5/ac_none/v1717581782/665f9ec849567e000893626f/videos/hqcdpa9gyayvcrbvhgsc.webm`,
    title: 'Chicken Shawarma',
  },
  {
    id: '4',
    src: `https://res.cloudinary.com/benovel/video/upload/f_webm,vc_vp9/q_auto/if_w_gt_h_mul_9_div_16/c_limit,w_w,ar_9:16/b_blurred:2000:-10,c_pad,h_w_div_9_mul_16,w_w/if_end/if_h_gt_w_mul_16_div_9/c_crop,ar_9:16,w_1.0/if_end/c_limit,h_640,w_480/e_accelerate:25/du_5/ac_none/v1717581778/665f9ec849567e000893626f/videos/rmtprjvy1xazmaaitldh.webm`,
    title: 'Air Fryer Chicken',
  },
  {
    id: '5',
    src: `https://res.cloudinary.com/benovel/video/upload/f_webm,vc_vp9/q_auto/if_w_gt_h_mul_9_div_16/c_limit,w_w,ar_9:16/b_blurred:2000:-10,c_pad,h_w_div_9_mul_16,w_w/if_end/if_h_gt_w_mul_16_div_9/c_crop,ar_9:16,w_1.0/if_end/c_limit,h_640,w_480/e_accelerate:25/du_5/ac_none/v1717581778/665f9ec849567e000893626f/videos/vkityzsxhsx3sichrzsu.webm`,
    title: 'Stuffed Peppers',
  },
];

export function HomeVideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // 当前应播放的索引：hover 时切换到 hovered，失焦后保持当前播放直到结束
  const currentPlayingIndex = hoveredIndex ?? playingIndex;

  const goToNextVideo = useCallback(() => {
    setPlayingIndex(prev => (prev + 1) % MOCK_VIDEOS.length);
  }, []);

  const handleVideoEnded = useCallback(() => {
    goToNextVideo();
  }, [goToNextVideo]);

  // 控制视频播放/暂停
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

  // Intersection Observer：进入视口才加载/播放，减少首屏开销
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
            Happy Kitchens Across the Globe
          </h2>
        </div>

        {/* 横向滚动容器，移动端可滑动，大屏占满内容区 */}
        <div className="-mx-6 overflow-x-auto px-6 scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-full gap-4 lg:justify-between lg:gap-6">
            {MOCK_VIDEOS.map((video, index) => (
              <div
                key={video.id}
                className="group relative w-[42vw] min-w-[120px] max-w-[180px] flex-1 flex-shrink-0 snap-start lg:min-w-0 lg:max-w-none"
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setPlayingIndex(index); // 同步，失焦后继续播当前视频
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black/20 shadow-lg">
                  <video
                    ref={el => {
                      videoRefs.current[index] = el;
                    }}
                    src={isInView ? video.src : undefined}
                    preload={isInView ? 'metadata' : 'none'}
                    muted
                    playsInline
                    onEnded={handleVideoEnded}
                    className="h-full w-full object-cover"
                    aria-label={`Play ${video.title} video`}
                  />
                  {/* 播放图标装饰（仅非播放态显示） */}
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
