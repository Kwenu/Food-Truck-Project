/**
 * The customer screens use one accent colour (the brand colour set by the admin) so the menu stays calm
 * and the dishes stay the focus. These helpers are kept so existing screens keep working.
 */
export const accentGradient = (_i: number) => 'from-brand to-brand';
export const accentSoft = (_i: number) => 'bg-brand/10 text-brand-strong';
