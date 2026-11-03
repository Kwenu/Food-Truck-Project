import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { brandImages } from '../../data/brand';
import { estimatePrepMinutes } from '../../utils/prepTime';
import { Logo } from '../../components/shared/Logo';
import { CurrencyToggle } from '../../components/shared/CurrencyToggle';
import { OrderTypeTile } from '../../components/customer/OrderTypeTile';

export function Welcome() {
  const navigate = useNavigate();
  const { startOrder, tableNumber } = useCart();
  const { settings, queueCount } = useStore();
  const wait = estimatePrepMinutes(queueCount, settings);

  const chooseTakeaway = () => {
    startOrder('takeaway');
    navigate('/menu');
  };
  const chooseDineIn = () => {
    navigate('/dine-in');
  };

  return (
    <main className="min-h-screen w-full bg-cream lg:grid lg:grid-cols-[1.15fr_1fr]">
      <section className="relative flex h-[46vh] min-h-[340px] overflow-hidden lg:h-auto lg:min-h-screen">
        <img src={brandImages.hero} alt="A smash burger and fries handed over the counter of the Ember & Wheel food truck" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/50" aria-hidden="true" />
        <div className="relative flex w-full flex-col justify-between p-6 md:p-10 lg:p-14">
          <Logo tone="light" size="md" />
          <h1 className="font-display text-[44px] font-black uppercase leading-[0.88] tracking-tight text-white md:text-7xl lg:text-8xl">
            Fresh Food.
            <br />
            Fast Service.
            <br />
            <span className="text-mustard">Great Taste.</span>
          </h1>
        </div>
      </section>

      <section className="flex flex-col px-5 pb-8 pt-8 md:px-10 lg:min-h-screen lg:px-14 lg:pt-14">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {settings.isOpen ?
          <>
              <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
              <span>Open now</span>
              <span className="text-muted">· Current wait ~{wait} min</span>
            </> :

          <>
              <span className="h-2.5 w-2.5 rounded-full bg-danger" aria-hidden="true" />
              <span>Closed right now</span>
              <span className="text-muted">· Browse the menu, ordering is paused</span>
            </>
          }
          <CurrencyToggle className="ml-auto" />
        </div>

        <div className="mt-8 lg:my-auto">
          <h2 className="font-display text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">How are you eating today?</h2>
          <div className="mt-6 grid gap-4">
            <OrderTypeTile title="Takeaway" subtitle="Order ahead, skip the line, grab & go." image={brandImages.takeaway} onSelect={chooseTakeaway} />
            <OrderTypeTile
              title="Dine-in"
              subtitle={tableNumber ? `Continue at Table ${tableNumber} or pick another.` : 'Order from your table, we’ll bring it over.'}
              image={brandImages.dineIn}
              onSelect={chooseDineIn} />
            
          </div>
          <Link
            to="/track"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full px-1 font-semibold text-ink underline-offset-4 hover:underline">
            
            <SearchIcon size={18} /> Track an existing order
          </Link>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
          <span>© {new Date().getFullYear()} {settings.truckName}</span>
        </footer>
      </section>
    </main>);

}