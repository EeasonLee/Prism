/**
 * Pure functions to build share URLs for different channels.
 * No browser globals, fully URL-encoded output.
 */

import type { ShareTarget, ShareChannel } from './types';

/**
 * Builds a mailto URL with encoded subject and body from a normalized share target.
 * @param target - Normalized share target with url, title, and optional text
 * @returns Fully URL-encoded mailto URL
 */
export function buildEmailShareUrl(target: ShareTarget): string {
  const subject = encodeURIComponent(target.title);
  const body = encodeURIComponent(
    `${target.text || target.title}\n\n${target.url}`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Builds a Facebook share URL from the normalized target URL.
 * @param target - Normalized share target with url
 * @returns Fully URL-encoded Facebook share URL
 */
export function buildFacebookShareUrl(target: ShareTarget): string {
  const encodedUrl = encodeURIComponent(target.url);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}

/**
 * Builds a share URL for the specified channel.
 * @param channel - Share channel ('email' or 'facebook')
 * @param target - Normalized share target
 * @returns Fully URL-encoded share URL for the channel
 */
export function buildShareChannelUrl(
  channel: ShareChannel,
  target: ShareTarget
): string {
  switch (channel) {
    case 'email':
      return buildEmailShareUrl(target);
    case 'facebook':
      return buildFacebookShareUrl(target);
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}
