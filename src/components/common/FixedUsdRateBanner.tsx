import { useEffect, useState } from 'react';

export interface FixedUsdRate {
  usd_try_rate: number;
  updated_at: string | null;
  updated_by?: string | null;
}

const USD_TRY_RATE_CACHE_KEY = 'admin_usd_try_rate_v1';

function readCachedRate(): FixedUsdRate | null {
  try {
    const value = sessionStorage.getItem(USD_TRY_RATE_CACHE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (!Number.isFinite(parsed?.usd_try_rate)) return null;
    return {
      usd_try_rate: parsed.usd_try_rate,
      updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : null,
      updated_by: typeof parsed.updated_by === 'string' ? parsed.updated_by : null,
    };
  } catch {
    return null;
  }
}

interface FixedUsdRateBannerProps {
  rate?: FixedUsdRate | null;
  loadError?: boolean;
}

export function FixedUsdRateBanner({ rate: providedRate, loadError = false }: FixedUsdRateBannerProps) {
  const isControlled = providedRate !== undefined;
  const [fetchedRate, setFetchedRate] = useState<FixedUsdRate | null>(readCachedRate);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    if (isControlled) return;
    let active = true;
    let timeoutId = 0;

    const loadRate = async () => {
      try {
        const res = await fetch('/api/v1/exchange-rate/usd-try', { cache: 'no-store' });
        if (!res.ok) throw new Error('Kur isteği başarısız oldu.');
        const result = await res.json();
        const data = result?.data;
        if (
          result?.status !== 'success' ||
          !Number.isFinite(data?.usd_try_rate) ||
          data.usd_try_rate <= 0
        ) {
          throw new Error('Kur yanıtı geçersiz.');
        }
        if (active) {
          setFetchedRate(data);
          setFailed(false);
          try {
            sessionStorage.setItem(USD_TRY_RATE_CACHE_KEY, JSON.stringify(data));
          } catch {
            return;
          }
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) timeoutId = window.setTimeout(loadRate, 3000);
      }
    };

    void loadRate();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [isControlled]);

  const rate = isControlled ? providedRate : fetchedRate;

  return (
    <div className="flex w-fit max-w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 shadow-xs">
      <div className="flex items-baseline gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">USD/TRY Kuru</div>
        <div className="text-base font-mono font-bold text-slate-900 tabular-nums">
          {rate
            ? `1 USD = ${rate.usd_try_rate.toFixed(2)} TRY`
            : failed || loadError
              ? 'Kur alınamadı'
              : 'Yükleniyor...'}
        </div>
        {failed && rate && <div className="text-[10px] text-amber-700">Son kayıtlı kur gösteriliyor</div>}
      </div>
      {rate && rate.updated_at && (
        <div className="text-[10px] text-slate-500">
          Güncelleme: {new Date(rate.updated_at).toLocaleString('tr-TR')}
        </div>
      )}
    </div>
  );
}
