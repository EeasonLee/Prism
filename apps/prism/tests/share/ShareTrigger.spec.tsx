import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareTrigger } from '../../app/components/share/ShareTrigger';
import { ProductDetailContent } from '../../app/products/[sku]/ProductDetailContent';
import type { MagentoProduct } from '../../lib/api/magento/types';
import type { UnifiedProductImage } from '../../lib/api/unified-product';

const copyLinkMock = vi.fn().mockResolvedValue(undefined);
const shareNativelyMock = vi.fn().mockResolvedValue(true);

vi.mock('../../app/products/[sku]/ProductImageGallery', () => ({
  ProductImageGallery: () => <div data-testid="product-image-gallery" />,
}));

vi.mock('../../app/products/[sku]/ProductDetailClient', () => ({
  ProductDetailClient: () => <div data-testid="product-detail-client" />,
}));

vi.mock('../../app/components/share/useShareActions', () => ({
  useShareActions: () => ({
    copied: false,
    nativeShareSupported: true,
    copyLink: copyLinkMock,
    shareNatively: shareNativelyMock,
    openChannel: vi.fn(),
  }),
}));

const product: MagentoProduct = {
  id: 1,
  sku: 'JD-AF550',
  name: 'Joydeem Air Fryer',
  display_name: 'Joydeem Air Fryer',
  price: 199.99,
  type_id: 'simple',
  is_in_stock: true,
};

const galleryImages: UnifiedProductImage[] = [
  {
    url: 'https://cdn.example.com/air-fryer.jpg',
    alt: 'Joydeem Air Fryer',
  },
];

describe('ShareTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an accessible Share trigger', () => {
    render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('uses native share first when supported', async () => {
    const user = userEvent.setup();

    render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(shareNativelyMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Copy link' })
    ).not.toBeInTheDocument();
  });

  it('shows desktop fallback actions when native share is unavailable', async () => {
    shareNativelyMock.mockResolvedValueOnce(false);
    const user = userEvent.setup();

    render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Share' }));

    expect(
      screen.getByRole('button', { name: 'Copy link' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument();
  });

  it('copies the link when the fallback copy action is selected', async () => {
    shareNativelyMock.mockResolvedValueOnce(false);
    const user = userEvent.setup();

    render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Share' }));
    await user.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(copyLinkMock).toHaveBeenCalledTimes(1);
  });

  it('renders a Share action inside product detail content when a share target is provided', () => {
    render(
      <ProductDetailContent
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={80}
        ratingCount={24}
        selection={{
          selectedVariant: null,
          allSelected: false,
        }}
        onSelectionChange={vi.fn()}
        shareTarget={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });
});
