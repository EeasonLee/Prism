export function normalizeHslValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function parseHslValue(
  value: string
): { h: number; s: number; l: number } | null {
  const normalized = normalizeHslValue(value);
  const match = normalized.match(
    /^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/
  );

  if (!match) {
    return null;
  }

  const [, h, s, l] = match;
  return {
    h: Number(h),
    s: Number(s),
    l: Number(l),
  };
}

function toHexChannel(value: number): string {
  const rounded = Math.max(0, Math.min(255, Math.round(value)));
  return rounded.toString(16).padStart(2, '0');
}

export function hslToHex(value: string): string {
  const parsed = parseHslValue(value);
  if (!parsed) {
    return 'N/A';
  }

  const h = ((parsed.h % 360) + 360) % 360;
  const s = parsed.s / 100;
  const l = parsed.l / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = h / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const m = l - chroma / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (segment >= 0 && segment < 1) {
    rPrime = chroma;
    gPrime = x;
  } else if (segment >= 1 && segment < 2) {
    rPrime = x;
    gPrime = chroma;
  } else if (segment >= 2 && segment < 3) {
    gPrime = chroma;
    bPrime = x;
  } else if (segment >= 3 && segment < 4) {
    gPrime = x;
    bPrime = chroma;
  } else if (segment >= 4 && segment < 5) {
    rPrime = x;
    bPrime = chroma;
  } else {
    rPrime = chroma;
    bPrime = x;
  }

  const r = (rPrime + m) * 255;
  const g = (gPrime + m) * 255;
  const b = (bPrime + m) * 255;

  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(
    b
  )}`.toUpperCase();
}
