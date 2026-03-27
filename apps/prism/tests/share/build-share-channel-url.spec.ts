import { describe, it, expect } from 'vitest';
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
} from '../../app/components/share/build-share-channel-url';
import type { ShareTarget } from '../../app/components/share/types';

describe('buildEmailShareUrl', () => {
  it('should build a mailto URL with encoded subject and body', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/123',
      title: 'Amazing Product',
      description: 'Check out this amazing product!',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('mailto:');
    expect(result).toContain('subject=');
    expect(result).toContain('body=');
    expect(result).toContain(encodeURIComponent('Amazing Product'));
    expect(result).toContain(
      encodeURIComponent('https://example.com/product/123')
    );
  });

  it('should handle special characters in title and description', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/456',
      title: 'Product & Special "Chars"',
      description: 'Description with & and "quotes"',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain('mailto:');
    expect(result).toContain(encodeURIComponent('Product & Special "Chars"'));
  });

  it('should include URL in the email body', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/789?param=value',
      title: 'Test Product',
      description: 'Test Description',
    };

    const result = buildEmailShareUrl(target);

    expect(result).toContain(
      encodeURIComponent('https://example.com/product/789?param=value')
    );
  });
});

describe('buildFacebookShareUrl', () => {
  it('should build a Facebook share URL from normalized target URL', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/123',
      title: 'Amazing Product',
      description: 'Check out this amazing product!',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain('https://www.facebook.com/sharer/sharer.php');
    expect(result).toContain('u=');
    expect(result).toContain(
      encodeURIComponent('https://example.com/product/123')
    );
  });

  it('should handle URLs with query parameters', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/456?ref=home&utm_source=test',
      title: 'Product with Params',
      description: 'Description',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain('https://www.facebook.com/sharer/sharer.php');
    expect(result).toContain(
      encodeURIComponent(
        'https://example.com/product/456?ref=home&utm_source=test'
      )
    );
  });

  it('should handle special characters in URL', () => {
    const target: ShareTarget = {
      url: 'https://example.com/product/special-chars-&-more',
      title: 'Special Product',
      description: 'Description',
    };

    const result = buildFacebookShareUrl(target);

    expect(result).toContain('https://www.facebook.com/sharer/sharer.php');
    expect(result).toContain('u=');
  });
});
