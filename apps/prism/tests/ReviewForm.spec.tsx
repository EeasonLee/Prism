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
    sku: 'PARENT',
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

  it('allows configurable-product submission without selecting a variant', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/reviews/tags')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          message: 'submitted',
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSubmitted = vi.fn();

    render(
      <ReviewForm
        sku="PARENT"
        target={createTarget({
          requiresVariantSelection: true,
        })}
        onSubmitted={onSubmitted}
      />
    );

    expect(
      screen.queryByText(/select a variant before writing a review/i)
    ).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText('Title');
    await userEvent.type(titleInput, 'Great product');

    const contentTextarea = screen.getByLabelText('Review');
    await userEvent.type(
      contentTextarea,
      'Works well and exceeded my expectations. I would buy again.'
    );

    const submitButton = screen.getByRole('button', { name: /submit review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [, options] = fetchMock.mock.calls[1] as [
      string,
      { method: string; headers: Record<string, string>; body: string }
    ];
    const payload = JSON.parse(options.body) as Record<string, unknown>;

    expect(payload).not.toHaveProperty('productSku');
    expect(payload).not.toHaveProperty('purchasedSku');
    expect(payload).not.toHaveProperty('purchasedVariantLabel');

    await waitFor(() => {
      expect(onSubmitted).toHaveBeenCalled();
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

  it('opens uploaded video media and closes the viewer with escape', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/reviews/tags')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 101,
              kind: 'video',
              url: 'https://example.com/uploaded-video.webm',
              width: null,
              height: null,
              mime: 'video/webm',
              alt: 'Uploaded review video',
              posterUrl: null,
            },
          ],
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ReviewForm sku="PARENT" target={createTarget()} onSubmitted={vi.fn()} />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const video = new File(['video'], 'preview.webm', { type: 'video/webm' });

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [video] },
    });

    const thumbButton = await screen.findByRole('button', {
      name: /preview media preview\.webm/i,
    });
    await user.click(thumbButton);

    const dialog = screen.getByRole('dialog', {
      name: /media viewer video preview/i,
    });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText('Uploaded review video')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /close media viewer/i })
    ).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: /media viewer/i })
    ).not.toBeInTheDocument();
  });
});
