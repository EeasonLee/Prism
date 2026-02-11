'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@prism/shared';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Side from which the sheet slides in. Default 'right'. */
  side?: 'left' | 'right';
  /** Optional title for the sheet header (e.g. "Filters"). */
  title?: string;
  /** Optional className for the content wrapper. */
  className?: string;
}

/**
 * Sheet (drawer) component: overlay + sliding panel.
 * Locks body scroll when open. Closes on Escape or overlay click.
 */
export function Sheet({
  open,
  onOpenChange,
  children,
  side = 'right',
  title,
  className,
}: SheetProps): React.JSX.Element | null {
  const [entered, setEntered] = React.useState(false);
  const handleOverlayClick = () => onOpenChange(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false);
  };

  React.useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const slideIn =
    side === 'right'
      ? entered
        ? 'translate-x-0'
        : 'translate-x-full'
      : entered
      ? 'translate-x-0'
      : '-translate-x-full';
  const panelPosition =
    side === 'right' ? 'inset-y-0 right-0' : 'inset-y-0 left-0';

  const content = (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Panel'}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        data-state={open ? 'open' : 'closed'}
        onClick={handleOverlayClick}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed w-full max-w-sm bg-white shadow-xl transition-transform duration-200 ease-out',
          'flex flex-col',
          panelPosition,
          slideIn
        )}
        data-state={open ? 'open' : 'closed'}
        onClick={e => e.stopPropagation()}
      >
        {title != null && title !== '' && (
          <div className="flex min-h-[44px] items-center justify-between border-b border-gray-200 px-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              aria-label="Close"
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
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto', className)}>
          {children}
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  return createPortal(content, document.body);
}
