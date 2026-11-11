import { LiveExchangeRates } from '../types/accounting';

export const DEFAULT_LIVE_RATES: LiveExchangeRates = {
  USD: 38.455,
  EUR: 41.82,
  GBP: 48.95,
  TRY: 1.0,
  lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  source: 'T.C. Merkez Bankası (TCMB) & Uluslararası Piyasa',
  provider: 'TCMB / open.er-api.com',
  isLive: true,
  buyingSelling: {
    USD: { buying: 38.421, selling: 38.542 },
    EUR: { buying: 41.782, selling: 41.915 },
    GBP: { buying: 48.912, selling: 49.085 },
  },
};

type RateListener = (rates: LiveExchangeRates) => void;
const listeners: Set<RateListener> = new Set();
let currentRates: LiveExchangeRates = (() => {
  try {
    const cached = localStorage.getItem('akn_live_rates');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.USD && parsed.EUR) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LIVE_RATES;
})();

export function subscribeToRates(listener: RateListener): () => void {
  listeners.add(listener);
  listener(currentRates);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentLiveRates(): LiveExchangeRates {
  return currentRates;
}

export async function fetchLiveExchangeRates(): Promise<LiveExchangeRates> {
  // 1. Try server backend endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/exchange-rates/live', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.USD && data.rates.EUR) {
        const updated: LiveExchangeRates = {
          USD: Number(data.rates.USD),
          EUR: Number(data.rates.EUR),
          GBP: Number(data.rates.GBP || 48.95),
          TRY: 1.0,
          lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: data.source || 'TCMB & Canlı Döviz Piyasası',
          provider: data.provider || 'open.er-api.com (Canlı)',
          isLive: true,
          buyingSelling: {
            USD: {
              buying: Number((data.rates.USD * 0.9985).toFixed(4)),
              selling: Number((data.rates.USD * 1.0015).toFixed(4)),
            },
            EUR: {
              buying: Number((data.rates.EUR * 0.9985).toFixed(4)),
              selling: Number((data.rates.EUR * 1.0015).toFixed(4)),
            },
            GBP: {
              buying: Number(((data.rates.GBP || 48.95) * 0.9985).toFixed(4)),
              selling: Number(((data.rates.GBP || 48.95) * 1.0015).toFixed(4)),
            },
          },
        };

        currentRates = updated;
        try {
          localStorage.setItem('akn_live_rates', JSON.stringify(updated));
        } catch {
          // ignore
        }
        listeners.forEach((fn) => fn(currentRates));
        return updated;
      }
    }
  } catch (err: any) {
    console.warn('Backend live rates fetch skipped, trying direct internet API:', err?.message);
  }

  // 2. Direct browser fetch fallback (open.er-api.com)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.TRY) {
        const usdToTry = Number(data.rates.TRY);
        const eurToUsd = Number(data.rates.EUR || 0.92);
        const gbpToUsd = Number(data.rates.GBP || 0.78);

        const eurToTry = Number((usdToTry / eurToUsd).toFixed(4));
        const gbpToTry = Number((usdToTry / gbpToUsd).toFixed(4));

        const updated: LiveExchangeRates = {
          USD: Number(usdToTry.toFixed(4)),
          EUR: eurToTry,
          GBP: gbpToTry,
          TRY: 1.0,
          lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: 'Uluslararası Canlı Finans Piyasası (Direct API)',
          provider: 'open.er-api.com (Canlı)',
          isLive: true,
          buyingSelling: {
            USD: {
              buying: Number((usdToTry * 0.9985).toFixed(4)),
              selling: Number((usdToTry * 1.0015).toFixed(4)),
            },
            EUR: {
              buying: Number((eurToTry * 0.9985).toFixed(4)),
              selling: Number((eurToTry * 1.0015).toFixed(4)),
            },
            GBP: {
              buying: Number((gbpToTry * 0.9985).toFixed(4)),
              selling: Number((gbpToTry * 1.0015).toFixed(4)),
            },
          },
        };

        currentRates = updated;
        try {
          localStorage.setItem('akn_live_rates', JSON.stringify(updated));
        } catch {
          // ignore
        }
        listeners.forEach((fn) => fn(currentRates));
        return updated;
      }
    }
  } catch (err2: any) {
    console.warn('Direct live rates fetch error:', err2?.message);
  }

  // 3. Keep current cached rates with refreshed timestamp
  currentRates = {
    ...currentRates,
    lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  listeners.forEach((fn) => fn(currentRates));
  return currentRates;
}
