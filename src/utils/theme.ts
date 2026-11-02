import type { BrandPalette } from '../types/settings';

export const paletteColors: Record<BrandPalette, {label: string;hex: string;}> = {
  flame: { label: 'Flame', hex: '#E04A10' },
  lime: { label: 'Lime', hex: '#4D7C0F' },
  ocean: { label: 'Ocean', hex: '#0E7490' },
  berry: { label: 'Berry', hex: '#BE185D' }
};

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function isValidHex(hex: string): boolean {
  return hexToRgb(hex) !== null;
}

/** Repaints every brand-colored surface by updating CSS variables. */
export function applyBrandColor(hex: string): void {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const strong = rgb.map((c) => Math.round(c * 0.8)) as [number, number, number];
  const ink = luminance(rgb) > 0.45 ? '28 25 23' : '255 255 255';
  const root = document.documentElement;
  root.style.setProperty('--brand', rgb.join(' '));
  root.style.setProperty('--brand-strong', strong.join(' '));
  root.style.setProperty('--brand-ink', ink);
}