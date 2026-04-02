import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ReviewForm } from '../app/products/[slug]/ReviewForm';
import type { ReviewTarget } from '../app/products/[slug]/ProductReviews';

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

  it('renders one five-star strip with ten full-width half-step click targets', () => {
    render(
      <ReviewForm sku="PARENT" target={createTarget()} onSubmitted={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /rate 4.5 out of 5/i })
    ).toBeInTheDocument();

    const ratingButtons = screen.getAllByRole('button', {
      name: /rate .* out of 5/i,
    });
    expect(ratingButtons).toHaveLength(10);
    expect(
      ratingButtons.every(button => !button.className.includes('w-'))
    ).toBe(true);

    const ratingControl = ratingButtons[0]?.parentElement?.parentElement;
    expect(ratingControl).not.toBeNull();
    expect((ratingControl as HTMLElement).querySelectorAll('svg').length).toBe(
      10
    );

    fireEvent.click(screen.getByRole('button', { name: /rate 4.5 out of 5/i }));

    expect(screen.getByText('4.5 / 5')).toBeInTheDocument();
  });

  it('opens and closes an image preview dialog for uploaded review images', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 101,
            kind: 'image',
            url: 'https://example.com/uploaded-image.jpg',
            width: 160,
            height: 112,
            mime: 'image/jpeg',
            alt: 'Uploaded review image',
            posterUrl: null,
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ReviewForm sku="PARENT" target={createTarget()} onSubmitted={vi.fn()} />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const image = new File(['image'], 'preview.jpg', { type: 'image/jpeg' });

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [image] },
    });

    const thumbButton = await screen.findByRole('button', {
      name: /preview image preview\.jpg/i,
    });
    await user.click(thumbButton);

    const dialog = screen.getByRole('dialog', { name: /image preview/i });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByAltText('Uploaded review image')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /close image preview/i })
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: /image preview/i })
    ).not.toBeInTheDocument();
  });
});
