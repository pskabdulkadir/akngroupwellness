import React, { useMemo, useState } from 'react';
import { formatUsd } from '../utils/currency';
import {
  Award,
  CheckCircle2,
  Coins,
  Crown,
  GitBranch,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Unlock,
  Users,
} from 'lucide-react';
import {
  CareerTier,
  CronJobExecutionRecord,
  MonolineMember,
  PACKAGES,
  PoolDistributionRecord,
  evaluateMemberOrganizationMetrics,
} from '../types/monoline';

interface CareerMatrixViewProps {
  members: MonolineMember[];
  careerTiers: CareerTier[];
  selectedMember?: MonolineMember;
  selectedMemberId?: string;
  onSelectMember?: (userId: string) => void;
  systemCareerFundBalance?: number;
  systemFundBalance?: number;
  poolDistributions: PoolDistributionRecord[];
  cronLogs?: CronJobExecutionRecord[];
  onDistributePool: () => void;
  onBoostCareer?: (userId: string, level: number) => void;
  onBoostMemberCareer?: (userId: string, level: number) => void;
  onTriggerCron?: () => void;
  isSimulating?: boolean;
  isSubmitting?: boolean;
  isAdminAuthenticated?: boolean;
}

const PYRAMID_COLORS: Record<
  number,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    bar: string;
    widthClass: string;
    pyramidRankLabel: string;
  }
> = {
  7: {
    bg: 'from-amber-500/25 via-yellow-500/15 to-amber-950/40',
    border: 'border-amber-400/60',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    bar: 'bg-gradient-to-r from-amber-400 to-yellow-300',
    widthClass: 'w-[38%] sm:w-[30%]',
    pyramidRankLabel: 'Kariyer Seviyesi 1',
  },
  6: {
    bg: 'from-purple-500/25 via-fuchsia-500/15 to-purple-950/40',
    border: 'border-purple-400/50',
    text: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    bar: 'bg-gradient-to-r from-purple-400 to-fuchsia-400',
    widthClass: 'w-[48%] sm:w-[40%]',
    pyramidRankLabel: 'Kariyer Seviyesi 2',
  },
  5: {
    bg: 'from-rose-500/25 via-pink-500/15 to-rose-950/40',
    border: 'border-rose-400/50',
    text: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    bar: 'bg-gradient-to-r from-rose-400 to-pink-400',
    widthClass: 'w-[58%] sm:w-[50%]',
    pyramidRankLabel: 'Kariyer Seviyesi 3',
  },
  4: {
    bg: 'from-emerald-500/25 via-teal-500/15 to-emerald-950/40',
    border: 'border-emerald-400/50',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    widthClass: 'w-[68%] sm:w-[62%]',
    pyramidRankLabel: 'Kariyer Seviyesi 4',
  },
  3: {
    bg: 'from-cyan-500/25 via-sky-500/15 to-cyan-950/40',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    bar: 'bg-gradient-to-r from-cyan-400 to-sky-400',
    widthClass: 'w-[78%] sm:w-[74%]',
    pyramidRankLabel: 'Kariyer Seviyesi 5',
  },
  2: {
    bg: 'from-blue-500/25 via-indigo-500/15 to-blue-950/40',
    border: 'border-blue-400/50',
    text: 'text-blue-300',
    badge: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    bar: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    widthClass: 'w-[88%] sm:w-[86%]',
    pyramidRankLabel: 'Kariyer Seviyesi 6',
  },
  1: {
    bg: 'from-slate-700/40 via-slate-800/30 to-slate-900/60',
    border: 'border-slate-600/60',
    text: 'text-slate-200',
    badge: 'bg-slate-800 text-slate-300 border-slate-600',
    bar: 'bg-gradient-to-r from-slate-400 to-slate-500',
    widthClass: 'w-full',
    pyramidRankLabel: 'Kariyer Seviyesi 7',
  },
};

