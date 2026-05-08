'use client';

import { useState } from 'react';
import type { HtmlSection } from './parse-html-sections';

interface ExpandableHtmlSectionsProps {
  sections: HtmlSection[];
  ariaLabel: string;
}

export function ExpandableHtmlSections({
  sections,
  ariaLabel,
}: ExpandableHtmlSectionsProps) {
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

  if (sections.length === 0) return null;

  return (
    <section aria-label={ariaLabel} className="mt-6 border-t border-border">
      {sections.map((section, index) => {
        const isExpanded = expandedIndexes.includes(index);

        return (
          <article
            key={`${section.title}-${index}`}
            className="border-b border-border"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              onClick={() =>
                setExpandedIndexes(prev =>
                  prev.includes(index)
                    ? prev.filter(item => item !== index)
                    : [...prev, index]
                )
              }
              aria-expanded={isExpanded}
            >
              <span className="text-2xl font-semibold text-ink">
                {section.title}
              </span>
              <svg
                className={`h-6 w-6 shrink-0 text-ink transition-transform ${
                  isExpanded ? 'rotate-45' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>

            {isExpanded && (
              <div className="pb-5">
                <div
                  className="prose prose-sm max-w-none text-ink-muted [&_a]:text-ink [&_a]:underline hover:[&_a]:text-brand [&_strong]:font-semibold [&_strong]:text-ink"
                  dangerouslySetInnerHTML={{ __html: section.contentHtml }}
                />
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
