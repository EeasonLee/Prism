'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaginationInfo } from '../types';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
}

const pageSizeOptions = [12, 24, 48];

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: PaginationProps) {
  const { page, pageCount, total, pageSize } = pagination;

  // 计算要显示的页码
  const getPageNumbers = () => {
    const delta = 2; // 当前页前后显示的页码数
    const range: (number | string)[] = [];

    // 计算起始和结束页码
    let start = Math.max(2, page - delta);
    let end = Math.min(pageCount - 1, page + delta);

    // 如果当前页接近开头，调整结束页码
    if (page - delta <= 2) {
      end = Math.min(5, pageCount - 1);
    }

    // 如果当前页接近结尾，调整起始页码
    if (page + delta >= pageCount - 1) {
      start = Math.max(pageCount - 4, 2);
    }

    // 添加第一页
    range.push(1);

    // 添加省略号（如果起始页不是2）
    if (start > 2) {
      range.push('...');
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // 添加省略号（如果结束页不是倒数第二页）
    if (end < pageCount - 1) {
      range.push('...');
    }

    // 添加最后一页（如果总页数大于1）
    if (pageCount > 1) {
      range.push(pageCount);
    }

    return range;
  };

  const pageNumbers = getPageNumbers();

  const handlePageSizeChange = (value: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(value));
    }
  };

  return (
    <div className="border-t border-gray-200 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        {/* 左侧：显示总数 */}
        <div className="text-sm text-gray-600 sm:mr-auto">
          Showing{' '}
          <span className="font-medium text-gray-900">
            {(page - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium text-gray-900">
            {Math.min(page * pageSize, total)}
          </span>{' '}
          of <span className="font-medium text-gray-900">{total}</span> recipes
        </div>

        {/* 右侧：页面大小选择器和分页按钮组 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="page-size-select"
                className="text-sm text-gray-600"
              >
                Show:
              </label>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
                disabled={isLoading}
              >
                <SelectTrigger id="page-size-select" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(option => (
                    <SelectItem key={option} value={String(option)}>
                      {option} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {pageCount > 1 && (
            <nav aria-label="分页导航" className="flex items-center gap-1">
              {/* 第一页按钮 */}
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1 || isLoading}
                aria-label="第一页"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* 上一页按钮 */}
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || isLoading}
                aria-label="上一页"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* 页码按钮 */}
              <div className="hidden items-center gap-1 sm:flex">
                {pageNumbers.map((pageNum, index) => {
                  if (pageNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex h-10 w-10 items-center justify-center px-2 text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNumber = pageNum as number;
                  const isCurrentPage = pageNumber === page;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      disabled={isLoading}
                      aria-label={`第 ${pageNumber} 页`}
                      aria-current={isCurrentPage ? 'page' : undefined}
                      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-md border px-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                        isCurrentPage
                          ? 'z-10 border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* 移动端显示当前页 */}
              <div className="flex items-center gap-1 sm:hidden">
                <span className="relative inline-flex h-9 w-auto min-w-[60px] items-center justify-center rounded-md border border-orange-500 bg-orange-50 px-3 text-sm font-medium text-orange-600">
                  {page} / {pageCount}
                </span>
              </div>

              {/* 下一页按钮 */}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === pageCount || isLoading}
                aria-label="下一页"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* 最后一页按钮 */}
              <button
                onClick={() => onPageChange(pageCount)}
                disabled={page === pageCount || isLoading}
                aria-label="最后一页"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