export const CareerMatrixView: React.FC<CareerMatrixViewProps> = ({
  members,
  careerTiers,
  selectedMember: propSelectedMember,
  selectedMemberId,
  onSelectMember,
  systemCareerFundBalance: propSystemCareerFundBalance,
  systemFundBalance,
  poolDistributions,
  onDistributePool,
  onBoostCareer,
  onBoostMemberCareer,
  onTriggerCron,
  isSimulating: propIsSimulating,
  isSubmitting,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | null>(null);
  const [internalSelectedUserId, setInternalSelectedUserId] = useState<string>(
    selectedMemberId || propSelectedMember?.user_id || members[0]?.user_id || ''
  );

  const selectedMember: MonolineMember = useMemo(() => {
    if (propSelectedMember) return propSelectedMember;
    const targetId = selectedMemberId || internalSelectedUserId;
    const found = members.find((m) => m.user_id === targetId);
    if (found) return found;
    if (members.length > 0) return members[0];
    return {
      id: 9999,
      ref_code: 'AURA-FALLBACK',
      email: 'dealer@aurabio.com',
      phone: '+90 555 000 0000',
      city: 'İstanbul',
      user_id: 'fallback-member',
      full_name: 'Varsayılan Bayi',
      global_line_id: 1,
      sponsor_id: null,
      sponsor_db_id: null,
      career_level: 1,
      career_title: 'Emmâre',
      max_career_level: 1,
      max_career_title: 'Emmâre',
      active_career_level: 1,
      active_career_title: 'Emmâre',
      personal_volume: 0,
      group_volume: 0,
      rolling_30d_personal_volume: 0,
      rolling_30d_pgv: 0,
      highest_package_id: null,
      session_credits: 0,
      active_direct_referrals: 0,
      manual_career_override: null,
      unlocked_depth: 7,
      wallets: {
        sponsor_wallet: 0,
        monoline_wallet: 0,
        career_pool_wallet: 0,
        total_earnings: 0,
        withdrawn_total: 0,
        monthly_retained_earnings: 0,
      },
      is_active: true,
      is_locked: false,
      total_earned: 0,
      pool_earnings: 0,
      joined_at: new Date().toISOString(),
    } as unknown as MonolineMember;
  }, [propSelectedMember, selectedMemberId, internalSelectedUserId, members]);

  const handleSelectMember = (userId: string) => {
    setInternalSelectedUserId(userId);
    if (onSelectMember) {
      onSelectMember(userId);
    }
  };

  const handleBoostCareer = (userId: string, level: number) => {
    if (onBoostCareer) {
      onBoostCareer(userId, level);
    } else if (onBoostMemberCareer) {
      onBoostMemberCareer(userId, level);
    }
  };

  const systemCareerFundBalance =
    typeof propSystemCareerFundBalance === 'number'
      ? propSystemCareerFundBalance
      : typeof systemFundBalance === 'number'
      ? systemFundBalance
      : 0;

  const isSimulating = Boolean(propIsSimulating || isSubmitting);

  const memberOrgEval = useMemo(
    () => evaluateMemberOrganizationMetrics(selectedMember, members, careerTiers),
    [selectedMember, members, careerTiers]
  );

  // Piramit gösterimi için üstten alta (7 -> 1) sıralı mertebeler
  const pyramidTiersTopDown = useMemo(
    () => [...careerTiers].sort((a, b) => b.level - a.level),
    [careerTiers]
  );

  const activeMembersCount = useMemo(
    () => Math.max(1, members.filter((m) => m.is_active).length),
    [members]
  );

  const memberPkgRank = selectedMember.highest_package_id
    ? PACKAGES[selectedMember.highest_package_id]?.rankOrder || 1
    : 1;

  return (
    <div className="space-y-6">
      {/* Anti-Freeriding & Monoline Organizasyon Felsefesi Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Monoline (Tek Hat) Freeriding Önleme & Sağlıklı Organizasyon Mimarisi
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Kariyer Seviyeleri, Grup Ciro (PGV), %50 Dengeli Hat & Alt Ekip Şartları
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monoline (Tek Hat) MLM sistemlerinde pasif üyelerin çaba göstermeden üst sıralardan komisyon kazanmasını (<strong>freeriding</strong>) engellemek, sistemin ömrünü uzatmak, aktif çalışmayı teşvik etmek ve ciroyu katlamak için kariyer yapısına <strong>Grup Ciro Şartı (PGV)</strong>, <strong>%50 Dengeli Kol (Leg) Kuralı</strong> ve <strong>Kariyerli Alt Ekip Yetiştirme Şartları</strong> entegre edilmiştir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onTriggerCron && (
              <button
                onClick={onTriggerCron}
                disabled={isSimulating}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Kariyer & Organizasyon Motorunu Çalıştır
              </button>
            )}
            <button
              onClick={onDistributePool}
              disabled={isSimulating || systemCareerFundBalance <= 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Havuz Paylarını Dağıt ({formatUsd(systemCareerFundBalance)})
            </button>
          </div>
        </div>
      </div>

      {/* BÖLÜM 1: 📊 Kariyer Piramidi & Önerilen Bayi Dağılım Oranları (1.000 Kişilik Aktif Ağ) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Kariyer Seviyeleri & Önerilen Bayi Dağılım Oranları
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sağlıklı bir MLM ağında üst kariyerler zorlaşmalı ve oran olarak azalmalıdır (1.000 kişilik aktif bayi ağı ideal dağılımı).
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300">
                1.000 Aktif Bayi Modeli
              </span>
            </div>

            {/* Görsel Piramit Katmanları (Üstten Alta: Kâmile -> Emmâre) */}
            <div className="flex flex-col items-center space-y-2 my-3 py-2">
              {pyramidTiersTopDown.map((tier) => {
                const style = PYRAMID_COLORS[tier.level] || PYRAMID_COLORS[1];
                const liveCount = members.filter(
                  (m) => m.career_level === tier.level && m.is_active
                ).length;
                const livePct =
                  Math.round((liveCount / activeMembersCount) * 1000) / 10;
                const isSelected = selectedTierFilter === tier.level;

                return (
                  <button
                    key={tier.level}
                    type="button"
                    onClick={() =>
                      setSelectedTierFilter(isSelected ? null : tier.level)
                    }
                    className={`${style.widthClass} transition-all duration-200 rounded-xl bg-gradient-to-r ${style.bg} border ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.01]'
                        : style.border
                    } px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:brightness-110 cursor-pointer shadow-md`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded border shrink-0 ${style.badge}`}
                      >
                        %{tier.idealNetworkPyramidPercent}
                      </span>
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-black text-white">
                          {style.pyramidRankLabel}
                        </span>
                        <span className="hidden sm:inline text-[11px] text-slate-300 ml-1.5">
                          ({tier.subtitle})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                        İdeal: {tier.idealCountPer1000} Bayi
                      </span>
                      <span className="hidden md:inline-block text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Canlı: {liveCount} (%{livePct})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ASCII Piramit & Özet Bilgi */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-400 text-[11px]">Başlangıç Seviyeleri (1-2)</div>
              <div className="text-base font-black text-white mt-0.5">%65.0 (650 Bayi / 1000)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Yeni girenler ve ilk ekibini kuranlar
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-400 text-[11px]">Orta Kademe Liderler (3-4-5. Mertebe)</div>
              <div className="text-base font-black text-cyan-300 mt-0.5">%32.5 (325 Bayi / 1000)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                %50 Dengeli kol ve alt kariyer yetiştirenler
              </div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="text-slate-400 text-[11px]">Üst Kariyer Seviyeleri (6-7)</div>
              <div className="text-base font-black text-amber-400 mt-0.5">%2.5 (25 Bayi / 1000)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                En yüksek ciro getiren şirket hissedarları
              </div>
            </div>
          </div>
        </div>

        {/* Seçili Bayi Canlı Organizasyon, Kol (Leg) Dengesi & Kariyer Denetimi */}
        <div className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block">
                  Canlı Bayi Organizasyon & Kol (Leg) Denetimi
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  #{selectedMember.global_line_id} {selectedMember.full_name}
                </h3>
              </div>

              <select
                value={selectedMember.user_id}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    #{m.global_line_id} - {m.full_name} (Kariyer Seviyesi {m.career_level})
                  </option>
                ))}
              </select>
            </div>

            {/* 4 Ana Organizasyon Metriği */}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Kişisel Hacim & Paket</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {formatUsd(selectedMember.personal_volume)}
                </div>
                <div className="text-[10px] text-amber-400 font-semibold mt-0.5 truncate">
                  {selectedMember.highest_package_id
                    ? PACKAGES[selectedMember.highest_package_id]?.code
                    : 'Paket Yok'}{' '}
                  (Kademe {memberPkgRank})
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Ekip Grup Cirosu (PGV)</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {formatUsd(memberOrgEval.effectiveGroupVolume)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Sponsor Ağacı: {formatUsd(memberOrgEval.sponsorTreeGroupVolume)}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Aktif vs. Maksimum Kariyer Unvanı</div>
                <div className="text-sm font-black text-cyan-400 mt-0.5">
                  Aktif Kariyer Seviyesi: {selectedMember.active_career_level || selectedMember.career_level}
                </div>
                <div className="text-[10px] text-amber-300 mt-0.5">
                  Max Kariyer Seviyesi: {selectedMember.max_career_level || selectedMember.career_level} ·{' '}
                  {memberOrgEval.activeDirectsCount} Aktif Kol
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">%50 Kol Denge Kuralı (adjustedGV)</div>
                <div className="text-sm font-black text-purple-300 mt-0.5">
                  adjustedGV: {formatUsd(memberOrgEval.adjusted_gv)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  maxCapPerLeg (%50): {formatUsd(memberOrgEval.max_cap_per_leg)} ·
                  En Güçlü: %{memberOrgEval.strongestLegSharePercent}
                </div>
              </div>
            </div>

            {/* Direkt Referans Kolları (Legs) Listesi */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  Direkt Referans Hatları (Legs) & %50 Tavan (maxCapPerLeg) Analizi
                </span>
                <span className="text-[11px] text-slate-400">
                  Toplam {memberOrgEval.legs.length} Hat
                </span>
              </div>

              {memberOrgEval.legs.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 text-center">
                  Bu bayinin henüz direkt referans kolu (leg) bulunmuyor. Üst kariyerler için direkt referans ve alt ekip cirosu gereklidir.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {memberOrgEval.legs.map((leg, idx) => (
                    <div
                      key={leg.rootDirectMemberId}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {idx + 1}. Kol: {leg.rootDirectMemberName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Koldaki Üye: {leg.legMemberCount} · En Yüksek Kariyer:{' '}
                          <span className="text-amber-300 font-semibold">
                            {leg.maxCareerLevelInLeg}. {leg.maxCareerTitleInLeg}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-emerald-400">
                          {formatUsd(leg.legTotalVolume)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Sayılan:{' '}
                          <span
                            className={
                              leg.is_capped_by_50_rule ? 'text-amber-300' : 'text-emerald-300'
                            }
                          >
                            {formatUsd(leg.capped_leg_vol_30d ?? leg.legTotalVolume)}
                          </span>
                          {leg.is_capped_by_50_rule ? ' (%50 Cap)' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hızlı Mertebe Simülasyon Butonları */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">Hızlı Test / Manuel Kariyer Atama:</span>
            <div className="flex flex-wrap gap-1">
              {careerTiers.map((t) => (
                <button
                  key={t.level}
                  onClick={() => handleBoostCareer(selectedMember.user_id, t.level)}
                  disabled={isSimulating || selectedMember.career_level === t.level}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    selectedMember.career_level === t.level
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Kariyer Seviyesi {t.level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BÖLÜM 2: 🎯 Kariyer Bazlı Organizasyon & Bayilik Şartları Matrisi (Detaylı Tablo) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              🎯 Kariyer Bazlı Organizasyon & Bayilik Şartları Matrisi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Her mertebe için Kişisel Aktiflik (Sadece Aktiflik Yeterlidir), Direkt Referans, Grup Ciro Şartı (PGV), %50 Dengeli Hat Kuralı (4. mertebeden itibaren), Aktif Alt Ekip Kariyer Şartı ve Derinlik Hak Edişleri.
            </p>
          </div>
          {selectedTierFilter !== null && (
            <button
              type="button"
              onClick={() => setSelectedTierFilter(null)}
              className="text-xs text-amber-400 hover:underline self-start sm:self-auto cursor-pointer"
            >
              Tüm 7 Mertebeyi Göster
            </button>
          )}
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3 px-3">Mertebe & Konum</th>
                <th className="py-3 px-3">Kişisel Şart</th>
                <th className="py-3 px-3">Direkt Referans</th>
                <th className="py-3 px-3">Grup Ciro Şartı (PGV) &amp; Kol Katkı Sınırı</th>
                <th className="py-3 px-3">Organizasyon &amp; Alt Ekip Kariyer Şartı</th>
                <th className="py-3 px-3">Ağdaki Bayi Oranı</th>
                <th className="py-3 px-3">Derinlik Kilidi (Her İki Motor İçin)</th>
                <th className="py-3 px-3 text-center">Seçili Bayi Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {careerTiers
                .filter((t) => selectedTierFilter === null || t.level === selectedTierFilter)
                .map((tier) => {
                  const check = memberOrgEval.tierChecks.find((c) => c.level === tier.level);
                  const isCurrent = selectedMember.career_level === tier.level;
                  const isUnlocked = selectedMember.career_level >= tier.level;

                  return (
                    <tr
                      key={tier.level}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10'
                          : isUnlocked
                          ? 'bg-emerald-500/5 hover:bg-slate-800/50'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950'
                                : isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {tier.level}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              Kariyer Seviyesi {tier.level}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{tier.subtitle}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-emerald-400">
                          {tier.minPackageLabel || 'Kişisel Aktiflik Yeterlidir'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Yalnızca 30 günlük aktiflik süresi yeterlidir
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {tier.minActiveDirects === 0 ? (
                          <span className="text-slate-400">Şart Yok</span>
                        ) : (
                          <span className="font-bold text-cyan-300">
                            En az {tier.minActiveDirects} Aktif Üye
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {tier.minGroupVolume <= 0 ? (
                          <span className="text-slate-400">Şart Yok</span>
                        ) : (
                          <div>
                            <div className="font-mono font-bold text-emerald-400">
                              {formatUsd(tier.minGroupVolume)} Ekip Cirosu
                            </div>
                            {tier.enforceMaxSingleLegPercent && (
                              <div className="text-[10px] text-amber-300 mt-0.5">
                                Maks. %{tier.maxSingleLegPercent} Tek Kol Kuralı
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-slate-200 leading-snug">
                          {tier.organizationRuleSummary}
                        </div>
                        {tier.requiredDownlineCareers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tier.requiredDownlineCareers.map((req, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                              >
                                {req.requiredCount}x {req.minCareerTitle} ({req.minCareerLevel}. Kariyer)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-amber-300">{tier.idealNetworkRatioLabel}</div>
                        <div className="text-[10px] text-slate-400">
                          İdeal dağılım: %{tier.idealNetworkPyramidPercent} ({tier.idealCountPer1000}/1000)
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-emerald-300">
                          {tier.level === 1 && '1. Derinlik (Unilevel %7 + Monoline %1.50)'}
                          {tier.level === 2 && '2. Derinlik (+ Unilevel %5 + Monoline %1.00)'}
                          {tier.level === 3 && '3. Derinlik (+ Unilevel %4 + Monoline %0.80)'}
                          {tier.level === 4 && '4. Derinlik (+ Unilevel %3 + Monoline %0.60)'}
                          {tier.level === 5 && '5. Derinlik (+ Unilevel %2 + Monoline %0.50)'}
                          {tier.level === 6 && '6. Derinlik (+ Unilevel %2 + Monoline %0.30)'}
                          {tier.level === 7 && '7. Derinliğin Tamamı (+ Unilevel %2 + Monoline %0.30)'}
                        </div>
                        <div className="text-[10px] text-indigo-300 mt-0.5">
                          {tier.enforceMaxSingleLegPercent
                            ? `Max %${tier.maxSingleLegPercent} Tek Kol Kuralı`
                            : 'Kısıt Yok'}
                          {tier.level === 7 ? ' · +%10 Sistem Fonu Havuz Payı' : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {check?.allStrictCriteriaMet ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Şartlar Tamam
                          </span>
                        ) : (
                          <div className="inline-flex flex-col items-center gap-0.5 text-[10px]">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {check?.downlineCareersDetail}
                            </span>
                            {!check?.groupVolumeOk && (
                              <span className="text-rose-400">PGV Eksik</span>
                            )}
                            {check?.groupVolumeOk && !check?.legBalanceOk && (
                              <span className="text-amber-400">%50 Kol Dengesi Eksik</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BÖLÜM 3: 7 Mertebe Detay Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {careerTiers.map((tier) => {
          const isUnlocked = selectedMember.career_level >= tier.level;
          const isCurrent = selectedMember.career_level === tier.level;
          const check = memberOrgEval.tierChecks.find((c) => c.level === tier.level);
          const qualifiedMembersCount = members.filter(
            (m) => m.career_level >= tier.level && m.is_active && !m.is_locked
          ).length;

          return (
            <div
              key={tier.level}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : isUnlocked
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950'
                            : isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tier.level}. Kariyer
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Ağ Oranı: {tier.idealNetworkRatioLabel}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-white mt-1.5 flex items-center gap-1.5">
                      Kariyer Seviyesi {tier.level}
                      {tier.level === 7 && <Crown className="w-4 h-4 text-amber-400" />}
                    </h4>
                    <div className="text-[11px] font-medium text-slate-400">{tier.subtitle}</div>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      isUnlocked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                </div>

                <div className="space-y-2 my-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Kişisel Şart:</span>
                    <span
                      className={`font-semibold text-right ${
                        check?.personalOk ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {tier.minPackageLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Direkt Referans:</span>
                    <span
                      className={`font-mono font-bold ${
                        check?.directsOk ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tier.minActiveDirects === 0
                        ? 'Şart Yok'
                        : `En az ${tier.minActiveDirects} Aktif Üye`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Grup Ciro (PGV):</span>
                    <span
                      className={`font-mono font-bold ${
                        check?.groupVolumeOk ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tier.minGroupVolume <= 0
                        ? 'Şart Yok'
                        : `${formatUsd(tier.minGroupVolume)}`}
                    </span>
                  </div>

                  {tier.enforceMaxSingleLegPercent && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Dengeli Hat Kuralı:</span>
                      <span
                        className={`font-semibold ${
                          check?.legBalanceOk ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        Maks. %{tier.maxSingleLegPercent} Tek Kol
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400 block text-[11px] mb-1">
                      Kariyerli Alt Ekip & Organizasyon Şartı:
                    </span>
                    <span className="text-[11px] text-slate-200 font-medium block leading-snug">
                      {tier.organizationRuleSummary}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Derinlik Hak Edişi:</span>
                    <span className="font-bold text-cyan-300">
                      {tier.unlockedDepth}. Derinlik (%{tier.depthCommissionPercent})
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>1.000 Ağda İdeal: {tier.idealCountPer1000} Bayi</span>
                  <span className="font-mono text-white font-semibold">
                    Aktif Havuz: {qualifiedMembersCount} Üye
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
