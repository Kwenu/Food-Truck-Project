import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, ShoppingBagIcon, UtensilsIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useCartTotals } from '../../hooks/useCartTotals';
import { Logo } from '../shared/Logo';

interface CustomerHeaderProps {
  backTo?: string;
  showCart?: boolean;
  showMode?: boolean;
}

export function CustomerHeader({ backTo, showCart = true, showMode = true }: CustomerHeaderProps) {
  const { orderType, tableNumber, itemCount } = useCart();
  const { prepMinutes } = useCartTotals();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:gap-3 md:px-6">
        {backTo &&
        <Link
          to={backTo}
          aria-label="Go back"
          className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-surface">
          
            <ArrowLeftIcon size={20} />
          </Link>
        }
        <Link to="/" aria-label="Ember & Wheel home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <span className="sm:hidden">
            <Logo size="sm" showName={false} />
          </span>
          <span className="hidden sm:inline-flex">
            <Logo size="sm" />
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {showMode && orderType &&
          <Link
            to={orderType === 'dine-in' ? '/dine-in' : '/'}
            aria-label="Change how you're ordering"
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 text-sm font-semibold transition-colors duration-150 hover:border-ink/30">
            
              {orderType === 'dine-in' ?
            <>
                  <UtensilsIcon size={16} className="text-brand-strong" />
                  Table {tableNumber}
                </> :

            <>
                  <ClockIcon size={16} className="text-brand-strong" />
                  <span className="hidden sm:inline">Takeaway ·</span> ~{prepMinutes} min
                </>
            }
            </Link>
          }
          {showCart &&
          <Link
            to="/cart"
            aria-label={`Cart, ${itemCount} items`}
            className="relative inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-ink/90">
            
              <ShoppingBagIcon size={17} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 &&
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-brand-ink">{itemCount}</span>
            }
            </Link>
          }
        </div>
      </div>
    </header>);

}