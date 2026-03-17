'use client';

import { useEffect, useRef, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

interface ProductSectionNavProps {
  sections: Section[];
}

export function ProductSectionNav({ sections }: ProductSectionNavProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 出现时机：主 hero 区域滚出视窗后显示
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const showObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    showObserver.observe(sentinel);
    return () => showObserver.disconnect();
  }, []);

  // 高亮当前 section
  useEffect(() => {
    const targets = sections
      .map(s => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // 找到最靠近顶部且正在可见的 section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      // rootMargin: 顶部留出 header + nav 高度，底部截取 50% 让高亮更早触发
      { rootMargin: '-100px 0px -50% 0px', threshold: 0 }
    );

    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // 考虑 header(73px) + section nav(45px) 的高度偏移
    const offset = 73 + 45 + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <>
      {/* 哨兵元素：放在 hero 底部，滚出视窗后显示 nav */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      <nav
        aria-label="Product sections"
        className={`sticky top-[73px] z-20 -mx-4 border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300 sm:-mx-6 lg:-mx-[50px] ${
          visible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-2 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex overflow-x-auto px-4 sm:px-6 lg:px-[50px] [&::-webkit-scrollbar]:hidden">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition ${
                activeId === section.id
                  ? 'text-brand after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-brand'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
