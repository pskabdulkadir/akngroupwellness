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
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-2.5">
          {icon && <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">{icon}</div>}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">{title}</h2>
              {badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full">
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
