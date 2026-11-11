import React from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Award, 
  Layers, 
  Radio, 
  FileText, 
  HeartHandshake, 
  HelpCircle, 
  ArrowRight,
  CreditCard,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { MembershipPackage, BANK_INFO, ADMIN_PHONE } from '../utils/authManager';
import { DealerPackage } from '../utils/resellerManager';
import { formatUsd } from '../utils/currency';

interface PackageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: MembershipPackage | DealerPackage | null;
  onSelectPackage?: (pkg: any) => void;
  buttonLabel?: string;
  isDealerMode?: boolean;
  isInternational?: boolean;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  isOpen,
  onClose,
  pkg,
  onSelectPackage,
  buttonLabel = 'Bu Paketi Seç & Devam Et',
  isDealerMode = false,
  isInternational = false,
}) => {
  if (!isOpen || !pkg) return null;

  const defaultIncludedModules = [
    '📷 Optik Kamera Spektral Biyo-Rezonans ve Kirlian Aura Tarayıcısı',
    '🌈 7 Ana Çakra Frekans Dengeleme ve Enerji Akış Osiloskopu',
    '🕌 99 Esmaü’l Hüsna & Şifa Ayetleri Solfeggio Ses Frekans Dalga Motoru',
    '💎 5 Kalbi Letaif & Meridyen Biyo-Rezonans Analiz Sistemi',
    '📊 Otomatik Danışan PDF Teknik Analiz ve Frekans Rapor Çıktısı',
    '👥 Danışan Yönetim, Seans Geçmişi ve Kayıt Arşivi',
    '⌚ Akıllı Saat Nabız ve Canlı Biyo-Senkronizasyon Desteği (BLE 0x180D)',
    '🌐 Web & Mobil Uyumlu 7/24 Kesintisiz Bulut Erişimi'
  ];

  const packageAdvantages = [
    'Süre Sınırı Yok: Seans kredileriniz asla yanmaz veya silinmez.',
    'Yüksek Kâr Marjı: Dilediğiniz seans ücretini belirleme özgürlüğü.',
    'Anında Aktivasyon: Ödeme onayıyla hesabınıza saniyeler içinde yüklenir.',
    'Yasal Güvence: Mesafeli satış ve yasal telif güvencesiyle tam koruma.',
    'VIP Danışman Desteği: WhatsApp ve uzman psikolog heyet desteği.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-emerald-500/50 rounded-3xl p-4 sm:p-7 shadow-2xl shadow-emerald-950/80 space-y-5 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-amber-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-100">
                  {pkg.name}
                </h2>
                {pkg.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pkg.badge}
                  </span>
                )}
                {isInternational && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/15 text-sky-300 border border-sky-400/40">
                    3x Yurt Dışı
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                AuraBio Kuantum Biyo-Rezonans & Frekans Yazılımı Lisans Detayı
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Package Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-xs sm:text-sm">
          
          {/* Key Metrics / Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Fiyat</div>
              <div className="text-base sm:text-xl font-black text-amber-300 font-mono">
                {pkg.priceText}
              </div>
              <div className="text-[9px] text-slate-500">KDV Dahil</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-1">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Seans Havuzu</div>
              <div className="text-base sm:text-xl font-black text-emerald-300 font-mono">
                {pkg.scanCredits} Seans
              </div>
              <div className="text-[9px] text-emerald-400/80">Süresiz Kullanım</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Seans Maliyeti</div>
              <div className="text-base sm:text-xl font-black text-teal-300 font-mono">
                {pkg.unitCostText || `${formatUsd(pkg.price / (pkg.scanCredits || 1), 2)} / Seans`}
              </div>
              <div className="text-[9px] text-slate-500">Toptan Birim Fiyat</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Lisans Geçerliliği</div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-200 mt-1">
                Ömür Boyu Kredi
              </div>
              <div className="text-[9px] text-slate-500">Krediler Asla Yanmaz</div>
            </div>
          </div>

          {isInternational && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-200 text-xs">
              Seçilen yurt dışı ülke için paket fiyatı ve seans bedeli 3 kat uygulanır.
            </div>
          )}

          {/* Target Audience & Overview */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Paket Amacı & Hedef Kitle:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {pkg.targetAudience || 'Klinikler, bioenerji uzmanları, psikologlar, yaşam koçları ve holistik terapistler için özel olarak tasarlanmış kurumsal biyo-rezonans seans havuzu ve danışan analiz paketi.'}
            </p>
          </div>

          {/* Included Features & Modules */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Pakete Dahil Olan Tüm Modüller ve Özellikler</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Tam Yetkili Erişim</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(pkg.features && pkg.features.length > 0 ? pkg.features : defaultIncludedModules).map((feat, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-200 leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Included Application Modules Checklist */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Aktifleşecek Kuantum Modülleri:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {defaultIncludedModules.map((mod, i) => (
                <div key={i} className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{mod}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial & Legal Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Bayi & Uygulayıcı Avantajları</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {packageAdvantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Yasal & Güvenlik Bilgilendirmesi</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                <p>• <strong>Banka / Sanal POS Uyumlu:</strong> 256-bit SSL şifreleme ve BDDK lisanslı güvenli tahsilat.</p>
                <p>• <strong>Cayma İstisnası:</strong> 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yön. Md 15/1-ğ uyarınca anında ifa edilen dijital yazılımlarda iade yoktur.</p>
                <p>• <strong>Sorumluluk Reddi:</strong> Sistem tıbbi tanı veya tedavi aracı değildir; biyo-rezonans destek amaçlıdır.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer with Selection Button */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">
              Seçilen: <strong className="text-slate-100">{pkg.name}</strong>
            </div>
            <span className="font-mono font-bold text-amber-300 text-sm">{pkg.priceText}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>

            {onSelectPackage && (
              <button
                type="button"
                onClick={() => {
                  onSelectPackage(pkg);
                  onClose();
                }}
                className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>{buttonLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
