/**
 * Tests for share channel URL builders using TDD approach.
 */

import { describe, it, expect } from 'vitest';
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildPinterestShareUrl,
  buildShareChannelUrl,
  buildSmsShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
} from '@/shared/ui/share';
import type { ShareTarget } from '@/shared/ui/share';

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

describe('buildWhatsAppShareUrl', () => {
  it('should build a WhatsApp share URL with encoded text and URL', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product?id=123',
      title: 'Amazing Product',
      text: 'Check this out',
    };

    const result = buildWhatsAppShareUrl(target);

    expect(result).toContain('https://wa.me/?text=');
    expect(result).toContain('Check%20this%20out');
    expect(result).toContain('https%3A%2F%2Fexample.com%2Fproduct%3Fid%3D123');
  });
});

describe('buildSmsShareUrl', () => {
  it('should build an SMS share URL with encoded body content', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Amazing Product',
      text: 'Take a look',
    };

    const result = buildSmsShareUrl(target);

    expect(result).toContain('sms:?&body=');
    expect(result).toContain('Take%20a%20look');
    expect(result).toContain('https%3A%2F%2Fexample.com%2Fproduct');
  });
});

describe('buildXShareUrl', () => {
  it('should build an X share URL with encoded text and URL', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Amazing Product',
      text: 'Take a look',
    };

    const result = buildXShareUrl(target);

    expect(result).toContain('https://twitter.com/intent/tweet?');
    expect(result).toContain('text=Take%20a%20look');
    expect(result).toContain('url=https%3A%2F%2Fexample.com%2Fproduct');
  });
});

describe('buildPinterestShareUrl', () => {
  it('should build a Pinterest share URL using the target URL and title', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Amazing Product',
      imageUrl: 'https://cdn.example.com/product.jpg',
    };

    const result = buildPinterestShareUrl(target);

    expect(result).toContain('https://pinterest.com/pin/create/button/?');
    expect(result).toContain('url=https%3A%2F%2Fexample.com%2Fproduct');
    expect(result).toContain('description=Amazing%20Product');
    expect(result).toContain(
      'media=https%3A%2F%2Fcdn.example.com%2Fproduct.jpg'
    );
  });
});

describe('buildShareChannelUrl', () => {
  it('should delegate to the correct builder for each supported outbound channel', () => {
    const target: ShareTarget = {
      type: 'product',
      url: 'https://example.com/product',
      title: 'Product',
      text: 'Text',
      imageUrl: 'https://cdn.example.com/product.jpg',
    };

    expect(buildShareChannelUrl('email', target)).toBe(
      buildEmailShareUrl(target)
    );
    expect(buildShareChannelUrl('sms', target)).toBe(buildSmsShareUrl(target));
    expect(buildShareChannelUrl('whatsapp', target)).toBe(
      buildWhatsAppShareUrl(target)
    );
    expect(buildShareChannelUrl('facebook', target)).toBe(
      buildFacebookShareUrl(target)
    );
    expect(buildShareChannelUrl('x', target)).toBe(buildXShareUrl(target));
    expect(buildShareChannelUrl('pinterest', target)).toBe(
      buildPinterestShareUrl(target)
    );
  });
});
