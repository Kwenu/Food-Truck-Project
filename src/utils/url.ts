/**
 * Base address encoded into printed QR codes. Set VITE_CUSTOMER_URL (e.g.
 * https://order.mytruck.com) when staff use a different address than customers,
 * so QR codes never point at the staff address.
 */
export function customerBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_CUSTOMER_URL?.trim();
  return (fromEnv || window.location.origin).replace(/\/+$/, '');
}

export const tableUrl = (code: string): string => `${customerBaseUrl()}/t/${code}`;
export const counterUrl = (): string => `${customerBaseUrl()}/`;
