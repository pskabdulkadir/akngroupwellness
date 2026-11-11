import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Eye,
  Layers,
  Lock,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react';
import {
  FREKANS_PACKAGES,
  IMAGE_ASSETS,
  MonolineMember,
  OrderCommissionPayload,
  PackageDefinition,
  SystemDistributionParameters,
} from '../types/monoline';
import {
  ContractType,
  defaultPaymentProcessor,
  LEGAL_CONTRACT_TEXTS,
  SANDBOX_SMS_CODE,
  SANDBOX_TEST_CARD_CVV,
  SANDBOX_TEST_CARD_EXPIRY,
  SANDBOX_TEST_CARDS,
  recordUserContractApprovals,
} from '../utils/paymentProcessor';
import { formatUsd } from '../utils/currency';
import { getPackagePriceForRegion, resolveMemberRegion } from '../utils/walletRegion';

interface PackagesCatalogViewProps {
  members: MonolineMember[];
  selectedMemberId: string;
  onSelectMember: (userId: string) => void;
  distributionParams: SystemDistributionParameters;
  initialCheckoutRequest?: {
    packageId: string;
    nonce: number;
  } | null;
  onPurchasePackage: (payload: OrderCommissionPayload) => Promise<any>;
  onReturnToBackOffice?: () => void;
  isSubmitting: boolean;
}

