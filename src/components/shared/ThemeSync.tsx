import { useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import type { BrandPalette } from '../../types/settings';
import { applyBrandColor, paletteColors } from '../../utils/theme';

interface ThemeSyncProps {
  palette: BrandPalette;
}

/** Applies the brand color (from the shared settings) to the CSS variables. */
export function ThemeSync({ palette }: ThemeSyncProps) {
  const { settings } = useStore();
  const hex = settings.brandColor ?? paletteColors[palette].hex;

  useEffect(() => {
    applyBrandColor(hex);
  }, [hex]);

  return null;
}
