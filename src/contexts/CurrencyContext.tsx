import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_LKR_PER_USD, formatIn, type Currency } from '../utils/currency';
import { useStore } from './StoreContext';

const STORAGE_KEY = 'ft-currency';

interface CurrencyValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Rupees per 1 US dollar */
  rate: number;
  /** Formats a USD amount in the customer's chosen currency */
  formatMoney: (usd: number) => string;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);

function readSaved(): Currency {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'LKR' ? 'LKR' : 'USD';
  } catch {
    return 'USD';
  }
}

export function CurrencyProvider({ children }: {children: React.ReactNode;}) {
  const { settings } = useStore();
  const [currency, setCurrencyState] = useState<Currency>(readSaved);
  const rate = settings.lkrPerUsd > 0 ? settings.lkrPerUsd : DEFAULT_LKR_PER_USD;

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {

      // private mode: the choice just lasts for this visit
    }}, []);

  const value = useMemo<CurrencyValue>(
    () => ({ currency, setCurrency, rate, formatMoney: (usd: number) => formatIn(usd, currency, rate) }),
    [currency, setCurrency, rate]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useMoney(): CurrencyValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useMoney must be used within CurrencyProvider');
  return ctx;
}
