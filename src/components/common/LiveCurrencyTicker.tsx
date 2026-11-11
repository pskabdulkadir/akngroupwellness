import React, { useState } from 'react';
import { DollarSign, RefreshCw, CheckCircle2, TrendingUp, Globe } from 'lucide-react';
import { LiveExchangeRates } from '../../types/accounting';

interface LiveCurrencyTickerProps {
  rates: LiveExchangeRates;
  onRefresh: () => Promise<void>;
  compact?: boolean;
}

export const LiveCurrencyTicker: React.FC<LiveCurrencyTickerProps> = ({
  rates,
  onRefresh,
  compact = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleRefreshClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-slate-500 font-sans font-bold">USD</span>
          <span className="font-bold text-slate-900">{rates.USD.toFixed(3)} ₺</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded border border-slate-200">
          <span className="text-[10px] text-slate-500 font-sans font-bold">EUR</span>
          <span className="font-bold text-slate-900">{rates.EUR.toFixed(3)} ₺</span>
        </div>
        <button
          onClick={handleRefreshClick}
          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          title="Canlı Kurları Yenile"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs shadow-2xs group cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleRefreshClick}
      title="Tıklayarak internetten anlık kurları yenileyin"
    >
      {/* Live Pulsing Dot & Label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
        </span>
        <span className="text-[10px] font-bold tracking-wider text-emerald-900 font-sans uppercase">
          Canlı Kur
        </span>
      </div>

      {/* Rates */}
      <div className="flex items-center gap-2.5 font-mono">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 font-sans">USD:</span>
          <span className="font-extrabold text-slate-900">{rates.USD.toFixed(2)} ₺</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 font-sans">EUR:</span>
          <span className="font-extrabold text-slate-900">{rates.EUR.toFixed(2)} ₺</span>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        type="button"
        onClick={handleRefreshClick}
        className="p-1 rounded-md text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 transition-colors ml-0.5"
        title="Canlı Kurları Yenile"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
      </button>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-xl z-50 text-[11px] space-y-1.5 border border-slate-700 pointer-events-none animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {rates.provider || 'Canlı İnternet API'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{rates.lastUpdated}</span>
          </div>
          <div className="border-t border-slate-800 pt-1 text-slate-300 font-mono space-y-0.5 text-[10px]">
            <p>1 USD = {rates.USD.toFixed(4)} ₺ (TCMB Alış)</p>
            <p>1 EUR = {rates.EUR.toFixed(4)} ₺ (TCMB Alış)</p>
            <p>1 GBP = {rates.GBP.toFixed(4)} ₺</p>
          </div>
          <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
            Tüm yurt dışı ($3x$ USD) faturalar ve KDV-1 istisnaları anlık bu kur üzerinden muhasebeleştirilir.
          </p>
        </div>
      )}
    </div>
  );
};
