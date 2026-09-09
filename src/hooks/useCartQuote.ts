import { useCallback, useEffect, useRef, useState } from 'react';
import { api, toApiError } from '@/services/api';
import type { CartQuote, QuoteIssue } from '@/services/api.types';
import { computeTotals, useCartStore } from '@/store/useCartStore';
import { useAppConfigStore } from '@/store/useAppConfigStore';

/**
 * Server-calculated cart totals. The backend is the source of truth for prices,
 * fees, tax and discounts, so the app never trusts its own arithmetic at
 * checkout. A locally computed quote is shown first so the UI never flashes
 * empty, then replaced as soon as the server answers.
 */
export interface CartQuoteState {
  quote: CartQuote;
  loading: boolean;
  /** True once the server has confirmed these totals. */
  confirmed: boolean;
  error: string | null;
  issues: QuoteIssue[];
  refresh: () => void;
}

export function useCartQuote(): CartQuoteState {
  const items = useCartStore((s) => s.items);
  const store = useCartStore((s) => s.store);
  const promo = useCartStore((s) => s.promo);
  const taxLabel = useAppConfigStore((s) => s.settings.taxLabel);

  const local = computeTotals(items, promo, store?.deliveryFee ?? 0);
  const fallback: CartQuote = { ...local, taxLabel, minOrder: store?.minOrder ?? 0, issues: [], promo };

  const [quote, setQuote] = useState<CartQuote>(fallback);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  // A stable signature of the cart so we only re-quote on real changes.
  const signature = `${store?.id ?? ''}|${promo?.code ?? ''}|${items.map((i) => `${i.product.id}x${i.quantity}`).join(',')}`;

  const fetchQuote = useCallback(async () => {
    if (!store || items.length === 0) {
      setQuote({ ...computeTotals([], null, 0), taxLabel, minOrder: 0, issues: [], promo: null });
      setConfirmed(false);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const next = await api.quoteCart({
        storeId: store.id,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.product.price })),
        promoCode: promo?.code ?? null,
      });
      if (id !== requestId.current) return; // a newer request already answered
      setQuote(next);
      setConfirmed(true);
    } catch (e) {
      if (id !== requestId.current) return;
      // Offline or backend down: keep showing the local estimate and say so.
      setError(toApiError(e).message);
      setConfirmed(false);
      setQuote({ ...computeTotals(items, promo, store.deliveryFee), taxLabel, minOrder: store.minOrder, issues: [], promo });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [store, items, promo, taxLabel]);

  useEffect(() => {
    const t = setTimeout(fetchQuote, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { quote, loading, confirmed, error, issues: quote.issues, refresh: fetchQuote };
}
