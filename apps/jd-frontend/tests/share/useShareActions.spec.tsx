import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShareActions } from '@/app/_ui/share';

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

  it('re-triggers copied state on repeated copy actions', async () => {
    vi.useFakeTimers();

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

    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(result.current.copied).toBe(false);

    await act(async () => {
      await result.current.copyLink();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    expect(result.current.copied).toBe(true);

    vi.useRealTimers();
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

  it('falls back to execCommand when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const execMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: execMock,
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

    let ok = false;
    await act(async () => {
      ok = await result.current.copyLink();
    });

    expect(execMock).toHaveBeenCalledWith('copy');
    expect(ok).toBe(true);
    expect(result.current.copied).toBe(true);
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('falls back to execCommand when clipboard write is rejected but execCommand succeeds', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
      },
    });

    const execMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: execMock,
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

    let ok = false;
    await act(async () => {
      ok = await result.current.copyLink();
    });

    expect(ok).toBe(true);
    expect(result.current.copied).toBe(true);
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('detects touch device when maxTouchPoints > 0', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });

    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Test Product',
          url: 'https://example.com/products/test',
        },
      })
    );

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('returns false for non-touch device', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });

    // Remove touch event detection as well
    const originalOntouchstart = (window as Record<string, unknown>)
      .ontouchstart;
    delete (window as Record<string, unknown>).ontouchstart;

    const { result } = renderHook(() =>
      useShareActions({
        target: {
          type: 'product',
          title: 'Test Product',
          url: 'https://example.com/products/test',
        },
      })
    );

    expect(result.current.isTouchDevice).toBe(false);

    // Restore
    if (originalOntouchstart !== undefined) {
      (window as Record<string, unknown>).ontouchstart = originalOntouchstart;
    }
  });

  it('returns false when clipboard write is rejected and execCommand fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
      },
    });

    const execMock = vi.fn().mockReturnValue(false);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      writable: true,
      value: execMock,
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

    let copied = true;
    await act(async () => {
      copied = await result.current.copyLink();
    });

    expect(copied).toBe(false);
    expect(result.current.copied).toBe(false);
    Reflect.deleteProperty(document, 'execCommand');
  });
});
