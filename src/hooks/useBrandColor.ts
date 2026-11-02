import { useEffect, useState } from 'react';

/** Resolves the live brand CSS variable to a color string usable in SVG charts. */
export function useBrandColor(): string {
  const read = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    return v ? `rgb(${v.split(/\s+/).join(',')})` : 'rgb(224,74,16)';
  };
  const [color, setColor] = useState(read);

  useEffect(() => {
    setColor(read());
    const observer = new MutationObserver(() => setColor(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  return color;
}