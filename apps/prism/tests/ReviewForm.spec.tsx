import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReviewForm } from '../app/products/[sku]/ReviewForm';
import type { ReviewTarget } from '../app/products/[sku]/ProductReviews';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock replaces next/image
    <img src={src ?? ''} alt={alt ?? ''} className={className} />
  ),
}));

const openLogin = vi.fn();

vi.mock('../lib/auth/context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'reviewer@example.com',
      username: 'reviewer',
      first_name: 'Test',
      last_name: 'Reviewer',
    },
    accessToken: 'token-123',
    isAuthenticated: true,
  }),
}));

vi.mock('../lib/auth-modal/context', () => ({
  useAuthModal: () => ({
    openLogin,
  }),
}));

function createTarget(partial?: Partial<ReviewTarget>): ReviewTarget {
  return {
    productSku: 'PARENT',
    purchasedSku: 'CHILD',
    purchasedVariantLabel: 'Black / 2 Pack',
    requiresVariantSelection: false,
    ...partial,
  };
}

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    openLogin.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('blocks configurable-product submission until a variant is selected', async () => {
    render(
      <ReviewForm
        sku="PARENT"
        target={createTarget({
          purchasedSku: null,
          purchasedVariantLabel: null,
          requiresVariantSelection: true,
        })}
        onSubmitted={vi.fn()}
      />
    );

    expect(
      screen.getByText(/select a variant before writing a review/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/select a variant before writing a review/i)
      ).toBeInTheDocument();
    });
  });

  it('rejects invalid media combinations before upload', async () => {
    render(
      <ReviewForm sku="PARENT" target={createTarget()} onSubmitted={vi.fn()} />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const firstVideo = new File(['video-1'], 'first.mp4', {
      type: 'video/mp4',
    });
    const secondVideo = new File(['video-2'], 'second.mp4', {
      type: 'video/mp4',
    });

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [firstVideo, secondVideo] },
    });

    expect(
      await screen.findByText(/only 1 video is allowed/i)
    ).toBeInTheDocument();
  });
});
