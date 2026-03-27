import type { ShareTarget } from './types';

/**
 * Builds a mailto URL for email sharing.
 * Encodes the title as subject and includes title + description + URL in the body.
 *
 * @param target - The normalized share target
 * @returns A fully encoded mailto URL
 */
export function buildEmailShareUrl(target: ShareTarget): string {
  const subject = encodeURIComponent(target.title);
  const body = encodeURIComponent(
    `${target.title}\n\n${target.description}\n\n${target.url}`
  );

  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Builds a Facebook share URL.
 * Uses the Facebook sharer dialog with the target URL.
 *
 * @param target - The normalized share target
 * @returns A fully encoded Facebook share URL
 */
export function buildFacebookShareUrl(target: ShareTarget): string {
  const encodedUrl = encodeURIComponent(target.url);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}
