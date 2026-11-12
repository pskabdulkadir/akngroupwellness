import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  ShieldCheck,
  Zap,
  GitBranch,
  ArrowRight,
  DollarSign,
  Sparkles,
  Info,
  Save,
  Layers,
  Percent,
  TrendingUp,
} from 'lucide-react';
import { SystemDistributionParameters } from '../types/monoline';
import { BUSINESS_RULES } from '../config/businessRules';
import { getAdminToken } from '../utils/adminSession';

interface CommissionEngineSettingsViewProps {
  distributionParams?: SystemDistributionParameters;
  onRefreshState?: () => Promise<void>;
}

export const CommissionEngineSettingsView: React.FC<CommissionEngineSettingsViewProps> = ({
  distributionParams,
  onRefreshState,
}) => {
  // State for editable business rules arrays
  const [unilevelPercentages, setUnilevelPercentages] = useState<number[]>(() => [
    ...(distributionParams?.unilevel_depth_percentages || BUSINESS_RULES.UNILEVEL_DEPTH_PERCENTAGES),
  ]);
  const [monolinePercentages, setMonolinePercentages] = useState<number[]>(() => [
    ...(distributionParams?.monoline_incentive_percentages || BUSINESS_RULES.MONOLINE_INCENTIVE_PERCENTAGES),
  ]);
  const [directSponsorPercent, setDirectSponsorPercent] = useState<number>(
    typeof distributionParams?.direct_sponsor_percent === 'number'
      ? distributionParams.direct_sponsor_percent
      : BUSINESS_RULES.DIRECT_SPONSOR_BONUS_PERCENT
  );
  const [systemFundPercent, setSystemFundPercent] = useState<number>(
    typeof distributionParams?.system_fund_percent === 'number'
      ? distributionParams.system_fund_percent
      : BUSINESS_RULES.SYSTEM_FUND_PERCENT
  );
  const [clawbackDays, setClawbackDays] = useState<number>(
    BUSINESS_RULES.CLAWBACK_PROTECTION_DAYS
  );
  const [maxSingleLegPercent, setMaxSingleLegPercent] = useState<number>(
    BUSINESS_RULES.MAX_SINGLE_LEG_PERCENT
  );

  // Sync state if props change
  useEffect(() => {
    if (distributionParams?.unilevel_depth_percentages?.length === 7) {
      setUnilevelPercentages([...distributionParams.unilevel_depth_percentages]);
    }
    if (distributionParams?.monoline_incentive_percentages?.length === 7) {
      setMonolinePercentages([...distributionParams.monoline_incentive_percentages]);
    }
    if (typeof distributionParams?.direct_sponsor_percent === 'number') {
      setDirectSponsorPercent(distributionParams.direct_sponsor_percent);
    }
    if (typeof distributionParams?.system_fund_percent === 'number') {
      setSystemFundPercent(distributionParams.system_fund_percent);
    }
  }, [distributionParams]);

  // UI status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // Real-time Simulation Calculator State
  const [simAmount, setSimAmount] = useState<number>(1000);

  // Real-time Sums & Calculations
  const unilevelSum = useMemo(() => {
    return unilevelPercentages.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [unilevelPercentages]);

  const monolineSum = useMemo(() => {
    return monolinePercentages.reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [monolinePercentages]);

  const totalDistributedPercent = useMemo(() => {
    return Number(directSponsorPercent) + unilevelSum + monolineSum + Number(systemFundPercent);
  }, [directSponsorPercent, unilevelSum, monolineSum, systemFundPercent]);

  const companyGrossMarginPercent = useMemo(() => {
    return Math.max(0, 100 - totalDistributedPercent);
  }, [totalDistributedPercent]);

  // Simulation metrics for simAmount
  const simDirectSponsor = useMemo(() => (simAmount * Number(directSponsorPercent)) / 100, [simAmount, directSponsorPercent]);
  const simUnilevelTotal = useMemo(() => (simAmount * unilevelSum) / 100, [simAmount, unilevelSum]);
  const simMonolineTotal = useMemo(() => (simAmount * monolineSum) / 100, [simAmount, monolineSum]);
  const simSystemFund = useMemo(() => (simAmount * Number(systemFundPercent)) / 100, [simAmount, systemFundPercent]);
  const simTotalDistributed = useMemo(() => (simAmount * totalDistributedPercent) / 100, [simAmount, totalDistributedPercent]);
  const simCompanyMargin = useMemo(() => simAmount - simTotalDistributed, [simAmount, simTotalDistributed]);

  // Career details for depths
  const depthTiers = [
    { depth: 1, name: '1. Derinlik (Direkt Sponsor)', defaultVal: 7, tierReq: 'Emmâre (Min Kademe 1)' },
    { depth: 2, name: '2. Derinlik (2. Üst Nesil)', defaultVal: 5, tierReq: 'Levvâme (Min Kademe 2)' },
    { depth: 3, name: '3. Derinlik (3. Üst Nesil)', defaultVal: 4, tierReq: 'Mülhime (Min Kademe 3)' },
    { depth: 4, name: '4. Derinlik (4. Üst Nesil)', defaultVal: 3, tierReq: 'Mutmainne (Min Kademe 4)' },
    { depth: 5, name: '5. Derinlik (5. Üst Nesil)', defaultVal: 2, tierReq: 'Râziye (Min Kademe 5)' },
    { depth: 6, name: '6. Derinlik (6. Üst Nesil)', defaultVal: 2, tierReq: 'Marziyye (Min Kademe 6)' },
    { depth: 7, name: '7. Derinlik (7. Üst Nesil)', defaultVal: 2, tierReq: 'Kâmile (Min Kademe 7)' },
  ];

  const monolineTiers = [
    { rank: 1, name: '1. Üst Sıra (Derinlik 1)', defaultVal: 1.50, desc: 'Doğrudan üstündeki ilk global üye' },
    { rank: 2, name: '2. Üst Sıra (Derinlik 2)', defaultVal: 1.00, desc: '2. sıradaki global üst üye' },
    { rank: 3, name: '3. Üst Sıra (Derinlik 3)', defaultVal: 0.80, desc: '3. sıradaki global üst üye' },
    { rank: 4, name: '4. Üst Sıra (Derinlik 4)', defaultVal: 0.60, desc: '4. sıradaki global üst üye' },
    { rank: 5, name: '5. Üst Sıra (Derinlik 5)', defaultVal: 0.50, desc: '5. sıradaki global üst üye' },
    { rank: 6, name: '6. Üst Sıra (Derinlik 6)', defaultVal: 0.30, desc: '6. sıradaki global üst üye' },
    { rank: 7, name: '7. Üst Sıra (Derinlik 7)', defaultVal: 0.30, desc: '7. sıradaki global üst üye' },
  ];

  // Reset to default constants
  const handleResetToDefaults = () => {
    setUnilevelPercentages([7, 5, 4, 3, 2, 2, 2]);
    setMonolinePercentages([1.50, 1.00, 0.80, 0.60, 0.50, 0.30, 0.30]);
    setDirectSponsorPercent(20);
    setSystemFundPercent(5);
    setClawbackDays(14);
    setMaxSingleLegPercent(50);
    setStatusMessage({
      type: 'info',
      text: 'Standart fabrika oranları yüklendi. İş mantığına yansıtmak için "Değişiklikleri Canlı Kaydet" butonuna tıklayınız.',
    });
  };

  // Fetch live rules from server
  const handleFetchLiveRules = async () => {
    setIsFetching(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/v1/config/business-rules');
      const data = await res.json();
      if (res.ok && data?.business_rules) {
        const br = data.business_rules;
        if (Array.isArray(br.UNILEVEL_DEPTH_PERCENTAGES)) {
          setUnilevelPercentages([...br.UNILEVEL_DEPTH_PERCENTAGES]);
        }
        if (Array.isArray(br.MONOLINE_INCENTIVE_PERCENTAGES)) {
          setMonolinePercentages([...br.MONOLINE_INCENTIVE_PERCENTAGES]);
        }
        if (typeof br.DIRECT_SPONSOR_BONUS_PERCENT === 'number') {
          setDirectSponsorPercent(br.DIRECT_SPONSOR_BONUS_PERCENT);
        }
        if (typeof br.SYSTEM_FUND_PERCENT === 'number') {
          setSystemFundPercent(br.SYSTEM_FUND_PERCENT);
        }
        if (typeof br.CLAWBACK_PROTECTION_DAYS === 'number') {
          setClawbackDays(br.CLAWBACK_PROTECTION_DAYS);
        }
        if (typeof br.MAX_SINGLE_LEG_PERCENT === 'number') {
          setMaxSingleLegPercent(br.MAX_SINGLE_LEG_PERCENT);
        }
        setStatusMessage({
          type: 'success',
          text: 'Sunucudaki aktif iş mantığı oranları başarıyla arayüze çekildi.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Canlı oranlar çekilemedi.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Sunucuya bağlanırken bir hata oluştu.',
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Save changes in real-time to backend
  const handleSaveBusinessRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const token = getAdminToken() || '';

    try {
      const payload = {
        UNILEVEL_DEPTH_PERCENTAGES: unilevelPercentages.map(Number),
        MONOLINE_INCENTIVE_PERCENTAGES: monolinePercentages.map(Number),
        DIRECT_SPONSOR_BONUS_PERCENT: Number(directSponsorPercent),
        SYSTEM_FUND_PERCENT: Number(systemFundPercent),
        CLAWBACK_PROTECTION_DAYS: Number(clawbackDays),
        MAX_SINGLE_LEG_PERCENT: Number(maxSingleLegPercent),
      };

      const res = await fetch('/api/v1/admin/business-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.status === 'success' || data.status === 'ok')) {
        setStatusMessage({
          type: 'success',
          text: '✓ Çift Motorlu Hibrit Komisyon kuralları başarıyla kaydedildi! Arka plandaki hesaplama motoruna (business logic) anında yansıtıldı.',
        });
        if (onRefreshState) {
          await onRefreshState();
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: data?.message || 'Güncelleme yetkisi doğrulanamadı veya bir hata oluştu.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Sunucu iletişim hatası oluştu.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-2 border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>ÇİFT MOTORLU HİBRİT KOMİSYON MOTORU (V2.2 HYBRID ARCHITECTURE)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Sliders className="w-8 h-8 text-indigo-400 shrink-0" />
              <span>Commission Engine Settings</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Sistemde sipariş veya paket alımı gerçekleştiğinde (<code className="text-indigo-300 font-mono text-xs bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">POST /api/v1/orders/process</code>), 
              arka plandaki hesaplama motoru <strong className="text-white">Motor 1</strong> (Unilevel 7 Derinlik Ekip Cirosu) ve{' '}
              <strong className="text-white">Motor 2</strong> (Küresel Monoline 7 Üst Sıra Teşviki) hatlarını eşzamanlı çalıştırır. 
              Aşağıdaki panellerden oranları düzenleyebilir, canlı simülasyonu anlık test edebilir ve tek tıkla iş mantığına (business logic) aktarabilirsiniz.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleFetchLiveRules}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Yenileniyor...' : 'Canlı Çek'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Varsayılanlar</span>
            </button>
            <button
              type="button"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer font-mono"
            >
              <span>{showJsonPreview ? '{ } Gizle' : '{ } JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveBusinessRules()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50 active:scale-95 border border-emerald-400/40"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>İş Mantığına Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>Değişiklikleri Canlı Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`mt-5 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 text-rose-200 border-rose-500/50'
                : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-indigo-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* JSON Preview Drawer */}
        {showJsonPreview && (
          <div className="mt-5 p-4 rounded-2xl bg-black/70 border border-slate-700 font-mono text-xs text-emerald-300 overflow-x-auto space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Canlı JSON Payload (PUT /api/v1/admin/business-rules)
            </div>
            <pre>
              {JSON.stringify(
                {
                  UNILEVEL_DEPTH_PERCENTAGES: unilevelPercentages.map(Number),
                  MONOLINE_INCENTIVE_PERCENTAGES: monolinePercentages.map(Number),
                  DIRECT_SPONSOR_BONUS_PERCENT: Number(directSponsorPercent),
                  SYSTEM_FUND_PERCENT: Number(systemFundPercent),
                  CLAWBACK_PROTECTION_DAYS: Number(clawbackDays),
                  MAX_SINGLE_LEG_PERCENT: Number(maxSingleLegPercent),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Real-time KPI Metric Strip (7 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-indigo-900/30 border border-indigo-500/30 space-y-1">
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
            Motor 1 (Unilevel)
          </div>
          <div className="text-xl font-black text-indigo-200">
            %{unilevelSum.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">Hedef: %25.0 · 7 Derinlik</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/50 to-teal-900/30 border border-teal-500/30 space-y-1">
          <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
            Motor 2 (Monoline)
          </div>
          <div className="text-xl font-black text-teal-200">
            %{monolineSum.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">Hedef: %5.00 · 7 Üst Sıra</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/50 to-amber-900/30 border border-amber-500/30 space-y-1">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            Direkt Satış Primi
          </div>
          <div className="text-xl font-black text-amber-200">
            %{Number(directSponsorPercent).toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">1. Sponsor Primi</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/50 to-blue-900/30 border border-blue-500/30 space-y-1">
          <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
            Sistem Fonu
          </div>
          <div className="text-xl font-black text-blue-200">
            %{Number(systemFundPercent).toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">Genel Havuz Rezervi</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 to-purple-900/30 border border-purple-500/30 space-y-1">
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            Toplam Prim Dağıtımı
          </div>
          <div className="text-xl font-black text-purple-200">
            %{totalDistributedPercent.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-400">Maks Hak Ediş</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            Cayma Koruması
          </div>
          <div className="text-xl font-black text-emerald-200">
            {clawbackDays} Gün
          </div>
          <div className="text-[10px] text-slate-400">Bekleyen Bakiye</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/50 to-rose-900/30 border border-rose-500/30 space-y-1">
          <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
            Tek Kol Katkı Sınırı
          </div>
          <div className="text-xl font-black text-rose-200">
            %{maxSingleLegPercent}
          </div>
          <div className="text-[10px] text-slate-400">Kademe 4+ Kuralı</div>
        </div>
      </div>

      {/* Side-by-Side Dual-Engine Interactive Editors */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* MOTOR 1: UNILEVEL 7 DEPTHS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                <span>MOTOR 1 · UNILEVEL_DEPTH_PERCENTAGES</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Sponsorlu Derinlik Motoru (Unilevel 7 Derinlik)
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Toplam Unilevel</div>
              <div className={`text-xl font-black font-mono ${Math.abs(unilevelSum - 25) < 0.01 ? 'text-indigo-600' : 'text-amber-600'}`}>
                %{unilevelSum.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <div className="font-bold">Söylem &amp; Dağıtım Mantığı:</div>
            <div className="italic text-slate-700">
              "Kendi ekibinizi kurun, dikeyde 7 derinliğe kadar oluşan tüm cirodan %25'e varan pay alın! Ne kadar geniş hat açarsanız kazancınız o kadar katlanır."
            </div>
            <div className="text-[11px] text-slate-600 pt-1">
              • Sipariş veren üyenin <code className="font-mono text-indigo-800">sponsor_id</code> ilişkisi takip edilerek yukarı 7 basamak taranır. 8. basamak ve sonrasına prim aktarılmaz (tarama durdurulur).
            </div>
          </div>

          {/* 7 Depths Interactive Sliders & Inputs */}
          <div className="space-y-4">
            {depthTiers.map((item, idx) => {
              const currentVal = unilevelPercentages[idx] ?? 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold font-mono flex items-center justify-center text-xs">
                        {item.depth}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[11px] text-slate-600 block">{item.tierReq}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-mono">Oran:</span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={currentVal}
                          onChange={(e) => {
                            const copy = [...unilevelPercentages];
                            copy[idx] = parseFloat(e.target.value) || 0;
                            setUnilevelPercentages(copy);
                          }}
                          className="w-20 px-2.5 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg text-right pr-6 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <span className="absolute right-2 text-slate-600 text-xs font-bold font-mono">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Range Slider for real-time adjustments */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={currentVal}
                      onChange={(e) => {
                        const copy = [...unilevelPercentages];
                        copy[idx] = parseFloat(e.target.value) || 0;
                        setUnilevelPercentages(copy);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="w-16 text-right font-mono text-xs font-bold text-indigo-700 shrink-0">
                      %{currentVal.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Standart Unilevel Toplamı: %25.0</span>
            <span className="font-bold text-indigo-600">
              Mevcut Giriş: %{unilevelSum.toFixed(1)}
            </span>
          </div>
        </div>

        {/* MOTOR 2: MONOLINE INCENTIVE 7 RANKS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>MOTOR 2 · MONOLINE_INCENTIVE_PERCENTAGES</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Küresel Monoline Motoru (Sıra Teşvik Primi)
              </h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Toplam Monoline</div>
              <div className={`text-xl font-black font-mono ${Math.abs(monolineSum - 5) < 0.01 ? 'text-teal-600' : 'text-amber-600'}`}>
                %{monolineSum.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900 space-y-1">
            <div className="font-bold">Söylem &amp; Dağıtım Mantığı:</div>
            <div className="italic text-slate-700">
              "Sisteme erken dahil olmanın avantajını yaşayın! Arkanızdan gelen küresel sıranın ilk 7 derinliğinden %5'lik havuzdan sembolik teşvik primi kazanın."
            </div>
            <div className="text-[11px] text-slate-600 pt-1">
              • Sipariş veren üyenin <code className="font-mono text-teal-800">global_line_id</code> değerinden küçük olan ilk 7 üye büyükten küçüğe sıralanarak taranır. Aktif/uygun üye bulunamazsa kalan tutar <code className="font-mono text-teal-800">POOL_TRANSFER_NO_UPLINE</code> ile sisteme aktarılır.
            </div>
          </div>

          {/* 7 Upper Ranks Interactive Sliders & Inputs */}
          <div className="space-y-4">
            {monolineTiers.map((item, idx) => {
              const currentVal = monolinePercentages[idx] ?? 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-300 transition-colors bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold font-mono flex items-center justify-center text-xs">
                        {item.rank}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="text-[11px] text-slate-600 block">{item.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-mono">Oran:</span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="20"
                          value={currentVal}
                          onChange={(e) => {
                            const copy = [...monolinePercentages];
                            copy[idx] = parseFloat(e.target.value) || 0;
                            setMonolinePercentages(copy);
                          }}
                          className="w-20 px-2.5 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg text-right pr-6 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                        <span className="absolute right-2 text-slate-600 text-xs font-bold font-mono">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Range Slider for real-time adjustments */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.05"
                      value={currentVal}
                      onChange={(e) => {
                        const copy = [...monolinePercentages];
                        copy[idx] = parseFloat(e.target.value) || 0;
                        setMonolinePercentages(copy);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="w-16 text-right font-mono text-xs font-bold text-teal-700 shrink-0">
                      %{currentVal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Standart Monoline Toplamı: %5.00</span>
            <span className="font-bold text-teal-600">
              Mevcut Giriş: %{monolineSum.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Global Business Parameters Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Genel Sistem Parametreleri &amp; Korumalı Kurallar
            </h3>
            <p className="text-xs text-slate-500">
              Sponsorluk primi, genel havuz oranı, cayma koruması süresi ve kol dengesi kısıtları
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            config/businessRules.ts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Direkt Sponsor Satış Primi (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={directSponsorPercent}
                onChange={(e) => setDirectSponsorPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl pr-8 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-600">%</span>
            </div>
            <span className="text-[11px] text-slate-600 block">Varsayılan: %20 Satış Primi</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Sistem Fonu / Rezerv (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={systemFundPercent}
                onChange={(e) => setSystemFundPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl pr-8 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-600">%</span>
            </div>
            <span className="text-[11px] text-slate-600 block">Varsayılan: %5 Havuz Rezervi</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Cayma Koruması Süresi (Gün)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                max="90"
                value={clawbackDays}
                onChange={(e) => setClawbackDays(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl pr-12 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-600">Gün</span>
            </div>
            <span className="text-[11px] text-slate-600 block">Varsayılan: 14 Günlük Korumalı Bakiye</span>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Maksimum Tek Kol Katkı Sınırı (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                value={maxSingleLegPercent}
                onChange={(e) => setMaxSingleLegPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-300 rounded-xl pr-8 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-600">%</span>
            </div>
            <span className="text-[11px] text-slate-600 block">Kademe 4+ için Max %50 Kuralı</span>
          </div>
        </div>
      </div>

      {/* Real-time Live Simulation Calculator */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl border-2 border-indigo-500/40 p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>CANLI KOMİSYON SİMÜLASYONU &amp; DAĞITIM DÖKÜMÜ</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Anlık Sipariş Tutarına Göre Prim Dağıtım Hesaplayıcısı
            </h3>
            <p className="text-xs text-slate-300">
              Yukarıdaki oranları değiştirdikçe, aşağıdaki dağıtım tutarları eşzamanlı olarak yeniden hesaplanır.
            </p>
          </div>

          {/* Simulation Order Amount Picker */}
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-slate-300 pl-2">Sipariş Tutarı:</span>
            <div className="relative">
              <input
                type="number"
                step="50"
                min="10"
                max="50000"
                value={simAmount}
                onChange={(e) => setSimAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-28 px-3 py-1.5 text-sm font-black font-mono bg-black/50 border border-indigo-400/40 rounded-xl text-amber-300 text-right pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="absolute right-2 top-2 text-xs font-bold text-slate-400 font-mono">$</span>
            </div>
            <div className="flex items-center gap-1">
              {[100, 500, 1000, 2500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSimAmount(preset)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    simAmount === preset
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked Visual Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              Toplam Ciro Paylaşımı: <strong className="text-white">${simAmount.toLocaleString()}</strong>
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              Dağıtılan Prim: %{totalDistributedPercent.toFixed(1)} (${simTotalDistributed.toFixed(2)}) · Şirket Kalanı: %{companyGrossMarginPercent.toFixed(1)} (${simCompanyMargin.toFixed(2)})
            </span>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${Math.min(100, directSponsorPercent)}%` }}
              title={`Direkt Sponsor: %${directSponsorPercent}`}
              className="bg-amber-500 h-full transition-all duration-300"
            />
            <div
              style={{ width: `${Math.min(100, unilevelSum)}%` }}
              title={`Motor 1 Unilevel: %${unilevelSum}`}
              className="bg-indigo-500 h-full transition-all duration-300"
            />
            <div
              style={{ width: `${Math.min(100, monolineSum)}%` }}
              title={`Motor 2 Monoline: %${monolineSum}`}
              className="bg-teal-400 h-full transition-all duration-300"
            />
            <div
              style={{ width: `${Math.min(100, systemFundPercent)}%` }}
              title={`Sistem Fonu: %${systemFundPercent}`}
              className="bg-blue-500 h-full transition-all duration-300"
            />
            <div
              style={{ width: `${Math.max(0, companyGrossMarginPercent)}%` }}
              title={`Şirket Marjı: %${companyGrossMarginPercent}`}
              className="bg-slate-700 h-full transition-all duration-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>Direkt Sponsor (%{directSponsorPercent})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
              <span>Motor 1 Unilevel (%{unilevelSum.toFixed(1)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
              <span>Motor 2 Monoline (%{monolineSum.toFixed(2)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span>Sistem Fonu (%{systemFundPercent})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
              <span>Şirket Brüt Marjı (%{companyGrossMarginPercent.toFixed(1)})</span>
            </div>
          </div>
        </div>

        {/* Breakdown Detail Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1: Sponsor */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-amber-300">Direkt Sponsor Prim Tutarı</div>
            <div className="text-2xl font-black font-mono text-amber-200">
              ${simDirectSponsor.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              ${simAmount} cirodan %{directSponsorPercent} oranında direkt aktarım
            </div>
          </div>

          {/* Card 2: Unilevel */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-indigo-300">Motor 1 Unilevel Dağıtımı</div>
            <div className="text-2xl font-black font-mono text-indigo-200">
              ${simUnilevelTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              7 Kademe Ekip: {unilevelPercentages.map((p, i) => `${i + 1}.D: $${((simAmount * p) / 100).toFixed(0)}`).join(' · ')}
            </div>
          </div>

          {/* Card 3: Monoline */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-teal-300">Motor 2 Monoline Dağıtımı</div>
            <div className="text-2xl font-black font-mono text-teal-200">
              ${simMonolineTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              7 Üst Sıra: {monolinePercentages.map((p, i) => `${i + 1}.S: $${((simAmount * p) / 100).toFixed(1)}`).join(' · ')}
            </div>
          </div>

          {/* Card 4: Sistem Fonu */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-bold text-blue-300">Sistem Fonu / Rezerv</div>
            <div className="text-2xl font-black font-mono text-blue-200">
              ${simSystemFund.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              Sistem havuzuna ve upline bulunamayan aktarımlara tahsis edilir
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Footer Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Değişiklikleri Canlı İş Mantığına Yansıt
            </div>
            <div className="text-xs text-slate-400">
              Yapılan ayarlar <code className="text-emerald-400 font-mono">PUT /api/v1/admin/business-rules</code> üzerinden backend hesaplama motoruna kaydedilir.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 transition-colors cursor-pointer"
          >
            Varsayılanlara Dön
          </button>
          <button
            type="button"
            onClick={() => handleSaveBusinessRules()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Ayarları Canlı Kaydet (Save Now)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