export const PackagesCatalogView: React.FC<PackagesCatalogViewProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  distributionParams,
  initialCheckoutRequest,
  onPurchasePackage,
  onReturnToBackOffice,
  isSubmitting,
}) => {
  const sortedMembers = [...members].sort((a, b) => a.global_line_id - b.global_line_id);
  const activeBuyer =
    sortedMembers.find((m) => m.user_id === selectedMemberId) || sortedMembers[0];

  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    initialCheckoutRequest?.packageId || 'PKG_MINI_DENEME'
  );
  const [inspectedPkg, setInspectedPkg] = useState<PackageDefinition | null>(null);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'RANK_1_2' | 'RANK_3' | 'RANK_4'>('ALL');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Sipariş Sepeti & Ödeme (Checkout) state'leri
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(Boolean(initialCheckoutRequest));
  const [paymentMethod] = useState<'CARD_3D'>('CARD_3D');
  const [cardHolder, setCardHolder] = useState<string>(activeBuyer?.full_name || 'AKN BAYİ');
  const [cardNumber, setCardNumber] = useState<string>(SANDBOX_TEST_CARDS.SUCCESS.number);
  const [cardExpiry, setCardExpiry] = useState<string>(SANDBOX_TEST_CARD_EXPIRY);
  const [cardCvv, setCardCvv] = useState<string>(SANDBOX_TEST_CARD_CVV);
  const [approvedDistanceSales, setApprovedDistanceSales] = useState<boolean>(false);
  const [approvedPreInfo, setApprovedPreInfo] = useState<boolean>(false);
  const [approvedMlmTerms, setApprovedMlmTerms] = useState<boolean>(false);
  const [viewingLegalContract, setViewingLegalContract] = useState<ContractType | null>(null);
  const [paymentCompletedReceipt, setPaymentCompletedReceipt] = useState<{
    orderId: string;
    pkgName: string;
    amount: number;
    credits: number;
    buyerName: string;
    timestamp: string;
    posTxId?: string;
  } | null>(null);
  const [checkoutWarning, setCheckoutWarning] = useState<string | null>(null);

  const checkoutSectionRef = useRef<HTMLDivElement | null>(null);

  const periodDays = 30;

  useEffect(() => {
    if (activeBuyer?.full_name) {
      setCardHolder(activeBuyer.full_name.toUpperCase());
    }
  }, [activeBuyer?.user_id, activeBuyer?.full_name]);

  useEffect(() => {
    if (initialCheckoutRequest) {
      setSelectedPkgId(initialCheckoutRequest.packageId || 'PKG_MINI_DENEME');
      setIsCheckoutOpen(true);
      setPaymentCompletedReceipt(null);
      setCheckoutWarning(null);
      setTimeout(() => {
        checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [initialCheckoutRequest?.nonce]);

  const selectedPkg =
    FREKANS_PACKAGES.find((p) => p.id === selectedPkgId) || FREKANS_PACKAGES[0];
  const selectedPkgCheckoutPrice = getPackagePriceForRegion(
    selectedPkg.defaultPrice,
    resolveMemberRegion(activeBuyer?.country_code)
  );

  const filteredPackages = FREKANS_PACKAGES.filter((pkg) => {
    if (tierFilter === 'ALL') return true;
    if (tierFilter === 'RANK_1_2') return pkg.defaultPrice <= 20000;
    if (tierFilter === 'RANK_3') return pkg.defaultPrice >= 25000 && pkg.defaultPrice <= 60000;
    if (tierFilter === 'RANK_4') return pkg.defaultPrice >= 70000;
    return true;
  });

  // Herhangi bir pakette "Satın Al" tıklandığında önce Sipariş Sepeti & Ödeme adımını aç
  const handleOpenCartForPackage = (pkg: PackageDefinition) => {
    setSelectedPkgId(pkg.id);
    setInspectedPkg(null);
    setPaymentCompletedReceipt(null);
    setCheckoutWarning(null);
    setIsCheckoutOpen(true);
    setTimeout(() => {
      checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Sipariş Sepetinde "Ödemeyi Tamamla & Siparişi Onayla" tıklandığında çalışır
  const handleCompleteCartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBuyer) return;
    setCheckoutWarning(null);

    if (!approvedDistanceSales || !approvedPreInfo || !approvedMlmTerms) {
      setCheckoutWarning(
        'Banka ve Ticaret Bakanlığı Uyum Denetimi: Ödeme adımına geçebilmek için Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu ve Bayilik/KVKK Sözleşmesi onay kutularının tamamını işaretlemeniz zorunludur.'
      );
      return;
    }

    const orderId = `ORD-${crypto.randomUUID()}`;

    const approvals = await recordUserContractApprovals({
      user_id: activeBuyer.user_id,
      user_name: activeBuyer.full_name,
      order_id: orderId,
      order_amount: selectedPkgCheckoutPrice,
      product_summary: `${selectedPkg.name} · ${selectedPkg.sessionCreditsLabel} · ACTIVITY_RENEWAL`,
      contracts: ['DISTANCE_SALES', 'PRE_INFORMATION', 'MLM_TERMS', 'KVKK'],
      version: 'v2.2',
    });
    if (approvals.length !== 4) {
      setCheckoutWarning('Sözleşme onayları sunucuya kaydedilemedi. Ödeme başlatılmadı.');
      return;
    }

    let posCharge;
    try {
      posCharge = await defaultPaymentProcessor.chargeCreditCard(
        {
          cardHolder,
          cardNumber,
          cardExpiry,
          cardCvv,
        },
        selectedPkgCheckoutPrice,
        orderId,
        activeBuyer.user_id,
        [{ package_id: selectedPkg.id, quantity: 1 }]
      );
    } catch (posErr: any) {
      setCheckoutWarning(posErr?.message || 'Sanal POS ödeme işlemi başarısız oldu.');
      return;
    }

    const res = await onPurchasePackage({
      user_id: activeBuyer.user_id,
      order_id: orderId,
      order_amount: selectedPkgCheckoutPrice,
      package_id: selectedPkg.id,
      timestamp: new Date().toISOString(),
      order_type: 'ACTIVITY_RENEWAL',
      payment_method: paymentMethod,
      merchant_oid: posCharge.merchant_oid,
      transaction_id: posCharge.transaction_id,
    });

    if (res) {
      setPaymentCompletedReceipt({
        orderId,
        pkgName: selectedPkg.name,
        amount: selectedPkgCheckoutPrice,
        credits: selectedPkg.sessionCredits,
        buyerName: activeBuyer.full_name,
        timestamp: new Date().toLocaleString('tr-TR'),
        posTxId: posCharge.transaction_id,
      });
    } else {
      setCheckoutWarning('Ödeme alındı ancak sipariş sunucuda tamamlanamadı. Destek ekibine işlem numarasını iletin: ' + posCharge.transaction_id);
    }
  };

  return (
    <div className="space-y-8" ref={checkoutSectionRef}>
      {/* SİPARİŞ SEPETİ & GÜVENLİ ÖDEME ADIMI (CHECKOUT CART PANEL) */}
      <section className="bg-white border-2 border-emerald-600/80 rounded-2xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  SİPARİŞ SEPETİ &amp; ÖDEME MERKEZİ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Her Alım +{periodDays} Gün Aktiflik
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Bayi Sipariş Sepeti, Ödeme Onayı ve Aktiflik Uzatma
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReturnToBackOffice && (
              <button
                type="button"
                onClick={onReturnToBackOffice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Bayi Back-Office'e Dön</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCheckoutOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              {isCheckoutOpen ? 'Sepeti Küçült' : 'Sipariş Sepetini Aç'}
            </button>
          </div>
        </div>

        {isCheckoutOpen && (
          <div className="p-6 space-y-6">
            {paymentCompletedReceipt && (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-extrabold text-emerald-950">
                        ✓ Ödeme Başarıyla Tamamlandı &amp; Sipariş Onaylandı ({paymentCompletedReceipt.orderId})
                      </div>
                      <div className="text-xs text-emerald-800">
                        Bayi: <strong>{paymentCompletedReceipt.buyerName}</strong> · Paket:{' '}
                        <strong>{paymentCompletedReceipt.pkgName}</strong> · Tutar:{' '}
                        <strong>{formatUsd(paymentCompletedReceipt.amount)}</strong> ·
                        Yüklenen Kredi: <strong>+{paymentCompletedReceipt.credits} Seans Kredisi</strong>
                        {activeBuyer && (
                          <>
                            {' '}· Güncel Kredi Havuzu:{' '}
                            <strong className="text-emerald-950 underline">
                              {activeBuyer.session_credits.toLocaleString('tr-TR')} Seans Kredisi
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('aurabio_open_reseller_dashboard'));
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Bayi &amp; Kredi Havuzu Paneline Dön →
                    </button>
                    {onReturnToBackOffice && (
                      <button
                        type="button"
                        onClick={onReturnToBackOffice}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                      >
                        Bayi Back-Office Aktiflik Sayacını Gör →
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <>
                      <strong className="text-emerald-700">
                        ✓ AKTİFLİK UZATILDI (+{periodDays} Gün):
                      </strong>{' '}
                      Aktiflik süresine {periodDays} gün eklendi.
                    </>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {paymentCompletedReceipt.timestamp}
                  </span>
                </div>
              </div>
            )}

            {checkoutWarning && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <div className="font-bold">{checkoutWarning}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutWarning(null)}
                  className="text-red-700 underline shrink-0 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sol 7 Sütun: Sepet Detayları */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Alıcı Bayi ve Bu Ayki Aktiflik Kotası */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        1. Sipariş Veren Bayi Hesabı:
                      </label>
                      <select
                        value={activeBuyer?.user_id || ''}
                        onChange={(e) => {
                          onSelectMember(e.target.value);
                          setCheckoutWarning(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
                      >
                        {sortedMembers.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            Bayi #{m.global_line_id} — {m.full_name} (Kariyer Seviyesi {m.career_level})
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* 2. Sepetteki Paket Seçimi ve Tutar Özeti */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        2. Sepetteki Paket:
                      </label>
                      <select
                        value={selectedPkg.id}
                        onChange={(e) => setSelectedPkgId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
                      >
                        {FREKANS_PACKAGES.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatUsd(p.defaultPrice)} (
                            {p.sessionCreditsLabel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
                      <div className="text-[11px] text-slate-500">Ödenecek Sepet Tutarı</div>
                      <div className="text-2xl font-extrabold text-emerald-700">
                        {formatUsd(selectedPkgCheckoutPrice, 2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Seans Kredisi</div>
                      <div className="font-bold text-slate-900">
                        +{selectedPkg.sessionCredits.toLocaleString('tr-TR')} Kredi
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">
                        Sponsor &amp; Monoline Primi
                      </div>
                      <div className="font-bold text-emerald-700">
                        +%
                        {distributionParams.direct_sponsor_percent +
                          distributionParams.monoline_total_percent}{' '}
                        Dağıtım
                      </div>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Aktiflik Etkisi</div>
                      <div className="font-bold text-slate-900">
                        +{periodDays} Gün Aktiflik
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ 5 Sütun: Ödeme Formu & Ödemeyi Tamamla Butonu */}
              <form
                onSubmit={handleCompleteCartPayment}
                className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 space-y-4 border border-slate-800"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold tracking-wide uppercase text-emerald-300">
                      Güvenli Ödeme Adımı
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">SANDBOX POS · 3D SİMÜLASYON</span>
                </div>

                {/* Sadece Kredi Kartı / Sanal POS Bilgilendirmesi (IBAN/Havale/Kripto Kaldırıldı) */}
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Tekil Ödeme Kanalı: 3D Secure Sanal POS (Kredi / Banka Kartı)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[10px]">
                    IBAN / Kripto Kapalı
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300">Sandbox Test Kartları · Gerçek tahsilat yapılmaz</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(SANDBOX_TEST_CARDS) as (keyof typeof SANDBOX_TEST_CARDS)[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setCardNumber(SANDBOX_TEST_CARDS[key].number);
                            setCardExpiry(SANDBOX_TEST_CARD_EXPIRY);
                            setCardCvv(SANDBOX_TEST_CARD_CVV);
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500/60 cursor-pointer"
                        >
                          <div className="text-[11px] text-slate-200 font-semibold">{SANDBOX_TEST_CARDS[key].label}</div>
                          <div className="text-[10px] font-mono text-slate-400">{SANDBOX_TEST_CARDS[key].number}</div>
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Son kullanma: {SANDBOX_TEST_CARD_EXPIRY} · CVV: {SANDBOX_TEST_CARD_CVV} · 3D SMS: {SANDBOX_SMS_CODE}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kart Üzerindeki Ad Soyad</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Kart Numarası</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Son Kullanma (AA/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">CVV Güvenlik Kodu</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* ZORUNLU YASAL SÖZLEŞMELER & UYUM ONAY KUTULARI (COMPLIANCE CHECKBOXES - v2.2) */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-[11px]">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span>Zorunlu Yasal Sözleşme Onayları (v2.2)</span>
                    <span className="text-[10px] font-mono text-slate-400">IP &amp; Tarih Kayıtlı</span>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={approvedDistanceSales}
                      onChange={(e) => setApprovedDistanceSales(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setViewingLegalContract('DISTANCE_SALES')}
                        className="text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer"
                      >
                        Mesafeli Satış Sözleşmesini
                      </button>{' '}
                      okudum, onaylıyorum.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={approvedPreInfo}
                      onChange={(e) => setApprovedPreInfo(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setViewingLegalContract('PRE_INFORMATION')}
                        className="text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer"
                      >
                        Ön Bilgilendirme Formunu
                      </button>{' '}
                      okudum, onaylıyorum.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={approvedMlmTerms}
                      onChange={(e) => setApprovedMlmTerms(e.target.checked)}
                      className="mt-0.5 rounded accent-emerald-500"
                    />
                    <span>
                      <button
                        type="button"
                        onClick={() => setViewingLegalContract('MLM_TERMS')}
                        className="text-emerald-400 underline font-semibold hover:text-emerald-300 cursor-pointer"
                      >
                        AuraBio Bayilik, Monoline Kazanç Planı ve KVKK Aydınlatma Metnini
                      </button>{' '}
                      okudum, onaylıyorum.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !approvedDistanceSales ||
                    !approvedPreInfo ||
                    !approvedMlmTerms
                  }
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ödemeyi Tamamla &amp; Aktifliği Uzat ({formatUsd(selectedPkgCheckoutPrice)})</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Modern Hero Showcase with High-Res Image & Selected Package Checkout Bar */}
      <section className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left 7 Cols: Editorial & Active Dealer Credit Pool */}
          <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400">
                <span>AKN GROUP FREKANS</span>
                <span aria-hidden="true">·</span>
                <span>BAYİLİK BAŞLANGIÇ PAKETİ VE KREDİ HAVUZU</span>
                <span aria-hidden="true">·</span>
                <span>15 RESMİ PAKET</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Bayi Seans Kredisi Havuzu & Monoline Alışveriş Paketleri
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                İhtiyacınıza uygun seans kredisi paketini seçin. Paket satın alındığında{' '}
                <strong className="text-white">Bayi Seans Kredisi</strong> anında hesabınıza
                tanımlanır ve paket tutarı Monoline komisyon motoru üzerinden{' '}
                <span className="text-amber-300 font-mono">
                  %{distributionParams.system_fund_percent} Fon · %
                  {distributionParams.direct_sponsor_percent} Sponsor · %
                  {distributionParams.monoline_total_percent} 7 Derinlik
                </span>{' '}
                olarak dağıtılır.
              </p>
            </div>

            {/* Active Dealer Selector & Selected Package Action Box */}
            <div className="p-5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Paketin Yükleneceği Aktif Bayi Hesabı:
                  </label>
                  <select
                    value={activeBuyer?.user_id || ''}
                    onChange={(e) => onSelectMember(e.target.value)}
                    disabled={sortedMembers.length === 0}
                    className="bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  >
                    {sortedMembers.length === 0 ? (
                      <option value="">
                        Henüz Kayıtlı Bayi Yok (Frekans Kayıtlarını Senkronize Edin)
                      </option>
                    ) : (
                      sortedMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          #{m.global_line_id} — {m.full_name} (
                          {m.session_credits.toLocaleString('tr-TR')} Seans Kredisi ·{' '}
                          Kariyer Seviyesi {m.career_level})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {activeBuyer && (
                  <div className="text-left sm:text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">Mevcut Bayi Seans Kredisi</div>
                    <div className="text-xl font-bold text-amber-400">
                      {activeBuyer.session_credits.toLocaleString('tr-TR')} Kredi
                    </div>
                  </div>
                )}
              </div>

              {/* Currently Selected Package Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-400">
                    Şu An Seçili Paket ({selectedPkg.badgeCategory}):
                  </div>
                  <div className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                    <span>{selectedPkg.name}</span>
                    <span className="text-amber-400 font-mono tabular-nums">
                      · {selectedPkg.sessionCreditsLabel}
                    </span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      · {formatUsd(selectedPkgCheckoutPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectedPkg(selectedPkg)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Paketi İncele
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleOpenCartForPackage(selectedPkg)}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    Sipariş Sepetine Ekle & Ödemeye Geç
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Generated Hero Image with Resilient Fallback */}
          <div className="lg:col-span-5 relative min-h-[260px] bg-slate-950 overflow-hidden">
            {!imgErrors['hero'] ? (
              <img
                src={IMAGE_ASSETS.heroHub}
                alt="AKN Group Frekans Biyo-Rezonans ve Komisyon Merkezi"
                referrerPolicy="no-referrer"
                onError={() => setImgErrors((prev) => ({ ...prev, hero: true }))}
                className="w-full h-full object-cover opacity-85"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-center">
                <div className="space-y-2">
                  <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                  <div className="text-sm font-bold text-white">
                    AKN Group Frekans Kredi Havuzu
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6">
              <div className="space-y-1">
                <div className="text-xs font-mono text-amber-300">
                  OTOMATİK WEBHOOK & KREDİ ENTEGRASYONU
                </div>
                <div className="text-sm font-semibold text-white">
                  32 Seans Kredisinden 999.999 Ömür Boyu Seans Kredisine Kadar 15 Kademe
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Bayilik Başlangıç Paketi ve Kredi Havuzu (Bayi Seans Kredisi)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Herhangi bir paketi <strong>İncele</strong> butonuyla detaylı görüntüleyebilir veya{' '}
            <strong>Seç</strong> butonuyla aktif paket olarak belirleyip satın alabilirsiniz.
          </p>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setTierFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tüm Paketler (15)
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('RANK_1_2')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'RANK_1_2'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Başlangıç & Terapist ($101–$402)
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('RANK_3')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'RANK_3'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Danışman & Klinik ($503–$1.206)
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('RANK_4')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              tierFilter === 'RANK_4'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master, Franchise & Devir ($1.407–$40.209)
          </button>
        </div>
      </div>

      {/* 15 Shopping Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => {
          const isSelected = pkg.id === selectedPkgId;
          const sponsorCommission =
            Math.round(pkg.defaultPrice * (distributionParams.direct_sponsor_percent / 100) * 100) /
            100;
          const monolineCommission =
            Math.round(pkg.defaultPrice * (distributionParams.monoline_total_percent / 100) * 100) /
            100;

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                pkg.isFlagship
                  ? isSelected
                    ? 'bg-slate-950 text-white border-amber-400 ring-2 ring-amber-400/50'
                    : 'bg-slate-900 text-white border-slate-800 hover:border-amber-400/60'
                  : isSelected
                  ? 'bg-white text-slate-900 border-slate-900 ring-2 ring-slate-900/15 shadow-sm'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top Visual Thumbnail */}
                <div className="relative h-40 bg-slate-900 overflow-hidden border-b border-slate-200/20">
                  {!imgErrors[pkg.id] ? (
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      referrerPolicy="no-referrer"
                      onError={() => setImgErrors((prev) => ({ ...prev, [pkg.id]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 text-xs font-mono">
                      {pkg.badgeCategory}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold tracking-wide text-amber-300">
                        {pkg.badgeCategory}
                      </span>
                      {pkg.isPopular && (
                        <span className="text-[11px] font-mono font-semibold text-emerald-300">
                          ★ EN ÇOK TERCİH EDİLEN
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2 text-white">
                      <span className="text-sm font-mono font-bold tabular-nums text-amber-300">
                        {pkg.sessionCreditsLabel}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-200">
                        {pkg.perSessionCostLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3
                      className={`text-lg font-bold leading-snug ${
                        pkg.isFlagship ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        pkg.isFlagship ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {pkg.description}
                    </p>
                  </div>

                  {/* Price & Unit Cost Display */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-baseline justify-between ${
                      pkg.isFlagship
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div>
                      <div
                        className={`text-[11px] ${
                          pkg.isFlagship ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Paket Satış Tutarı
                      </div>
                      <div
                        className={`text-2xl font-bold font-mono tabular-nums ${
                          pkg.isFlagship ? 'text-amber-400' : 'text-slate-900'
                        }`}
                      >
                        {formatUsd(pkg.defaultPrice)}
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <div
                        className={`text-[11px] ${
                          pkg.isFlagship ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        Birim Seans Maliyeti
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          pkg.isFlagship ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        {pkg.perSessionCostLabel}
                      </div>
                    </div>
                  </div>

                  {/* Commission & Career Preview Line */}
                  <div
                    className={`text-xs font-mono tabular-nums space-y-1 ${
                      pkg.isFlagship ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>Direkt Sponsor Primi (%{distributionParams.direct_sponsor_percent}):</span>
                      <span
                        className={`font-semibold ${
                          pkg.isFlagship ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        +{formatUsd(sponsorCommission)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>7 Derinlik Monoline (%{distributionParams.monoline_total_percent}):</span>
                      <span
                        className={`font-semibold ${
                          pkg.isFlagship ? 'text-amber-300' : 'text-amber-800'
                        }`}
                      >
                        +{formatUsd(monolineCommission)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions: İncele | Seç / Seçildi + Satın Al */}
              <div
                className={`p-5 pt-0 space-y-2.5`}
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInspectedPkg(pkg)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      pkg.isFlagship
                        ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                        : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>İncele</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? pkg.isFlagship
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-900 text-white font-bold'
                        : pkg.isFlagship
                        ? 'bg-slate-800 text-amber-300 border border-amber-400/40 hover:bg-amber-400 hover:text-slate-950'
                        : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Seçildi</span>
                      </>
                    ) : (
                      <span>Seç</span>
                    )}
                  </button>
                </div>

                {isSelected && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleOpenCartForPackage(pkg)}
                    className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      pkg.isFlagship
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      Sepete Ekle & Ödemeye Geç (+{pkg.sessionCredits.toLocaleString('tr-TR')} Kredi)
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PACKAGE INSPECTION & COMMISSION SIMULATION MODAL ("İncele") */}
      {inspectedPkg && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl my-8">
            <div className="relative h-48 bg-slate-900">
              {!imgErrors[inspectedPkg.id] && (
                <img
                  src={inspectedPkg.imageUrl}
                  alt={inspectedPkg.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {inspectedPkg.badgeCategory} · {inspectedPkg.equivalentTierLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedPkg(null)}
                    className="p-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">{inspectedPkg.name}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-200 mt-1">
                    <span className="text-amber-300 font-bold">
                      {inspectedPkg.sessionCreditsLabel}
                    </span>
                    <span>·</span>
                    <span>{formatUsd(inspectedPkg.defaultPrice)}</span>
                    <span>·</span>
                    <span>{inspectedPkg.perSessionCostLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Paket Kapsamı & Bayi Seans Kredisi Avantajları:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {inspectedPkg.description}
                </p>
                <ul className="space-y-1.5 pt-1">
                  {inspectedPkg.includedFeatures.map((feat, i) => (
                    <li key={i} className="text-xs text-slate-800 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Distribution Breakdown for this Package */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">
                    {formatUsd(inspectedPkg.defaultPrice)} Paket Satışında Monoline
                    Dağıtım Tablosu
                  </span>
                  <span className="text-xs font-mono text-slate-500">Modül 2 Algoritması</span>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono tabular-nums text-xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-sans text-slate-500">
                      Sistem / Kariyer Fonu (%{distributionParams.system_fund_percent})
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {formatUsd(
                        (inspectedPkg.defaultPrice * distributionParams.system_fund_percent) /
                        100
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-sans text-slate-500">
                      Direkt Sponsor (%{distributionParams.direct_sponsor_percent})
                    </div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">
                      {formatUsd(
                        (inspectedPkg.defaultPrice * distributionParams.direct_sponsor_percent) /
                        100
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-sans text-slate-500">
                      7 Derinlik Üst Sıra (%{distributionParams.monoline_total_percent})
                    </div>
                    <div className="text-sm font-bold text-amber-800 mt-0.5">
                      {formatUsd(
                        (inspectedPkg.defaultPrice * distributionParams.monoline_total_percent) /
                        100
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-1 text-center font-mono tabular-nums text-[11px]">
                  {distributionParams.depth_percentages.map((pct, idx) => {
                    const depthAmt = Math.round(((inspectedPkg.defaultPrice * pct) / 100) * 100) / 100;
                    return (
                      <div
                        key={idx}
                        className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
                      >
                        <div className="text-[10px] text-slate-500">
                          {idx + 1}.Üst (%{pct})
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {formatUsd(depthAmt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setInspectedPkg(null)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Kapat
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkgId(inspectedPkg.id);
                      setInspectedPkg(null);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Paketi Seç
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleOpenCartForPackage(inspectedPkg)}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {activeBuyer?.full_name} İçin Sepete Ekle & Öde ({formatUsd(inspectedPkg.defaultPrice)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YASAL SÖZLEŞME TAM METİN OKUMA VE ONAY MODALI */}
      {viewingLegalContract && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingLegalContract(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <div className="text-[11px] font-mono font-bold text-emerald-700 uppercase">
                  RESMİ YASAL UYUM BELGESİ ({LEGAL_CONTRACT_TEXTS[viewingLegalContract].version})
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {LEGAL_CONTRACT_TEXTS[viewingLegalContract].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingLegalContract(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto font-sans space-y-3">
              <p className="font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200/80">
                {LEGAL_CONTRACT_TEXTS[viewingLegalContract].summary}
              </p>
              <div className="space-y-2">
                {LEGAL_CONTRACT_TEXTS[viewingLegalContract].clauses.map((clause, idx) => (
                  <p key={idx} className="text-slate-600 bg-white/60 p-2.5 rounded-lg border border-slate-100">
                    {clause}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Onayınız IP adresi, zaman damgası ve {LEGAL_CONTRACT_TEXTS[viewingLegalContract].version} sürüm koduyla kaydedilir.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (viewingLegalContract === 'DISTANCE_SALES') setApprovedDistanceSales(true);
                  if (viewingLegalContract === 'PRE_INFORMATION') setApprovedPreInfo(true);
                  if (viewingLegalContract === 'MLM_TERMS') setApprovedMlmTerms(true);
                  setViewingLegalContract(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Okudum ve Onaylıyorum ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
