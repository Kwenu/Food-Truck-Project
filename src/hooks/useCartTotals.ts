import { useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { computeTotals, isPromoApplicable, linesSubtotal } from '../utils/pricing';
import { estimatePrepMinutes } from '../utils/prepTime';

export function useCartTotals() {
  const { settings, promotions, queueCount, menuItems } = useStore();
  const { lines, orderType, promoCode } = useCart();

  return useMemo(() => {
    const promo = promotions.find((p) => p.active && p.code === promoCode) ?? null;
    const totals = computeTotals(lines, orderType ?? 'takeaway', settings, promo);
    const itemPreps = lines.map((l) => menuItems.find((m) => m.id === l.itemId)?.prepMinutes ?? 0);
    return {
      totals,
      promo,
      promoApplied: isPromoApplicable(promo, linesSubtotal(lines)),
      prepMinutes: estimatePrepMinutes(queueCount, settings, itemPreps)
    };
  }, [settings, promotions, queueCount, menuItems, lines, orderType, promoCode]);
}