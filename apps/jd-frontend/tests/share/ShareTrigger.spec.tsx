import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareTrigger } from '@/app/_ui/share';
import { ProductDetailContent } from '../../app/products/[slug]/ProductDetailContent';
import type { MagentoProduct } from '../../lib/api/magento/types';
import type { UnifiedProductImage } from '@/features/product';

const copyLinkMock = vi.fn().mockResolvedValue(true);
const shareNativelyMock = vi.fn().mockResolvedValue(true);
let copiedState = false;

vi.mock('../../app/products/[slug]/ProductImageGallery', () => ({
  ProductImageGallery: () => <div data-testid="product-image-gallery" />,
}));

vi.mock('../../app/products/[slug]/ProductDetailClient', () => ({
  ProductDetailClient: () => <div data-testid="product-detail-client" />,
}));

vi.mock('@/app/_ui/share', () => ({
  useShareActions: () => ({
    copied: copiedState,
    nativeShareSupported: true,
    copyLink: async () => {
      const copied = await copyLinkMock();
      copiedState = copied;
      return copied;
    },
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
    copiedState = false;
    copyLinkMock.mockResolvedValue(true);
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

  it('shows layered desktop fallback actions when native share is unavailable', async () => {
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
      screen.getByRole('button', { name: 'Copy product link' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'SMS / iMessage' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'X' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pinterest' })).toBeInTheDocument();
  });

  it('shows copied feedback after the primary fallback action is selected', async () => {
    shareNativelyMock.mockResolvedValueOnce(false);
    const user = userEvent.setup();

    const { rerender } = render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Share' }));
    await user.click(screen.getByRole('button', { name: 'Copy product link' }));

    rerender(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    expect(copyLinkMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copy product link' })
      ).toHaveTextContent('Copied');
    });
  });

  it('falls back to a prompt when clipboard copy fails', async () => {
    shareNativelyMock.mockResolvedValueOnce(false);
    copyLinkMock.mockResolvedValueOnce(false);
    const execCommandSpy = vi.fn().mockReturnValue(false);
    document.execCommand = execCommandSpy;
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);
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
    await user.click(screen.getByRole('button', { name: 'Copy product link' }));

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(promptSpy).toHaveBeenCalledWith(
      'Copy this product link',
      'https://example.com/products/JD-AF550'
    );
  });

  it('uses legacy copy before showing the manual prompt', async () => {
    shareNativelyMock.mockResolvedValueOnce(false);
    copyLinkMock.mockResolvedValueOnce(false);
    const execCommandSpy = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandSpy;
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);
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
    await user.click(screen.getByRole('button', { name: 'Copy product link' }));

    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(promptSpy).not.toHaveBeenCalled();
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
