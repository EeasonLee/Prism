import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShareActions } from '../../app/components/share/useShareActions';

describe('useShareActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('copies the target URL and marks copied state', async () => {
    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        },
      })
    );

    await act(async () => {
      await result.current.copyLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/products/JD-AF550'
    );
    expect(result.current.copied).toBe(true);
  });

  it('uses native share when supported', async () => {
    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
          text: 'Check this out',
        },
      })
    );

    let shared = false;
    await act(async () => {
      shared = await result.current.shareNatively();
    });

    expect(shared).toBe(true);
    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Joydeem Air Fryer',
      text: 'Check this out',
      url: 'https://example.com/products/JD-AF550',
    });
  });

  it('returns false when native share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        },
      })
    );

    let shared = true;
    await act(async () => {
      shared = await result.current.shareNatively();
    });

    expect(shared).toBe(false);
  });

  it('returns false when native share rejects', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('share failed')),
    });

    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        },
      })
    );

    let shared = true;
    await act(async () => {
      shared = await result.current.shareNatively();
    });

    expect(shared).toBe(false);
  });

  it('does not mark copied when clipboard support is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        },
      })
    );

    await act(async () => {
      await result.current.copyLink();
    });

    expect(result.current.copied).toBe(false);
  });
});
