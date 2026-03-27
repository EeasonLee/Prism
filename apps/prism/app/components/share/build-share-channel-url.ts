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

export function buildWhatsAppShareUrl(target: ShareTarget): string {
  const message = encodeURIComponent(
    `${target.text || target.title} ${target.url}`
  );
  return `https://wa.me/?text=${message}`;
}

export function buildSmsShareUrl(target: ShareTarget): string {
  const body = encodeURIComponent(
    `${target.text || target.title} ${target.url}`
  );
  return `sms:?&body=${body}`;
}

export function buildXShareUrl(target: ShareTarget): string {
  const text = encodeURIComponent(target.text || target.title);
  const url = encodeURIComponent(target.url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

export function buildPinterestShareUrl(target: ShareTarget): string {
  const url = encodeURIComponent(target.url);
  const description = encodeURIComponent(target.title);
  const media = encodeURIComponent(target.imageUrl ?? '');
  return `https://pinterest.com/pin/create/button/?url=${url}&description=${description}&media=${media}`;
}

/**
 * Builds a share URL for the specified channel.
 * @param channel - Share channel
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
    case 'sms':
      return buildSmsShareUrl(target);
    case 'whatsapp':
      return buildWhatsAppShareUrl(target);
    case 'facebook':
      return buildFacebookShareUrl(target);
    case 'x':
      return buildXShareUrl(target);
    case 'pinterest':
      return buildPinterestShareUrl(target);
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}
