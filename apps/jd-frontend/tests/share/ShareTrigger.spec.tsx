import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareTrigger } from '@/app/_ui/share';
import { ProductDetailContent } from '../../app/products/[slug]/ProductDetailContent';
import type { MagentoProduct } from '../../lib/api/magento/types';
import type { UnifiedProductImage } from '@/features/product';

const shareNativelyMock = vi.fn().mockResolvedValue(true);
const copyLinkMock = vi.fn().mockResolvedValue(true);
let copiedState = false;
let isTouchDevice = false;

vi.mock('../../app/_ui/share/useShareActions', () => ({
  useShareActions: () => ({
    copied: copiedState,
    nativeShareSupported: true,
    isTouchDevice,
    copyLink: async () => {
      const copied = await copyLinkMock();
      copiedState = copied;
      return copied;
    },
    shareNatively: shareNativelyMock,
    openChannel: vi.fn(),
  }),
}));

vi.mock('../../app/products/[slug]/ProductImageGallery', () => ({
  ProductImageGallery: () => <div data-testid="product-image-gallery" />,
}));

vi.mock('../../app/products/[slug]/ProductDetailClient', () => ({
  ProductDetailClient: () => <div data-testid="product-detail-client" />,
}));

vi.mock('@/features/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return {
    ...actual,
    useAuth: () => ({ isAuthenticated: false, user: null }),
    useAuthModal: () => ({ openAuthModal: vi.fn() }),
  };
});

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
  describe('desktop (non-touch)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      copiedState = false;
      isTouchDevice = false;
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

    it('shows ShareMenu with channel links on click', async () => {
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

      // 桌面端不应调用原生分享，直接显示弹窗
      expect(shareNativelyMock).not.toHaveBeenCalled();
      expect(
        screen.getByRole('menuitem', { name: 'Copy product link' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Facebook' })
      ).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'X' })).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Pinterest' })
      ).toBeInTheDocument();
    });

    it('shows copied feedback after copy button is clicked', async () => {
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
      await user.click(
        screen.getByRole('menuitem', { name: 'Copy product link' })
      );

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
          screen.getByRole('menuitem', { name: 'Copy product link' })
        ).toHaveTextContent('Copied');
      });
    });

    it('falls back to a prompt when clipboard copy fails', async () => {
      copyLinkMock.mockResolvedValueOnce(false);
      const execCommandSpy = vi.fn().mockReturnValue(false);
      document.execCommand = execCommandSpy;
      const promptSpy = vi
        .spyOn(window, 'prompt')
        .mockImplementation(() => null);
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
      await user.click(
        screen.getByRole('menuitem', { name: 'Copy product link' })
      );

      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(promptSpy).toHaveBeenCalledWith(
        'Copy this product link',
        'https://example.com/products/JD-AF550'
      );
    });

    it('uses legacy copy before showing the manual prompt', async () => {
      copyLinkMock.mockResolvedValueOnce(false);
      const execCommandSpy = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandSpy;
      const promptSpy = vi
        .spyOn(window, 'prompt')
        .mockImplementation(() => null);
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
      await user.click(
        screen.getByRole('menuitem', { name: 'Copy product link' })
      );

      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(promptSpy).not.toHaveBeenCalled();
    });
  });

  describe('mobile (touch device)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      copiedState = false;
      isTouchDevice = true;
      shareNativelyMock.mockResolvedValue(true);
    });

    it('uses native share on touch device', async () => {
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
      // 不显示弹窗
      expect(
        screen.queryByRole('menuitem', { name: 'Copy product link' })
      ).not.toBeInTheDocument();
    });
  });

  describe('ProductDetailContent integration', () => {
    it('renders a Share action inside product detail content when a share target is provided', () => {
      isTouchDevice = false;
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
});
