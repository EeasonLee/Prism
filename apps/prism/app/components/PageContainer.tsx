import { cn } from '@/lib/utils';
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
    ? 'w-full px-6 lg:px-8'
    : 'mx-auto max-w-7xl px-6 lg:px-8';

  return <div className={cn(baseClasses, className)}>{children}</div>;
}
