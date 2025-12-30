'use client';

import { debounce } from '@prism/shared';
import { Button } from '@prism/ui/components/button';
import { Loader } from '@prism/ui/components/loader';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchArticles } from '../api/queries';
import type { ArticleListItem } from '../api/types';

type SuggestionItem = ArticleListItem;

interface ArticleSearchBoxProps {
  /** 默认搜索关键词 */
  defaultValue?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 搜索建议数量 */
  suggestionLimit?: number;
  /** 自定义样式类名 */
  className?: string;
}

export function ArticleSearchBox({
  defaultValue = '',
  placeholder = 'Search articles, keywords...',
  suggestionLimit = 8,
  className = '',
}: ArticleSearchBoxProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖搜索建议
  const debouncedSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (!q.trim()) {
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          const res = await searchArticles({
            q: q.trim(),
            page: 1,
            pageSize: suggestionLimit,
            signal: controller.signal,
          });
          if (!controller.signal.aborted) {
            setSuggestions(res.data);
            setShowSuggestions(true);
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Search suggestions failed:', err);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      }, 350),
    [suggestionLimit]
  );

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setKeyword(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 跳转到搜索结果页
  const navigateToResults = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      // 使用 /blog/all 作为 category，添加类型断言以支持 Next.js typedRoutes
      const url = `/blog/all?q=${encodeURIComponent(trimmed)}` as Route;
      router.push(url);
    },
    [router]
  );

  // 处理提交搜索
  const handleSubmit = useCallback(() => {
    navigateToResults(keyword);
    setShowSuggestions(false);
  }, [keyword, navigateToResults]);

  // 处理选择建议项
  const handleSelectSuggestion = useCallback(
    (item: SuggestionItem) => {
      // 提取纯文本标题（去除 HTML 标签）
      const cleanTitle = item.title.replace(/<[^>]+>/g, '').trim();
      navigateToResults(cleanTitle);
      setShowSuggestions(false);
    },
    [navigateToResults]
  );

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 渲染高亮文本（将 <mark> 标签转换为高亮样式）
  const renderHighlightedText = (html: string) => {
    // 使用 dangerouslySetInnerHTML 渲染，但确保样式正确
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: html.replace(
            /<mark>/g,
            '<mark class="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded">'
          ),
        }}
      />
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 搜索输入框 */}
      <div className="group relative">
        <div className="relative flex items-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-xl focus-within:ring-4 focus-within:ring-blue-100">
          {/* 搜索图标 */}
          <div className="flex items-center justify-center pl-6 pr-2">
            <svg
              className="h-6 w-6 text-gray-400 transition-colors group-focus-within:text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* 输入框 */}
          <input
            type="text"
            value={keyword}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent py-5 pl-2 pr-4 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex items-center justify-center pr-4">
              <Loader size="sm" className="text-gray-400" />
            </div>
          )}

          {/* 清除按钮 */}
          {keyword && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="mr-2 flex items-center justify-center rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* 搜索按钮 */}
          <div className="pr-2">
            <Button
              onClick={handleSubmit}
              disabled={!keyword.trim()}
              className="rounded-xl px-6 py-2.5 font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* 搜索建议下拉列表 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              {suggestions.map((item, _index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    onMouseDown={e => {
                      // 阻止 blur 事件，确保点击时不会关闭下拉
                      e.preventDefault();
                    }}
                  >
                    <div className="px-6 py-4">
                      {/* 标题 */}
                      <div className="mb-1.5 font-semibold text-gray-900">
                        {renderHighlightedText(item.title)}
                      </div>
                      {/* 摘要 */}
                      {item.excerpt && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {renderHighlightedText(item.excerpt)}
                        </p>
                      )}
                      {/* 元信息 */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        {item.categories && item.categories.length > 0 && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            {item.categories[0].name}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span>
                            {new Date(item.publishedAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* 底部提示 */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
            Press{' '}
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow">
              Enter
            </kbd>{' '}
            to search,{' '}
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow">
              Esc
            </kbd>{' '}
            to close
          </div>
        </div>
      )}

      {/* 无结果提示 */}
      {showSuggestions &&
        !isLoading &&
        suggestions.length === 0 &&
        keyword.trim() && (
          <div className="absolute z-50 mt-3 w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl">
            <p className="text-gray-500">No matching results</p>
            <p className="mt-2 text-sm text-gray-400">
              Try different keywords or search directly
            </p>
          </div>
        )}
    </div>
  );
}
