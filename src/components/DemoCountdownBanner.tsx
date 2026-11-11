import React, { useState } from 'react';
import { 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  UserPlus, 
  LogIn, 
  Building2, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { DeviceDemoStatus } from '../utils/deviceDemoManager';
import { useLanguage } from '../utils/i18n';

interface DemoCountdownBannerProps {
  demoStatus: DeviceDemoStatus;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenDealer: () => void;
  onOpenPresentation?: () => void;
  referringDealerName?: string;
}

export const DemoCountdownBanner: React.FC<DemoCountdownBannerProps> = ({
  demoStatus,
  onOpenRegister,
  onOpenLogin,
  onOpenDealer,
  onOpenPresentation,
  referringDealerName
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { language, t } = useLanguage();

  if (demoStatus.isExpired || !demoStatus.isStarted) {
    return null; // When expired or not started yet, the banner is hidden
  }

  const { formattedTime, percentageRemaining, warningLevel, remainingMinutes } = demoStatus;

  // Visual Theme depending on remaining time
  const getThemeClasses = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          wrapper: 'bg-gradient-to-r from-rose-950/95 via-slate-950/95 to-rose-950/95 border-rose-500/60 shadow-lg shadow-rose-950/50',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
          timerText: 'text-rose-400 font-extrabold',
          progressBar: 'bg-gradient-to-r from-rose-500 to-amber-500',
          ctaButton: 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/50'
        };
      case 'warning':
        return {
          wrapper: 'bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-amber-950/95 border-amber-500/50 shadow-lg shadow-amber-950/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          timerText: 'text-amber-400 font-bold',
          progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          ctaButton: 'bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-amber-900/40'
        };
      case 'normal':
      default:
        return {
          wrapper: 'bg-gradient-to-r from-teal-950/90 via-slate-950/95 to-indigo-950/90 border-teal-500/40 shadow-lg shadow-slate-950/80',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          timerText: 'text-teal-400 font-bold',
          progressBar: 'bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-400',
          ctaButton: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-teal-900/40'
        };
    }
  };

  const theme = getThemeClasses();

  if (isCollapsed) {
    return (
      <aside 
        aria-label="Demo Süre Sayacı"
        className="fixed top-16 right-4 z-40 animate-fade-in"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-200 cursor-pointer ${theme.wrapper}`}
          title={language === 'en' ? 'View demo remaining time and benefits' : 'Demo süresini ve kayıt avantajlarını gör'}
        >
          {warningLevel === 'critical' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Clock className="w-4 h-4 text-teal-400 animate-spin-slow" />
          )}
          <span className="text-xs font-mono font-bold tracking-wider text-slate-100">
            Demo: <strong className={theme.timerText}>{formattedTime}</strong>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="30-Minute Free Demo Mode Banner"
      className={`relative z-30 border-b backdrop-blur-md transition-all duration-300 ${theme.wrapper}`}
    >
      {/* Top Thin Progress Bar */}
      <div className="w-full bg-slate-900/80 h-1 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${theme.progressBar}`}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Left: Indicator & Message */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold border flex items-center gap-1.5 shadow-inner ${theme.badge}`}>
              {warningLevel === 'critical' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-teal-400" />
              )}
              <span>{t('demo.bannerTitle', '30 DAKİKALIK ÜCRETSİZ DEMO MODU')}</span>
            </span>

            {/* Countdown Display */}
            <div className="flex items-baseline gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-slate-400 self-center" />
              <span className="text-[11px] text-slate-400 font-semibold hidden xs:inline">{t('demo.remainingTime', 'Kalan Süre')}:</span>
              <span className={`font-mono text-sm sm:text-base tracking-widest ${theme.timerText}`}>
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Contextual Warning & Dealer attribution */}
          <div className="text-xs text-slate-300 hidden sm:flex items-center gap-1.5">
            {warningLevel === 'critical' ? (
              <span className="text-rose-300 font-bold flex items-center gap-1">
                {language === 'en' 
                  ? '⚠️ Time is running out! Sign up now to continue your frequency sessions.' 
                  : '⚠️ Süre dolmak üzere! Seanslarınızın yarım kalmaması için hemen kaydolun.'}
              </span>
            ) : warningLevel === 'warning' ? (
              <span className="text-amber-200">
                {language === 'en'
                  ? 'You are actively testing AuraBio quantum frequency & bio-resonance features.'
                  : 'AuraBio Kuantum frekans ve biyo-rezonans özelliklerini sınırsız test ediyorsunuz.'}
              </span>
            ) : (
              <span className="text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                {language === 'en'
                  ? 'Device verified. All quantum frequency & analysis modules are unlocked for 30 minutes.'
                  : 'Cihazınız tanındı. 30 dakika boyunca tüm frekans ve analiz modülleri kısıtsız açıktır.'}
              </span>
            )}

            {referringDealerName && (
              <span className="ml-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {language === 'en' ? 'Authorized Dealer' : 'Yetkili Bayi'}: {referringDealerName}
              </span>
            )}
          </div>

          {/* Collapse Toggle for Mobile */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors md:hidden"
            title={t('common.close', 'Kapat')}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onOpenPresentation && (
            <button
              onClick={onOpenPresentation}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-all items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('nav.presentation', 'İş Sunumu')}</span>
            </button>
          )}

          <button
            onClick={onOpenDealer}
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('auth.dealerTitle', 'Bayimiz Olun')}</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('nav.login', 'Giriş Yap')}</span>
          </button>

          <button
            onClick={onOpenRegister}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${theme.ctaButton}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('nav.register', 'Üye Ol')}</span>
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors hidden md:block"
            title={t('common.close', 'Küçült')}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </aside>
  );
};
