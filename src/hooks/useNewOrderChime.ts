import { useEffect, useRef } from 'react';
import type { Order, OrderStatus } from '../types/order';

/**
 * Plays a short two-tone chime when an order newly enters `trigger` status.
 * Admin screens use 'received' (a new order to approve); the kitchen uses 'confirmed' (approved, ready to cook).
 */
export function useNewOrderChime(orders: Order[], enabled: boolean, ready = true, trigger: OrderStatus = 'received'): string[] {
  const seen = useRef<Set<string> | null>(null);
  const fresh = useRef<string[]>([]);

  useEffect(() => {
    if (!ready) return; // don't chime for the orders that were already there when the screen loaded
    const incoming = orders.filter((o) => o.status === trigger).map((o) => o.id);
    if (seen.current === null) {
      seen.current = new Set(incoming);
      return;
    }
    const newOnes = incoming.filter((id) => !seen.current?.has(id));
    newOnes.forEach((id) => seen.current?.add(id));
    fresh.current = newOnes;
    if (newOnes.length > 0 && enabled) playChime();
  }, [orders, enabled, ready, trigger]);

  return fresh.current;
}

function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as {webkitAudioContext: typeof AudioContext;}).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    window.setTimeout(() => ctx.close(), 800);
  } catch {

    // audio unavailable
  }}