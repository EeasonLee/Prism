/**
 * Tests for share channel URL builders using TDD approach.
 */

import { describe, it, expect } from 'vitest';
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildShareChannelUrl,
} from '../../app/components/share/build-share-channel-url';
import type { ShareTarget } from '../../app/components/share/types';

describe('buildEmailShareUrl', () => {
  it('should build a mailto URL with encoded subject and body', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Amazing Product',
      text: 'Check out this great product',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('mailto:?');
    expect(result).toContain('subject=');
    expect(result).toContain('body=');
  });

  it('should URL-encode the subject line', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product & Special Offer!',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('subject=Product%20%26%20Special%20Offer');
    expect(result).toContain('&body=');
  });

  it('should URL-encode the body with text and URL', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product?id=123',
      title: 'Product Title',
      text: 'Product description with spaces',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('body=');
    expect(result).toContain('Product%20description%20with%20spaces');
    expect(result).toContain('https%3A%2F%2Fexample.com%2Fproduct%3Fid%3D123');
  });

  it('should use title as fallback when text is missing', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product Title',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('body=');
    expect(result).toContain('Product%20Title');
  });

  it('should handle special characters in title', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product "Quote" & Ampersand',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('subject=');
    expect(result).not.toContain('"');
  });

  it('should handle URLs with query parameters', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product?sku=ABC123&ref=email',
      title: 'Product',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('%3F');
    expect(result).toContain('%3D');
  });
});

describe('buildFacebookShareUrl', () => {
  it('should build a Facebook share URL', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain('https://www.facebook.com/sharer/sharer.php?u=');
  });

  it('should URL-encode the target URL', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product?id=123&name=test',
      title: 'Product',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain(
      'u=https%3A%2F%2Fexample.com%2Fproduct%3Fid%3D123%26name%3Dtest'
    );
  });

  it('should handle URLs with special characters', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product?title=Hello World&desc=Test & Demo',
      title: 'Product',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).not.toContain(' ');
    expect(result).not.toContain('&desc=');
  });

  it('should handle URLs with fragments', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product#section-1',
      title: 'Product',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain('%23');
  });

  it('should ignore title and text', () => {
    const target1: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Title 1',
      text: 'Text 1',
    };

    const target2: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Title 2',
      text: 'Text 2',
    };

    const result1 = buildFacebookShareUrl(target1);
    const result2 = buildFacebookShareUrl(target2);

    expect(result1).toBe(result2);
  });
});

describe('buildShareChannelUrl', () => {
  it('should delegate to buildEmailShareUrl for email channel', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product',
      text: 'Text',
    };

    const result = buildShareChannelUrl('email', target);
    const expected = buildEmailShareUrl(target);

    expect(result).toBe(expected);
  });

  it('should delegate to buildFacebookShareUrl for facebook channel', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product',
      text: 'Text',
    };

    const result = buildShareChannelUrl('facebook', target);
    const expected = buildFacebookShareUrl(target);

    expect(result).toBe(expected);
  });

  it('should handle multiple channels independently', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product',
    };

    const emailUrl = buildShareChannelUrl('email', target);
    const facebookUrl = buildShareChannelUrl('facebook', target);

    expect(emailUrl).toContain('mailto:');
    expect(facebookUrl).toContain('facebook.com');
    expect(emailUrl).not.toBe(facebookUrl);
  });
});
