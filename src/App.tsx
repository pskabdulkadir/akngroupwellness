/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AKN Global Group Ltd. Unified Application Suite
 * 1. Karşılama Ekranı (Hoş Geldiniz & Buton)
 * 2. AKN Group Wellness & Monoline MLM Platform
 * 3. VergiSync AI - Akıllı Muhasebe, e-Fatura & GİB Vergi Motoru
 */

import React, { useState, useEffect } from 'react';
import WellnessApp from './WellnessApp';
import SmartAccountingApp from './SmartAccountingApp';
import { 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Calculator, 
  Home, 
  Moon, 
  Sun,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Scale,
  FileText,
  Lock,
  Building2,
  ExternalLink,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { LegalContractsModal, LegalContractTab } from './components/LegalContractsModal';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';

export type ActiveAppView = 'welcome' | 'wellness' | 'accounting';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveAppView>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      if (viewParam === 'accounting') return 'accounting';
      if (viewParam === 'wellness') return 'wellness';
      if (viewParam === 'welcome') return 'welcome';
      
      const saved = sessionStorage.getItem('akn_active_app_view');
      if (saved === 'accounting' || saved === 'wellness' || saved === 'welcome') {
        return saved as ActiveAppView;
      }
      return 'welcome';
    } catch {
      return 'welcome';
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Bank POS Sözleşmeleri & Tıbbi Sorumluluk Reddi Modal Durumları
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalContractTab>('distanceSale');
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);

  const openLegalContract = (tab: LegalContractTab) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  useEffect(() => {
    try {
      sessionStorage.setItem('akn_active_app_view', activeView);
    } catch {
      // ignore
    }
  }, [activeView]);

  useEffect(() => {
    const handleOpenAccounting = () => setActiveView('accounting');
    const handleOpenWellness = () => setActiveView('wellness');
    const handleOpenWelcome = () => setActiveView('welcome');

    window.addEventListener('open-smart-accounting', handleOpenAccounting);
    window.addEventListener('open-wellness-portal', handleOpenWellness);
    window.addEventListener('open-welcome-portal', handleOpenWelcome);

    return () => {
      window.removeEventListener('open-smart-accounting', handleOpenAccounting);
      window.removeEventListener('open-wellness-portal', handleOpenWellness);
      window.removeEventListener('open-welcome-portal', handleOpenWelcome);
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  // If in Welcome view, show centered Hoş Geldiniz and Button
  if (activeView === 'welcome') {
    return (
      <div
        className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-950 text-slate-100'
            : 'bg-slate-50 text-slate-900'
        }`}
      >
        {/* Top utility bar */}
        <header className="w-full flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg">
              AKN Global Group Ltd.
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              · Wellness Platformu
            </span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
            className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs border border-slate-200'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Center Stage: Hoş Geldiniz & Buton */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl text-center flex flex-col items-center">
            
            {/* Hoş Geldiniz Başlığı */}
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
              style={{ textWrap: 'balance' }}
            >
              Hoş Geldiniz
            </h1>

            {/* Subtitle */}
            <p
              className={`text-base sm:text-lg mb-8 max-w-md leading-relaxed ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              AKN Group Wellness sayfasına başlamak için aşağıdaki butona tıklayın.
            </p>

            {/* Ortadaki Tek Ana Buton */}
            <div className="flex items-center gap-4 w-full justify-center">
              <button
                onClick={() => setActiveView('wellness')}
                type="button"
                className={`group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-base sm:text-lg font-bold rounded-xl transition-all duration-200 active:scale-98 cursor-pointer select-none whitespace-nowrap shadow-lg ${
                  isDarkMode
                    ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/5'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                <Activity className="w-5 h-5 text-emerald-500" />
                <span>AKN Wellness Uygulamasını Başlat</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Wellness Bilgilendirme Kartı */}
            <div className="mt-10 max-w-md w-full">
              <div className={`p-4 rounded-xl border text-center ${
                isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
              }`}>
                <div className="flex items-center justify-center gap-2 font-semibold text-sm mb-1 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AKN Group Wellness Platformu</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Bio-Rezonans, Çakra & Letaif Analizi, Ses Motoru
                </p>
              </div>
            </div>

          </div>
        </main>

        {/* =========================================================================
            BANKA SANAL POS UYUMLULUK VE ZORUNLU YASAL SÖZLEŞMELER / SAĞLIK UYARILARI ALANI
            ========================================================================= */}
        <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-950/90 text-xs text-slate-600 dark:text-slate-400 pt-8 pb-10 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* 1. ÖNEMLİ TIBBİ SORUMLULUK REDDİ (SAĞLIK İÇİN DEĞİLDİR UYARISI) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>YASAL ZORUNLU BİLGİLENDİRME: TIBBİ TEŞHİS VE TEDAVİ AMACI TAŞIMAZ</span>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                AKN Group bünyesindeki Bio-Rezonans, Çakra & Letaif Analiz motorları ve frekans uygulamaları <strong>tıbbi bir cihaz veya tedavi yöntemi DEĞİLDİR</strong>. Hastalıkları teşhis, tedavi veya rehabilite etmez. Sadece bireysel farkındalık, yaşam kalitesi ve enerji dengeleme amaçlı dijital analiz yazılımıdır. Her türlü sağlık sorununuz için lütfen uzman bir <strong>doktora veya sağlık kuruluşuna</strong> başvurunuz.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsMedicalModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Detaylı Tıbbi Sorumluluk Reddi (Medical Disclaimer) Metnini Görüntüle</span>
                </button>
              </div>
            </div>

            {/* 2. BANKA POS ONAYI İÇİN GEREKLİ TÜM YASAL SÖZLEŞMELER */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => openLegalContract('distanceSale')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mesafeli Satış Sözleşmesi</span>
                </button>

                <button
                  type="button"
                  onClick={() => openLegalContract('preInfo')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ön Bilgilendirme Formu</span>
                </button>

                <button
                  type="button"
                  onClick={() => openLegalContract('cancellationRefund')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-500" />
                  <span>İptal, İade & Cayma Hakkı Şartları</span>
                </button>

                <button
                  type="button"
                  onClick={() => openLegalContract('terms')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kullanım Koşulları & Güvenlik</span>
                </button>

                <button
                  type="button"
                  onClick={() => openLegalContract('kvkk')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>KVKK Aydınlatma & Gizlilik Politikası</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMedicalModalOpen(true)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Tıbbi Sorumluluk Reddi (Disclaimer)</span>
                </button>
              </div>
            </div>

            {/* 3. ŞİRKET KÜNYESİ (MERSİS, VKN, TİCARİ BİLGİLER - BANKA POS GEREKSİNİMİ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>AKN GLOBAL GROUP BİLİŞİM TEKNOLOJİLERİ VE DIŞ TİC. LTD. ŞTİ.</span>
                </p>
                <p>Vergi Dairesi: Beşiktaş V.D. · Vergi Kimlik No (VKN): 0340892341</p>
                <p>MERSİS No: 0034089234100001 · Ticaret Sicil No: 984521-5</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="flex items-center md:justify-end gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Barbaros Bulvarı No: 142/A Beşiktaş / İstanbul</span>
                </p>
                <p className="flex items-center md:justify-end gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>destek@akngroupfrekans.com · Tel: +90 (850) 840 00 00</span>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  T.C. Ticaret Bakanlığı ETBİS Kayıtlı & Sanal POS Uyumlu Sistem
                </p>
              </div>
            </div>

            {/* 4. GÜVENLİ ÖDEME VE ROZETLER */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40">
              <span>AKN Global Group Ltd. © {new Date().getFullYear()} · Tüm hakları saklıdır.</span>
              <div className="flex items-center gap-3 font-semibold text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">256-BIT SSL</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">3D SECURE</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">VISA</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">MASTERCARD</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">TROY</span>
              </div>
            </div>

          </div>
        </footer>

        {/* Modal Bileşenleri */}
        <LegalContractsModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        <MedicalDisclaimerModal
          isOpen={isMedicalModalOpen}
          onAccept={() => setIsMedicalModalOpen(false)}
        />
      </div>
    );
  }

  // Loaded Application View
  return (
    <div className="relative min-h-screen">
      {/* Return to Welcome Screen Header Bar */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('welcome')}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors font-medium text-white cursor-pointer"
            title="Karşılama Ekranına Geri Dön"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Karşılama Sayfasına Dön</span>
          </button>
          <span className="hidden sm:inline text-slate-400">·</span>
          <span className="hidden sm:inline text-slate-300 font-medium">
            {activeView === 'wellness' 
              ? 'AKN Group Wellness & Monoline MLM Platformu Aktif' 
              : 'VergiSync AI - Akıllı Muhasebe & GİB Vergi Motoru Aktif'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeView === 'wellness' ? (
            <button
              onClick={() => setActiveView('accounting')}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>VergiSync AI</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveView('wellness')}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wellness Portalı</span>
            </button>
          )}
        </div>
      </div>

      {activeView === 'wellness' ? (
        <WellnessApp onOpenSmartAccounting={() => setActiveView('accounting')} />
      ) : (
        <SmartAccountingApp onReturnToWellness={() => setActiveView('wellness')} />
      )}
    </div>
  );
}
