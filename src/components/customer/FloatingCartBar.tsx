import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCartTotals } from '../../hooks/useCartTotals';
import { formatMoney } from '../../utils/currency';

export function FloatingCartBar() {
  const { itemCount } = useCart();
  const { totals } = useCartTotals();

  return (
    <AnimatePresence>
      {itemCount > 0 &&
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
        
          <Link
          to="/cart"
          className="mx-auto flex h-16 max-w-xl items-center gap-3 rounded-full bg-ink pl-3 pr-5 text-white shadow-2xl shadow-ink/30">
          
            <span className="grid h-10 min-w-[40px] place-items-center rounded-full bg-brand px-2 font-display text-lg font-black text-brand-ink">
              {itemCount}
            </span>
            <span className="flex-1 font-semibold">View cart</span>
            <span className="font-display text-lg font-extrabold tabular-nums">{formatMoney(totals.total)}</span>
            <ArrowRightIcon size={20} />
          </Link>
        </motion.div>
      }
    </AnimatePresence>);

}