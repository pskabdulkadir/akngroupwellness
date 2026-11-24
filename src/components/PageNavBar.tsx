import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';

interface PageNavBarProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export const PageNavBar: React.FC<PageNavBarProps> = ({
  title,
  subtitle,
  icon,
  badge,
  onGoBack,
  onGoHome,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur-md sm:p-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Geri</span>
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0 justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Ana Sayfaya Dön"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Ana Sayfa</span>
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {icon && <div className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 p-2">{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-sm font-bold leading-tight text-white sm:text-base">{title}</h2>
              {badge && (
                <span className="max-w-full break-words rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNavBar;
