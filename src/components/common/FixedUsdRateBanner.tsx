import { useEffect, useState } from 'react';

export interface FixedUsdRate {
  usd_try_rate: number;
  updated_at: string | null;
}

interface FixedUsdRateBannerProps {
  rate?: FixedUsdRate | null;
  loadError?: boolean;
}

export function FixedUsdRateBanner({ rate: providedRate, loadError = false }: FixedUsdRateBannerProps) {
  const isControlled = providedRate !== undefined;
  const [fetchedRate, setFetchedRate] = useState<FixedUsdRate | null>(null);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    if (isControlled) return;
    fetch('/api/v1/exchange-rate/usd-try')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setFetchedRate(data.data);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [isControlled]);

  const rate = isControlled ? providedRate : fetchedRate;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 shadow-sm">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Yönetici Tarafından Belirlenen Sabit Kur</div>
        <div className="mt-1 text-xl font-mono font-bold text-slate-900 tabular-nums">
          {rate
            ? `1 USD = ${rate.usd_try_rate.toFixed(2)} TRY`
            : failed || loadError
              ? 'Kur alınamadı'
              : 'Yükleniyor...'}
        </div>
      </div>
      {rate && (
        <div className="text-xs font-medium text-slate-600">
          {rate.updated_at
            ? `Son yönetici güncellemesi: ${new Date(rate.updated_at).toLocaleString('tr-TR')}`
            : 'Yönetici tarafından henüz güncellenmedi (varsayılan kur)'}
        </div>
      )}
    </div>
  );
}
