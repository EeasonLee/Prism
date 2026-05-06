'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth';
import type { ProductQaListResult, ProductQuestion } from '@/features/product';
import { guestAuthorLabelFromEmail, isReasonableEmail } from '@prism/shared';

function getDisplayName(user: ReturnType<typeof useAuth>['user']) {
  if (!user) return '';
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.username || user.email;
}

interface ProductQAProps {
  productId: number;
  sku: string;
  initialResult: ProductQaListResult;
  allowSubmit?: boolean;
  pageSize?: number;
}

export function ProductQA({
  productId,
  sku,
  initialResult,
  allowSubmit = true,
  pageSize = 10,
}: ProductQAProps) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const [result, setResult] = useState<ProductQaListResult>(initialResult);
  const [page, setPage] = useState(initialResult.pagination.page);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);

  const pagination = result.pagination;
  const { pageCount } = pagination;

  const loadPage = useCallback(
    async (nextPage: number) => {
      setPageError(null);
      setIsPageLoading(true);
      try {
        const encodedSku = encodeURIComponent(sku);
        const res = await fetch(
          `/api/product-qa/by-sku/${encodedSku}?productId=${productId}&page=${nextPage}&pageSize=${pageSize}`,
          { method: 'GET' }
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? 'Failed to load questions');
        }
        const data = (await res.json()) as ProductQaListResult;
        setResult(data);
        setPage(nextPage);
      } catch (e) {
        setPageError(
          e instanceof Error ? e.message : 'Failed to load questions'
        );
      } finally {
        setIsPageLoading(false);
      }
    },
    [pageSize, productId, sku]
  );

  const validateContent = (text: string) => {
    const t = text.trim();
    if (t.length < 10) {
      return 'Your question must be at least 10 characters.';
    }
    if (t.length > 500) {
      return 'Your question must be 500 characters or fewer.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setClientError(null);
    setSubmitError(null);
    setSuccessMessage(null);

    const err = validateContent(questionText);
    if (err) {
      setClientError(err);
      return;
    }

    const payload: Record<string, unknown> = {
      sku,
      content: questionText.trim(),
    };

    if (isAuthenticated && user) {
      payload.authorName = getDisplayName(user) || user.email;
      payload.authorEmail = user.email;
      payload.magentoUserId = String(user.id);
    } else {
      const email = guestEmail.trim();
      if (!isReasonableEmail(email)) {
        setClientError('Please enter a valid email address.');
        return;
      }
      payload.authorName = guestAuthorLabelFromEmail(email);
      payload.authorEmail = email;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/product-qa/questions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(body.error ?? 'Submission failed');
      }

      setSuccessMessage(
        body.message ?? 'Thank you for your question. We will review it soon.'
      );
      setQuestionText('');
      setGuestEmail('');
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = result.items;
  const answeredItems = useMemo(
    () =>
      items.filter(
        item => item.answerText !== null && item.answerText.trim().length > 0
      ),
    [items]
  );
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (answeredItems.length === 0) {
      setExpandedQuestionId(null);
      return;
    }

    const hasActiveQuestion = answeredItems.some(
      item => item.id === expandedQuestionId
    );
    if (!hasActiveQuestion) {
      setExpandedQuestionId(null);
    }
  }, [answeredItems, expandedQuestionId]);

  const listBody = useMemo(() => {
    if (answeredItems.length === 0) {
      return (
        <p className="body-text text-ink-muted">
          There are no public questions with published answers yet.
        </p>
      );
    }

    return (
      <ul className="border-y border-border">
        {answeredItems.map(item => (
          <li key={item.id} className="border-b border-border last:border-b-0">
            <QaAccordionItem
              item={item}
              isOpen={expandedQuestionId === item.id}
              onToggle={() => {
                setExpandedQuestionId(current =>
                  current === item.id ? null : item.id
                );
              }}
            />
          </li>
        ))}
      </ul>
    );
  }, [answeredItems, expandedQuestionId]);

  return (
    <section className="mt-10" aria-labelledby="product-qa-heading">
      <div className="py-10">
        <h2
          id="product-qa-heading"
          className="heading-3 mb-6 text-center text-ink"
        >
          Questions and answers
        </h2>

        {pageError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {pageError}
          </p>
        )}

        <div
          className={`space-y-4 ${isPageLoading ? 'opacity-60' : ''}`}
          aria-busy={isPageLoading}
        >
          {listBody}
          {isPageLoading && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              Loading questions…
            </p>
          )}
        </div>

        {pageCount > 1 && (
          <nav
            aria-label="Questions pagination"
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(num => {
              const isCurrent = num === page;
              return (
                <button
                  key={num}
                  type="button"
                  aria-label={`Page ${num}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  disabled={isPageLoading}
                  onClick={() => {
                    if (num !== page) void loadPage(num);
                  }}
                  className={`min-h-[44px] min-w-[44px] rounded-full border px-3 text-sm font-medium transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isCurrent
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-card text-ink hover:border-brand hover:text-brand'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </nav>
        )}

        {allowSubmit && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setIsAskModalOpen(true)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90"
            >
              Ask a question
            </button>
          </div>
        )}

        {allowSubmit && isAskModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Ask a question"
            onClick={() => setIsAskModalOpen(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsAskModalOpen(false)}
                aria-label="Close ask a question form"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-5 sm:p-6">
                <h3 className="text-base font-semibold text-ink">
                  Ask a question
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Ask about this product. We typically respond within a few
                  business days. Guests: enter your email only (not shown
                  publicly); your public label uses the part before @ in that
                  address.
                </p>
                {!isAuthenticated && (
                  <p className="mt-2 text-sm text-ink-muted">
                    <button
                      type="button"
                      onClick={() => openLogin('signin')}
                      className="font-medium text-brand underline-offset-2 hover:underline"
                    >
                      Sign in
                    </button>{' '}
                    to use your account details automatically.
                  </p>
                )}

                <form
                  className="mt-4 space-y-4"
                  onSubmit={e => void handleSubmit(e)}
                >
                  <div>
                    <label
                      htmlFor="product-qa-question"
                      className="mb-2 block text-sm font-medium text-ink"
                    >
                      Your question
                    </label>
                    <textarea
                      id="product-qa-question"
                      value={questionText}
                      onChange={e => setQuestionText(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Ask something other customers may want to know…"
                      aria-invalid={!!clientError}
                      aria-describedby={
                        clientError ? 'product-qa-client-error' : undefined
                      }
                    />
                    <p className="mt-1 text-xs text-ink-muted">
                      {questionText.trim().length} / 500 characters (minimum 10)
                    </p>
                    {clientError && (
                      <p
                        id="product-qa-client-error"
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {clientError}
                      </p>
                    )}
                  </div>

                  {!isAuthenticated && (
                    <div>
                      <label
                        htmlFor="product-qa-guest-email"
                        className="mb-2 block text-sm font-medium text-ink"
                      >
                        Email
                      </label>
                      <input
                        id="product-qa-guest-email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  )}

                  {submitError && (
                    <p role="alert" className="text-sm text-destructive">
                      {submitError}
                    </p>
                  )}
                  {successMessage && (
                    <p role="status" className="text-sm text-brand">
                      {successMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden
                        />
                        Submitting…
                      </>
                    ) : (
                      'Submit question'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function QaAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: ProductQuestion;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="bg-background">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <h3 className="text-[clamp(0.95rem,1.4vw,1.45rem)] font-semibold uppercase tracking-wide text-ink">
          {item.questionText}
        </h3>
        {isOpen ? (
          <X className="h-5 w-5 shrink-0 text-ink" aria-hidden />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-ink" aria-hidden />
        )}
      </button>

      {isOpen && item.answerText && (
        <div
          className="prose prose-sm max-w-none pb-5 text-ink-muted [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: item.answerText }}
        />
      )}
    </article>
  );
}
