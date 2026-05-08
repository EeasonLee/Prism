'use client';

import { debounce } from '@prism/shared';
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

  // 跳转到文章详情页
  const navigateToArticle = useCallback(
    (item: SuggestionItem) => {
      if (!item.slug) return;

      // 获取文章的第一个分类 slug，如果没有分类则使用 'all'
      const categorySlug = item.categories?.[0]?.slug || 'all';
      const url = `/blog/${categorySlug}/${item.slug}` as Route;
      router.push(url);
      setShowSuggestions(false);
      setKeyword('');
    },
    [router]
  );

  // 处理提交搜索（快速搜索：如果有建议，跳转到第一个建议）
  const handleSubmit = useCallback(() => {
    if (suggestions.length > 0) {
      // 如果有建议，跳转到第一个建议的文章详情页
      navigateToArticle(suggestions[0]);
    }
    // 如果没有建议，不做任何操作（快速搜索模式）
  }, [suggestions, navigateToArticle]);

  // 处理选择建议项（直接跳转到文章详情页）
  const handleSelectSuggestion = useCallback(
    (item: SuggestionItem) => {
      navigateToArticle(item);
    },
    [navigateToArticle]
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
      {/* 搜索输入框：移动端 py-3 text-base，桌面 py-5 text-lg */}
      <div className="group relative">
        <div className="relative flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 focus-within:border-blue-500 focus-within:shadow-xl focus-within:ring-4 focus-within:ring-blue-100 md:rounded-2xl md:border-2">
          {/* 搜索图标 */}
          <div className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center pl-3 pr-1 md:pl-6 md:pr-2">
            <svg
              className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-500 md:h-6 md:w-6"
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
            className="min-h-[44px] flex-1 border-none bg-transparent py-3 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none md:py-5 md:pl-2 md:pr-4 md:text-lg"
          />

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex min-h-[44px] items-center justify-center pr-3 md:pr-4">
              <Loader size="sm" className="text-gray-400" />
            </div>
          )}

          {/* 清除按钮：触控区域 ≥44px */}
          {keyword && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 md:mr-4"
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
        </div>
      </div>

      {/* 搜索建议下拉列表：移动端 max-h-[70vh]，每项 min-h-[44px] */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl md:rounded-2xl">
          <div className="max-h-[70vh] overflow-y-auto md:max-h-96">
            <ul className="divide-y divide-gray-100">
              {suggestions.map((item, _index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex min-h-[44px] w-full items-center text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    onMouseDown={e => {
                      e.preventDefault();
                    }}
                  >
                    <div className="w-full px-4 py-3 md:px-6 md:py-4">
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
          {/* 底部提示：桌面显示，移动端隐藏以节省空间 */}
          <div className="hidden border-t border-gray-100 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 md:block">
            Press{' '}
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono shadow">
              Enter
            </kbd>{' '}
            to open the first result,{' '}
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
          <div className="absolute z-50 mt-3 w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-2xl md:rounded-2xl md:p-8">
            <p className="text-gray-500">No matching results</p>
            <p className="mt-2 text-sm text-gray-400">
              Try different keywords or search directly
            </p>
          </div>
        )}
    </div>
  );
}
