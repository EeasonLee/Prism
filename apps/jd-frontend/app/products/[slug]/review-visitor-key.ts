'use client';

const REVIEW_VISITOR_KEY = 'prism_review_visitor_key';

export function getReviewVisitorKey() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(REVIEW_VISITOR_KEY)?.trim();
  if (stored) {
    return stored;
  }

  const nextKey =
    window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(REVIEW_VISITOR_KEY, nextKey);
  return nextKey;
}
