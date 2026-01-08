import { cn } from '@prism/shared';
import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean; // 是否全宽（不限制最大宽度）
}

export function PageContainer({
  children,
  className = '',
  fullWidth = false,
}: PageContainerProps) {
  const baseClasses = fullWidth
    ? 'w-full px-4 sm:px-6 lg:px-[50px]'
    : 'mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-[50px]';

  return <div className={cn(baseClasses, className)}>{children}</div>;
}
