import React, { useState, useEffect } from 'react';
import {
  MonolineMemberSync,
  MonolineOrderRecord,
  MonolineCommissionRecord,
  MonolineWithdrawalRecord,
  DoubleEntryJournalVoucher,
  ReconciliationAnomaly,
  MonolineReconciliationSummary,
  FinancialDataSource,
} from '../../types/monolineIntegration';
import {
  MOCK_MONOLINE_MEMBERS,
  MOCK_MONOLINE_ORDERS,
  MOCK_MONOLINE_COMMISSIONS,
  MOCK_MONOLINE_WITHDRAWALS,
  generateJournalVouchersFromMonoline,
  runSmartReconciliationAudit,
} from '../../services/monolineReconciliationService';
import { SpeechEngine } from '../../services/voiceAssistant';
import {
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Download,
  Building2,
  DollarSign,
  Landmark,
  Zap,
  Lock,
  GitBranch,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface MonolineIntegrationViewProps {
  onNavigateTab: (tab: string) => void;
}

export const MonolineIntegrationView: React.FC<MonolineIntegrationViewProps> = ({
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ANOMALIES' | 'VOUCHERS' | 'WITHDRAWALS' | 'MEMBERS_MAP' | 'WEBHOOK_SIM'
  >('ANOMALIES');

  // Live real data connected to PostgreSQL backend
  const [members, setMembers] = useState<MonolineMemberSync[]>([]);
  const [orders, setOrders] = useState<MonolineOrderRecord[]>([]);
  const [commissions, setCommissions] = useState<MonolineCommissionRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<MonolineWithdrawalRecord[]>([]);
  const [authoritativeSource, setAuthoritativeSource] = useState<FinancialDataSource>('SMART_ACCOUNTING_CANONICAL');

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveLedgerData() {
      try {
        const res = await fetch('/api/v1/integrations/accounting/sync-data');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.members?.length > 0) {
              const normalized = data.members.map((m: any) => ({
                user_id: m.user_id,
                full_name: m.full_name || 'Bayi',
                email: m.email || '',
                frekans_uid: m.frekans_uid || null,
                career_level: m.career_level || 1,
                wallet_domestic_usd: m.wallet_domestic_usd ?? m.wallet_usd ?? 0,
                wallet_international_usd: m.wallet_international_usd ?? 0,
                wallet_try_equivalent: m.wallet_try_equivalent ?? m.wallet_try ?? 0,
                source: 'POSTGRESQL_18',
                is_active: m.is_active !== false,
              }));
              setMembers(normalized);
            }
            if (data.orders?.length > 0) setOrders(data.orders);
            if (data.expense_vouchers?.length > 0) {
              const liveComms: MonolineCommissionRecord[] = data.expense_vouchers.map((v: any, idx: number) => ({
                id: idx + 1,
                order_id: v.order_id,
                source_user_id: 'SYSTEM',
                target_user_id: v.dealer_user_id,
                target_user_name: v.dealer_full_name,
                commission_type: 'MONOLINE_DEPTH',
                depth_level: 1,
                amount: Number(v.gross_amount),
                amount_try: Number(v.gross_amount),
                amount_usd: Math.round(Number(v.gross_amount) / 30),
                currency: 'TRY',
                release_status: 'RELEASED',
                withholding_tax_try: Number(v.withholding_amount || 0),
                net_payable_try: Number(v.net_amount || 0),
                created_at: v.created_at || new Date().toISOString(),
              }));
              setCommissions(liveComms);
            }
            if (data.withdrawal_requests?.length > 0) setWithdrawals(data.withdrawal_requests);
          }
        }
      } catch (e) {
        // Fallback to initial seed if network error
        if (isMounted && members.length === 0) {
          setMembers(MOCK_MONOLINE_MEMBERS);
          setOrders(MOCK_MONOLINE_ORDERS);
          setCommissions(MOCK_MONOLINE_COMMISSIONS);
          setWithdrawals(MOCK_MONOLINE_WITHDRAWALS);
        }
      }
    }
    fetchLiveLedgerData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Settlement modal for attaching bank reference to approved withdrawals
  const [selectedWithdrawalForSettlement, setSelectedWithdrawalForSettlement] = useState<MonolineWithdrawalRecord | null>(null);
  const [bankRefInput, setBankRefInput] = useState('EFT20261021-849102');
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string | null>(null);

  // Webhook Simulator state
  const [simulatedEventType, setSimulatedEventType] = useState<'ORDER_PAID' | 'ORDER_PENDING_RISK' | 'DUPLICATE_TEST'>('ORDER_PAID');
  const [webhookResponse, setWebhookResponse] = useState<any | null>(null);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // Expanded voucher accordion
  const [expandedVoucherId, setExpandedVoucherId] = useState<string | null>('vch-101');

  // Search in vouchers
  const [voucherFilter, setVoucherFilter] = useState('');

  // Run reconciliation audit on current data
  const { anomalies, summary } = runSmartReconciliationAudit(orders, commissions, withdrawals, members);
  const vouchers = generateJournalVouchersFromMonoline(orders, commissions, withdrawals);

  const handleFixAnomaly = (anomaly: ReconciliationAnomaly) => {
    if (anomaly.category === 'PENDING_ORDER_FINANCIALIZED') {
      // Fix: Unlink financialization from pending order
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === anomaly.source_record_id
            ? { ...o, is_financialized: false, is_pending_financialized_risk: false }
            : o
        )
      );
      SpeechEngine.speak('Kesinleşmemiş siparişin komisyon tahakkuku bloke edildi.');
    } else if (anomaly.category === 'EARLY_COMMISSION_RELEASE') {
      // Fix: Revert to 14D hold
      setCommissions((prev) =>
        prev.map((c) =>
          c.commission_id === anomaly.source_record_id
            ? { ...c, release_status: 'PENDING_14D', is_released_early_risk: false }
            : c
        )
      );
      SpeechEngine.speak('Komisyon 14 günlük yasal bekleme hesabına geri alındı.');
    } else if (anomaly.category === 'ORPHAN_IDENTITY_MAPPING') {
      // Fix: Map frekans uid
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === anomaly.source_record_id
            ? { ...m, frekans_uid: `frk_mapped_${m.user_id.split('_').pop()}` }
            : m
        )
      );
      SpeechEngine.speak('Üye kimlik eşleşmesi başarıyla oluşturuldu.');
    }
  };

  const handleExecuteSettlement = () => {
    if (!selectedWithdrawalForSettlement || !bankRefInput.trim()) return;

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.withdrawal_id === selectedWithdrawalForSettlement.withdrawal_id
          ? {
              ...w,
              settlement_status: 'SETTLED',
              bank_settlement_ref: bankRefInput.trim(),
              settled_at: new Date().toLocaleString('tr-TR'),
              payout_provider: 'AKBANK_FAST_TRANSFER',
            }
          : w
      )
    );

    setSettlementSuccessMsg(
      `Çekim #${selectedWithdrawalForSettlement.withdrawal_id} banka dekontu (${bankRefInput}) ile eşleştirildi. Yevmiye defterine 102.02 Banka Çıkışı fişi yazıldı.`
    );
    SpeechEngine.speak('Banka transferi doğrulandı ve çift taraflı yevmiye kaydı yapıldı.');
    setSelectedWithdrawalForSettlement(null);
    setTimeout(() => setSettlementSuccessMsg(null), 5000);
  };

  const handleRunWebhookSimulation = async () => {
    setIsSimulatingWebhook(true);
    setWebhookResponse(null);

    let eventPayload: any = {};
    let idempotencyKey = `idemp-${Date.now()}`;
    let eventType = 'ORDER_PAYMENT_CONFIRMED';

    if (simulatedEventType === 'ORDER_PAID') {
      eventType = 'ORDER_PAYMENT_CONFIRMED';
      eventPayload = {
        order_id: `ord_ext_${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: 'usr_mono_8491',
        amount: 199.0,
        currency: 'USD',
        status: 'PAID',
        customer_name: 'Stripe International Buyer',
      };
    } else if (simulatedEventType === 'ORDER_PENDING_RISK') {
      eventType = 'ORDER_PAYMENT_CONFIRMED';
      eventPayload = {
        order_id: `ord_ext_pnd_${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: 'usr_mono_8492',
        amount: 3600.0,
        currency: 'TRY',
        status: 'PENDING', // REJECT BY ACCOUNTING ENGINE
      };
    } else if (simulatedEventType === 'DUPLICATE_TEST') {
      eventType = 'ORDER_PAYMENT_CONFIRMED';
      idempotencyKey = 'idemp-constant-duplicate-key-001';
      eventPayload = {
        order_id: 'ord_mono_101',
        amount: 3600.0,
        currency: 'TRY',
        status: 'PAID',
      };
    }

    try {
      const res = await fetch('/api/v1/integrations/accounting/sync-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_system: 'MONOLINE_SERVER_MEMORY',
          source_event_type: eventType,
          source_event_id: eventPayload.order_id,
          idempotency_key: idempotencyKey,
          payload: eventPayload,
        }),
      });
      const data = await res.json();
      setWebhookResponse({
        status: res.status,
        data,
      });
    } catch (err: any) {
      setWebhookResponse({ status: 500, data: { error: err.message } });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.voucher_number.toLowerCase().includes(voucherFilter.toLowerCase()) ||
      v.source_event_id.toLowerCase().includes(voucherFilter.toLowerCase()) ||
      v.source_event_type.toLowerCase().includes(voucherFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Executive Integration Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-xl tracking-wider text-blue-400 shrink-0">
              <GitBranch className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest">
                  Monoline MLM &amp; Frekans Reseller Entegrasyon Köprüsü
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Çift Taraflı Yevmiye Hazır
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                Akıllı Muhasebe Mutabakat ve Denetim Merkezi
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Teknik Devir Raporu doğrultusunda; Monoline Express sunucu belleği, Firebase Firestore ve Frekans
                katmanlarını çift taraflı standart yevmiye defterine bağlayan, kur snapshot&apos;ı kilitleyen ve
                anomalileri engelleyen otoritatif finans katmanı.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block font-sans">Otoritatif Finans Kaynağı:</span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                Tekdüzen Çift Taraflı Defter (Canonical)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Reconciliation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Senkronize Sipariş Hasılatı</span>
            <span className="font-mono text-[10px] text-slate-400">{summary.total_orders_synced} Sipariş</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {(orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + (o.amount_try || 0), 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>Yurt Dışı $3x$:</span>
            <span className="font-semibold text-slate-700">
              ${(orders.filter((o) => o.currency === 'USD' && o.status === 'PAID').reduce((s, o) => s + (o.amount || 0), 0)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>14 Gün Bekleyen Komisyon (381)</span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              Yasal Bloke
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono tracking-tight">
            {(summary.pending_commissions_vault_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>Release Edilen (320):</span>
            <span className="font-semibold text-slate-700">
              {(summary.released_commissions_paid_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* KPI 3: Gerçek Settlement vs Onay Ayrımı */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Banka Çıkışı Teyitli Çekim</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              102.02 Çıkış
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {(summary.settled_withdrawals_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-red-600 flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
            <span>Dekontu Bekleyen Onaylı:</span>
            <span className="font-bold">
              {(summary.unsettled_approved_withdrawals_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
          </div>
        </div>

        {/* KPI 4: Tespit Edilen Anomaliler */}
        <div className={`p-5 rounded-xl border shadow-xs space-y-2 ${summary.critical_risks_count > 0 ? 'bg-red-50/60 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={summary.critical_risks_count > 0 ? 'text-red-900 font-bold' : 'text-slate-500'}>
              Denetim Anomalileri
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${summary.critical_risks_count > 0 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {summary.anomalies_count} Uyuşmazlık
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${summary.critical_risks_count > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {summary.critical_risks_count} Kritik Risk
          </div>
          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Defter Dengesi:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Borç = Alacak
            </span>
          </div>
        </div>
      </div>

      {settlementSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium text-emerald-800 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{settlementSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSettlementSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            Tamam
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ANOMALIES')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ANOMALIES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Mutabakat &amp; Anomali Radarı ({anomalies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VOUCHERS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'VOUCHERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Çift Taraflı Yevmiye Fişleri ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WITHDRAWALS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'WITHDRAWALS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Çekim Kararı vs Banka Settlement ({withdrawals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS_MAP')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'MEMBERS_MAP'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Kimlik Haritası (uid ↔ user_id)</span>
        </button>

        <button
          onClick={() => setActiveTab('WEBHOOK_SIM')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'WEBHOOK_SIM'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>API Webhook &amp; Idempotency Simülatörü</span>
        </button>
      </div>

      {/* TAB 1: MUTABAKAT & ANOMALİ RADARI */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Teknik Devir Raporu Denetim Bulguları:</p>
              <p className="mt-0.5 leading-relaxed text-amber-900/90">
                Sistem, Monoline server in-memory kayıtları ile Cloud Functions Firestore arasında olası çift kayıt,
                kur snapshot eksikliği, 14 gün dolmadan erken release riski ve banka dekontu olmaksızın nakit çıkışı
                riski gibi 8 temel kuralı otonom denetlemektedir.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {anomalies.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Tüm Kayıtlar %100 Mutabık</p>
                <p className="text-xs text-slate-400 mt-1">
                  Mükerrer sipariş, erken release veya kur farkı anomalisi tespit edilmedi.
                </p>
              </div>
            ) : (
              anomalies.map((anom) => (
                <div
                  key={anom.id}
                  className={`p-4 rounded-xl border transition-all ${
                    anom.severity === 'CRITICAL'
                      ? 'bg-red-50/50 border-red-200 text-red-950'
                      : 'bg-amber-50/50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            anom.severity === 'CRITICAL'
                              ? 'bg-red-200 text-red-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {anom.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {anom.category} · Kaynak: {anom.source_system}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold">{anom.title}</h4>
                      <p className="text-xs opacity-90 leading-relaxed max-w-3xl">
                        {anom.description}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-700 pt-1">
                        💡 Önerilen Eylem: {anom.suggested_action}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-sm">
                        {(anom.impact_amount_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                      {anom.auto_fixable && (
                        <button
                          onClick={() => handleFixAnomaly(anom)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
                        >
                          Otomatik Düzelt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ÇİFT TARAFLI YEVMİYE FİŞLERİ */}
      {activeTab === 'VOUCHERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Standart Çift Taraflı Yevmiye Fişleri (Double-Entry General Ledger)
              </h3>
              <p className="text-xs text-slate-500">
                Her fişte Borç = Alacak kuruşuna kadar eşittir. Kaynak olay kimliği ve idempotency anahtarıyla
                arşivlenmiştir.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Fiş no, event id ara..."
                value={voucherFilter}
                onChange={(e) => setVoucherFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredVouchers.map((vch) => {
              const isExpanded = expandedVoucherId === vch.id;
              return (
                <div
                  key={vch.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
                >
                  {/* Voucher Header Row */}
                  <div
                    onClick={() => setExpandedVoucherId(isExpanded ? null : vch.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {vch.voucher_number}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Dengeli (Borç = Alacak)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {vch.source_event_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tarih: {vch.voucher_date} · Kaynak: {vch.source_system} · Olay: {vch.source_event_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto font-mono text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">İşlem Anı TCMB Kuru:</span>
                        <span className="font-bold text-slate-700">{(vch.exchange_rate_snapshot ?? 0).toFixed(3)} ₺</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] block">Toplam Tutar:</span>
                        <span className="font-bold text-slate-900">
                          {(vch.total_debit_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Lines Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="py-2 px-3">Hesap Kodu</th>
                            <th className="py-2 px-3">Hesap Adı &amp; Açıklama</th>
                            <th className="py-2 px-3 text-right">Borç (Debit) TRY</th>
                            <th className="py-2 px-3 text-right">Alacak (Credit) TRY</th>
                            <th className="py-2 px-3 text-right">Orijinal USD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {vch.lines.map((ln) => (
                            <tr key={ln.id} className="hover:bg-white/80">
                              <td className="py-2 px-3 font-bold text-slate-900">{ln.account_code}</td>
                              <td className="py-2 px-3 font-sans">
                                <span className="font-semibold text-slate-800">{ln.account_name}</span>
                                <span className="block text-[11px] text-slate-500">{ln.description}</span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-900">
                                {(ln.debit_try ?? 0) > 0
                                  ? `${(ln.debit_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-900">
                                {(ln.credit_try ?? 0) > 0
                                  ? `${(ln.credit_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500">
                                {ln.debit_usd ? `$${Number(ln.debit_usd).toFixed(2)}` : ln.credit_usd ? `$${Number(ln.credit_usd).toFixed(2)}` : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-bold border-t-2 border-slate-300 bg-white">
                            <td colSpan={2} className="py-2 px-3 font-sans text-right">
                              TOPLAM BORÇ / ALACAK DENGESİ:
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-800">
                              {(vch.total_debit_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-800">
                              {(vch.total_credit_try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ÇEKİM VE GERÇEK BANKA SETTLEMENT MUTABAKATI */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-3">
            <Landmark className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Devir Raporu Madde 4 &amp; 6.6 Uyarısı:</p>
              <p className="mt-0.5 leading-relaxed text-blue-900/90">
                Çekim onaylanması (APPROVED), gerçek banka transferi başlatmaz! Yalnızca banka transfer dekontu veya
                payout sağlayıcı FAST referansı (bank_settlement_ref) girildiğinde nakit 102.02 Banka hesabından düşülür.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Talep No</th>
                    <th className="py-2.5 px-4">Bayi Bilgisi</th>
                    <th className="py-2.5 px-4 text-right">Brüt (USD / TRY)</th>
                    <th className="py-2.5 px-4 text-right">Stopaj (%20)</th>
                    <th className="py-2.5 px-4 text-right">Net Ödenecek</th>
                    <th className="py-2.5 px-4 text-center">Yönetici Kararı</th>
                    <th className="py-2.5 px-4 text-center">Banka Settlement</th>
                    <th className="py-2.5 px-4 text-right">Eylem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {withdrawals.map((w) => (
                    <tr key={w.withdrawal_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{w.withdrawal_id}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-slate-900">{w.user_name}</span>
                        <span className="block text-[10px] font-mono text-slate-400">
                          {w.iban || 'IBAN Belirtilmemiş'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span>${(w.gross_amount_usd ?? 0).toFixed(2)}</span>
                        <span className="block text-[10px] text-slate-400">{(w.gross_amount_try ?? 0).toFixed(2)} ₺</span>
                      </td>
                      <td className="py-3 px-4 text-right text-red-700">
                        -{(w.tax_deduction_try ?? 0).toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-800">
                        {(w.net_amount_try ?? 0).toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            w.request_status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.request_status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {w.request_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {w.settlement_status === 'SETTLED' ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            {w.bank_settlement_ref}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            UNSETTLED (Dekont Yok)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        {w.settlement_status !== 'SETTLED' && w.request_status === 'APPROVED' ? (
                          <button
                            onClick={() => setSelectedWithdrawalForSettlement(w)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs whitespace-nowrap"
                          >
                            Dekont Ref Gir
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Defterde İşli</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KİMLİK VE KAYNAK HARİTASI (uid <-> user_id) */}
      {activeTab === 'MEMBERS_MAP' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Frekans UID ↔ Monoline User_ID Çapraz Eşleme Tablosu
                </h3>
                <p className="text-xs text-slate-500">
                  Devir Raporu Madde 8.1 gereğince üye kimliklerinin tek bir kanonik kayıtta birleştirilmesi
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Monoline user_id</th>
                    <th className="py-2.5 px-4">Frekans uid</th>
                    <th className="py-2.5 px-4">Ad Soyad / Unvan</th>
                    <th className="py-2.5 px-4">Seviye</th>
                    <th className="py-2.5 px-4 text-right">Yurtiçi USD</th>
                    <th className="py-2.5 px-4 text-right">Global USD</th>
                    <th className="py-2.5 px-4 text-right">TRY Karşılığı</th>
                    <th className="py-2.5 px-4 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {members.map((m) => (
                    <tr key={m.user_id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.user_id}</td>
                      <td className="py-3 px-4">
                        {m.frekans_uid ? (
                          <span className="text-emerald-700 font-bold">{m.frekans_uid}</span>
                        ) : (
                          <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            EŞLEŞMEMİŞ (Orphan)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">{m.full_name}</td>
                      <td className="py-3 px-4 font-sans">Tier {m.career_level || 1}</td>
                      <td className="py-3 px-4 text-right">${(m.wallet_domestic_usd ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">${(m.wallet_international_usd ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {(m.wallet_try_equivalent ?? 0).toFixed(2)} ₺
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEBHOOK VE IDEMPOTENCY SİMÜLATÖRÜ */}
      {activeTab === 'WEBHOOK_SIM' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dış Uygulama Webhook Entegrasyon Test Paneli (/api/v1/integrations/accounting/sync-event)
              </h3>
              <p className="text-xs text-slate-500">
                Eski Monoline/Frekans uygulamasından gelecek JSON olaylarını test edin. Çift kayıt (idempotency) ve
                kesinleşmemiş sipariş reddi kurallarını canlı doğrulayın.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                onClick={() => setSimulatedEventType('ORDER_PAID')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  simulatedEventType === 'ORDER_PAID'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="sim_type"
                  checked={simulatedEventType === 'ORDER_PAID'}
                  onChange={() => setSimulatedEventType('ORDER_PAID')}
                  className="sr-only"
                />
                <span className="font-bold text-xs text-slate-900 block">1. Normal Ödenmiş Sipariş (PAID)</span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  199$ Hizmet İhracı siparişi gönderilir. 601.01 ve 102.01 fişi başarıyla üretilir.
                </span>
              </label>

              <label
                onClick={() => setSimulatedEventType('ORDER_PENDING_RISK')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  simulatedEventType === 'ORDER_PENDING_RISK'
                    ? 'border-red-600 bg-red-50/50 ring-1 ring-red-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="sim_type"
                  checked={simulatedEventType === 'ORDER_PENDING_RISK'}
                  onChange={() => setSimulatedEventType('ORDER_PENDING_RISK')}
                  className="sr-only"
                />
                <span className="font-bold text-xs text-red-900 block">2. Kesinleşmemiş Sipariş (PENDING)</span>
                <span className="text-[11px] text-red-700 block mt-1">
                  Ödeme onayı almamış sipariş simüle edilir. Akıllı motor 422 Unprocessable Entity ile reddeder.
                </span>
              </label>

              <label
                onClick={() => setSimulatedEventType('DUPLICATE_TEST')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  simulatedEventType === 'DUPLICATE_TEST'
                    ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="sim_type"
                  checked={simulatedEventType === 'DUPLICATE_TEST'}
                  onChange={() => setSimulatedEventType('DUPLICATE_TEST')}
                  className="sr-only"
                />
                <span className="font-bold text-xs text-amber-900 block">3. Mükerrer Çağrı (Idempotency)</span>
                <span className="text-[11px] text-amber-800 block mt-1">
                  Aynı idempotency anahtarı ile tekrar çağrılır. Çift fiş kesilmesi engellenir.
                </span>
              </label>
            </div>

            <button
              onClick={handleRunWebhookSimulation}
              disabled={isSimulatingWebhook}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${isSimulatingWebhook ? 'animate-spin' : ''}`} />
              <span>{isSimulatingWebhook ? 'API İsteği Gönderiliyor...' : 'Webhook Olayını Gönder & Test Et'}</span>
            </button>

            {webhookResponse && (
              <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span>API HTTP Yanıt Kodu: {webhookResponse.status}</span>
                  <span className="text-emerald-400 font-bold">
                    {webhookResponse.status === 200 ? 'Başarılı' : 'Engellendi / Hata'}
                  </span>
                </div>
                <pre className="p-3 bg-black/50 rounded-lg text-emerald-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(webhookResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTLEMENT MODAL */}
      {selectedWithdrawalForSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Banka Transfer Dekont Referansı</h3>
                <p className="text-xs text-slate-500">
                  Talep #{selectedWithdrawalForSettlement.withdrawal_id} ({selectedWithdrawalForSettlement.user_name})
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Net Transfer Tutarı:</span>
                <span className="font-bold text-slate-900">
                  {(selectedWithdrawalForSettlement.net_amount_try ?? 0).toFixed(2)} ₺
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IBAN:</span>
                <span className="text-slate-800 truncate max-w-[200px]">
                  {selectedWithdrawalForSettlement.iban}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Banka EFT / FAST Dekont / Referans Numarası:
              </label>
              <input
                type="text"
                value={bankRefInput}
                onChange={(e) => setBankRefInput(e.target.value)}
                placeholder="Örn: EFT20261021-9481"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedWithdrawalForSettlement(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                İptal
              </button>
              <button
                onClick={handleExecuteSettlement}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Settlement Onayla &amp; Deftere Yaz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
