import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Plus,
  Search,
  ShieldCheck,

  Users,
} from 'lucide-react';
import {
  CommissionTransaction,
  INITIAL_CAREER_TIERS,
  MONOLINE_DEPTH_RATES,
  MonolineMember,
  PACKAGES,
  PackageId,
} from '../types/monoline';
import {
  getDealerMonolineDownlineTree,
  redirectToDealerRegistrationPortal,
} from '../utils/monolineSyncBridge';
import { formatUsd } from '../utils/currency';
import { getCountryFlag, getRegionTierLabel, resolveMemberRegion } from '../utils/walletRegion';

const MemberRegionBadge: React.FC<{ countryCode?: string; isSelected?: boolean }> = ({
  countryCode,
  isSelected = false,
}) => {
  const region = resolveMemberRegion(countryCode);
  const toneClass = isSelected
    ? 'bg-white/10 text-amber-200'
    : region === 'INTERNATIONAL'
    ? 'bg-indigo-100 text-indigo-800'
    : 'bg-emerald-100 text-emerald-800';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${toneClass}`}>
      <span>{getCountryFlag(countryCode)}</span>
      <span>{(countryCode || 'TR').trim().toUpperCase()}</span>
      <span>· {getRegionTierLabel(region)}</span>
    </span>
  );
};

interface MonolineTimelineViewProps {
  members: MonolineMember[];
  selectedMemberId: string;
  onSelectMember: (userId: string) => void;
  lastTransaction: CommissionTransaction | null;
  onRegisterMember: (data: {
    full_name: string;
    city: string;
    sponsor_id: string;
    initial_package_id: Exclude<PackageId, 'CUSTOM'>;
  }) => Promise<void>;
  onQuickTriggerOrder: (member: MonolineMember, amount?: number) => void;
  isSubmitting: boolean;
  isAdminAuthenticated?: boolean;
}

export const MonolineTimelineView: React.FC<MonolineTimelineViewProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  onQuickTriggerOrder,
  isSubmitting,
  isAdminAuthenticated = false,
}) => {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminViewGlobal, setAdminViewGlobal] = useState<boolean>(false);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.global_line_id - b.global_line_id),
    [members]
  );
  const selectedMember =
    sortedMembers.find((m) => m.user_id === selectedMemberId) ||
    sortedMembers[sortedMembers.length - 1];

  // Scoped Monoline single-line tree for this dealer:
  // Includes ONLY the dealer themselves and sub-dealers after them in their own sponsorship downline.
  const dealerDownlineTree = useMemo(
    () =>
      selectedMember ? getDealerMonolineDownlineTree(sortedMembers, selectedMember.user_id) : [],
    [selectedMember, sortedMembers]
  );

  const visibleBaseMembers =
    isAdminAuthenticated && adminViewGlobal ? sortedMembers : dealerDownlineTree;

  const downlineMembersAfterDealer = useMemo(
    () => dealerDownlineTree.filter((m) => m.user_id !== selectedMember?.user_id),
    [dealerDownlineTree, selectedMember?.user_id]
  );

  const directReferrals = useMemo(
    () =>
      selectedMember
        ? dealerDownlineTree.filter(
            (m) => m.sponsor_id === selectedMember.user_id && m.user_id !== selectedMember.user_id
          )
        : [],
    [dealerDownlineTree, selectedMember]
  );

  // SOL KOL & SAĞ KOL (İKİLİ DENGE VE ALT AĞAÇ DAĞILIMI) ANALİZİ
  const branchAnalysis = useMemo(() => {
    if (!selectedMember) {
      return {
        leftBranchMembers: [] as MonolineMember[],
        rightBranchMembers: [] as MonolineMember[],
        leftDirectCount: 0,
        rightDirectCount: 0,
        leftActiveCount: 0,
        rightActiveCount: 0,
        leftVolume: 0,
        rightVolume: 0,
      };
    }

    // Direct referrals split alternatingly into Sol Kol (index 0, 2, 4...) and Sağ Kol (index 1, 3, 5...)
    // Together with their entire respective sub-trees
    const leftRootIds = new Set<string>();
    const rightRootIds = new Set<string>();

    directReferrals.forEach((ref, idx) => {
      if (idx % 2 === 0) {
        leftRootIds.add(ref.user_id);
      } else {
        rightRootIds.add(ref.user_id);
      }
    });

    const leftBranchMembers: MonolineMember[] = [];
    const rightBranchMembers: MonolineMember[] = [];
    const assignedLeft = new Set<string>(leftRootIds);
    const assignedRight = new Set<string>(rightRootIds);

    for (const m of downlineMembersAfterDealer) {
      if (assignedLeft.has(m.user_id)) {
        leftBranchMembers.push(m);
      } else if (assignedRight.has(m.user_id)) {
        rightBranchMembers.push(m);
      } else if (m.sponsor_id && assignedLeft.has(m.sponsor_id)) {
        assignedLeft.add(m.user_id);
        leftBranchMembers.push(m);
      } else if (m.sponsor_id && assignedRight.has(m.sponsor_id)) {
        assignedRight.add(m.user_id);
        rightBranchMembers.push(m);
      } else {
        // Fallback balanced assignment
        if (leftBranchMembers.length <= rightBranchMembers.length) {
          assignedLeft.add(m.user_id);
          leftBranchMembers.push(m);
        } else {
          assignedRight.add(m.user_id);
          rightBranchMembers.push(m);
        }
      }
    }

    const leftDirectCount = leftBranchMembers.filter(
      (m) => m.sponsor_id === selectedMember.user_id
    ).length;
    const rightDirectCount = rightBranchMembers.filter(
      (m) => m.sponsor_id === selectedMember.user_id
    ).length;
    const leftActiveCount = leftBranchMembers.filter((m) => m.is_active).length;
    const rightActiveCount = rightBranchMembers.filter((m) => m.is_active).length;
    const leftVolume = leftBranchMembers.reduce((sum, m) => sum + (m.personal_volume || 0), 0);
    const rightVolume = rightBranchMembers.reduce((sum, m) => sum + (m.personal_volume || 0), 0);

    return {
      leftBranchMembers,
      rightBranchMembers,
      leftDirectCount,
      rightDirectCount,
      leftActiveCount,
      rightActiveCount,
      leftVolume,
      rightVolume,
    };
  }, [selectedMember, directReferrals, downlineMembersAfterDealer]);

  // KARİYER YETERLİLİKLERİ VE EKSİKLER HESAPLAMASI
  const qualificationAnalysis = useMemo(() => {
    const currentLevel = selectedMember?.career_level || 1;
    const currentTier =
      INITIAL_CAREER_TIERS.find((t) => t.level === currentLevel) || INITIAL_CAREER_TIERS[0];
    const nextTier =
      INITIAL_CAREER_TIERS.find((t) => t.level === Math.min(7, currentLevel + 1)) ||
      INITIAL_CAREER_TIERS[6];

    const activeDirects = directReferrals.filter((m) => m.is_active).length;
    const totalTeamVol =
      (selectedMember?.personal_volume || 0) +
      downlineMembersAfterDealer.reduce((s, m) => s + (m.personal_volume || 0), 0);

    const reqDirects = Number(
      nextTier.minActiveDirects ?? (nextTier as any).requiredDirectReferrals ?? 2
    );
    const missingDirects = Math.max(0, reqDirects - activeDirects);

    const reqVolume = Number(nextTier.minGroupVolume ?? 0);
    const missingVolume = Math.max(0, reqVolume - totalTeamVol);

    const reqPerBranch = Math.max(1, Math.ceil(reqDirects / 2));
    const missingLeftBranch = Math.max(0, reqPerBranch - branchAnalysis.leftActiveCount);
    const missingRightBranch = Math.max(0, reqPerBranch - branchAnalysis.rightActiveCount);


    return {
      currentTier,
      nextTier,
      activeDirects,
      totalTeamVol,
      reqDirects,
      missingDirects,
      reqVolume,
      missingVolume,
      reqPerBranch,
      missingLeftBranch,
      missingRightBranch,

      isNextTierFullyMet:
        missingDirects === 0 &&
        missingVolume === 0 &&
        missingLeftBranch === 0 &&
        missingRightBranch === 0,
    };
  }, [selectedMember, directReferrals, downlineMembersAfterDealer, branchAnalysis]);

  const uplineDepthMap = new Map<string, { depth: number; percentage: number }>();
  if (selectedMember && isAdminAuthenticated && adminViewGlobal) {
    for (const rule of MONOLINE_DEPTH_RATES) {
      const targetLineId = selectedMember.global_line_id - rule.depth;
      const upMember = sortedMembers.find((m) => m.global_line_id === targetLineId);
      if (upMember) {
        uplineDepthMap.set(upMember.user_id, {
          depth: rule.depth,
          percentage: rule.percentage,
        });
      }
    }
  }

  const filteredMembers = visibleBaseMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.user_id.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.career_title.toLowerCase().includes(q) ||
      `#${m.global_line_id}`.includes(q)
    );
  });

  const registrationOrderedMembers = [...filteredMembers].sort(
    (a, b) =>
      (new Date(a.joined_at).getTime() || 0) - (new Date(b.joined_at).getTime() || 0) ||
      a.global_line_id - b.global_line_id
  );

  return (
    <div className="space-y-8">
      {selectedMember && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                <span>MONOLINE SIRA #{selectedMember.global_line_id}</span>
                <span aria-hidden="true">·</span>
                <span>ID: {selectedMember.user_id}</span>
                <span aria-hidden="true">·</span>
                <span>{(selectedMember.session_credits ?? 0).toLocaleString('tr-TR')} SEANS KREDİSİ</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {selectedMember.full_name} — Bayi Monoline Tek Hat Ağaç Yapısı
              </h2>
              <p className="text-sm text-slate-600 max-w-3xl">
                Her bayi kendi kaydettiği bayinin doğrudan sponsorudur. Bu ekranda yalnızca
                kendinizden sonra kendi sponsorluk hattınıza kayıtlı alt bayilerinizi Monoline tek
                hat ağaç yapısında görüntülersiniz; üst sponsorların diğer bayileri gizlidir.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isAdminAuthenticated && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="member-selector"
                    className="text-xs font-medium text-slate-600 whitespace-nowrap"
                  >
                    İncelenen Bayi:
                  </label>
                  <select
                    id="member-selector"
                    value={selectedMember.user_id}
                    onChange={(e) => onSelectMember(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {sortedMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        #{m.global_line_id} — {m.full_name} (Kariyer Seviyesi {m.career_level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => onQuickTriggerOrder(selectedMember, 5000)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                $101 (Mini Paket) Siparişi Simüle Et
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Doğrudan Kaydettiğiniz Bayiler (1. Kademe)
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {directReferrals.length} <span className="text-sm font-normal text-slate-500">Bayi</span>
              </div>
              <div className="text-xs text-slate-600">
                Kaydettiğiniz her bayinin doğrudan (%20) sponsorusunuz
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Sizden Sonraki Monoline Alt Bayi Ağacı
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-emerald-700">
                +{downlineMembersAfterDealer.length}{' '}
                <span className="text-sm font-normal text-slate-500">Alt Bayi</span>
              </div>
              <div className="text-xs text-slate-600">
                Kendi sponsorluk ağacınızda sizden sonra gelen toplam bayi
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Bayi Seans Kredisi & Mertebe
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {(selectedMember.session_credits ?? 0).toLocaleString('tr-TR')}{' '}
                <span className="text-sm font-sans font-normal text-slate-500">Seans Kredisi</span>
              </div>
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                {selectedMember.career_level > 0
                  ? `Kariyer Seviyesi ${selectedMember.career_level}`
                  : 'Aday'}{' '}
                · Derinlik: {selectedMember.unlocked_depth}/7
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Toplam Bayi Kazancı (Cüzdanlar Toplamı)
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {formatUsd(selectedMember.wallets?.total_earnings ?? 0, 2)}
              </div>
              <div className="text-xs text-slate-600 font-mono tabular-nums">
                Sponsor: {formatUsd(selectedMember.wallets?.sponsor_wallet ?? 0)} ·
                Monoline: {formatUsd(selectedMember.wallets?.monoline_wallet ?? 0)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Monoline Visual Timeline */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>İzole Sponsorluk &amp; Tek Hat Ağaç Yapısı</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {selectedMember?.full_name} — Monoline Tek Hat Alt Bayi Ağacı ({dealerDownlineTree.length} Nokta)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sadece kendiniz ve kendi kaydettiğiniz bayilerden oluşan alt ekibiniz tek hat (Monoline)
              sırasıyla gösterilir. Üst sponsorların diğer kolları bu ağaçta yer almaz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setAdminViewGlobal((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  adminViewGlobal
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {adminViewGlobal
                  ? 'Yönetici: Global Tüm Hat Açık'
                  : 'Yönetici: Sadece Bayi Alt Ağacı'}
              </button>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Alt bayi adı, #sıra veya şehir..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setOrientation('horizontal')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  orientation === 'horizontal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yatay Tek Hat Ağacı
              </button>
              <button
                type="button"
                onClick={() => setOrientation('vertical')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  orientation === 'vertical'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dikey Tek Hat Ağacı
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                redirectToDealerRegistrationPortal(
                  selectedMember
                    ? {
                        user_id: selectedMember.user_id,
                        full_name: selectedMember.full_name,
                        ref_code: selectedMember.ref_code,
                        email: selectedMember.email,
                        phone: selectedMember.phone,
                      }
                    : undefined
                );
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kendi Altınıza Yeni Bayi Kaydet</span>
            </button>
          </div>
        </div>

        {/* SOL KOL & SAĞ KOL (İKİLİ HAT) + KARİYER YETERLİLİKLERİ VE EKSİKLER ANALİZ PANELİ */}
        {selectedMember && (
          <div className="space-y-5">
            {/* Sol Kol & Sağ Kol Karşılaştırmalı İkili Hat Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* SOL KOL PANELİ */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-2 border-emerald-200 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-emerald-200/80 pb-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-700" />
                      <span>SOL KOL (1. ANA KOL · GÜÇLÜ HAT)</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      Sol Kol Organizasyon &amp; Bayi Dağılımı
                    </h4>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-2xl font-black text-emerald-700">
                      {branchAnalysis.leftBranchMembers.length}{' '}
                      <span className="text-xs font-semibold text-slate-600">Bayi</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold">
                      {branchAnalysis.leftActiveCount} Aktif ·{' '}
                      {Math.max(
                        0,
                        branchAnalysis.leftBranchMembers.length - branchAnalysis.leftActiveCount
                      )}{' '}
                      Pasif
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs font-mono tabular-nums">
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80">
                    <div className="text-[10px] text-slate-500">Direkt Sponsor</div>
                    <div className="text-sm font-bold text-slate-900">
                      {branchAnalysis.leftDirectCount} Bayi
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80">
                    <div className="text-[10px] text-slate-500">Sol Kol Ciro</div>
                    <div className="text-sm font-bold text-emerald-700">
                      {formatUsd(branchAnalysis.leftVolume ?? 0)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80">
                    <div className="text-[10px] text-slate-500">Kol Yeterliliği</div>
                    <div
                      className={`text-xs font-bold ${
                        qualificationAnalysis.missingLeftBranch === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {qualificationAnalysis.missingLeftBranch === 0
                        ? '✓ TAMAMLANDI'
                        : `${qualificationAnalysis.missingLeftBranch} Aktif Eksik`}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Sol Koldaki Alt Bayiler ({branchAnalysis.leftBranchMembers.length}):</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Hedef: Min. {qualificationAnalysis.reqPerBranch} Aktif Bayi
                    </span>
                  </div>
                  {branchAnalysis.leftBranchMembers.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/80 border border-dashed border-emerald-300 text-xs text-slate-500">
                      Sol kolunuzda henüz alt bayi bulunmuyor. İlk kaydettiğiniz bayi otomatik olarak
                      Sol Kolunuza yerleşir.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {branchAnalysis.leftBranchMembers.map((m) => (
                        <div
                          key={m.user_id}
                          className="p-2 rounded-lg bg-white border border-emerald-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="truncate">
                            <span className="font-mono font-bold text-emerald-800">
                              #{m.global_line_id}
                            </span>{' '}
                            <span className="font-semibold text-slate-900">{m.full_name}</span>{' '}
                            <span className="text-[10px] text-slate-500">(Seviye {m.career_level})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span className="text-slate-700">
                              {formatUsd(m.personal_volume ?? 0)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SAĞ KOL PANELİ */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/50 border-2 border-indigo-200 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-indigo-200/80 pb-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-bold">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-700" />
                      <span>SAĞ KOL (2. ANA KOL · DENGE HATTI)</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      Sağ Kol Organizasyon &amp; Bayi Dağılımı
                    </h4>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-2xl font-black text-indigo-700">
                      {branchAnalysis.rightBranchMembers.length}{' '}
                      <span className="text-xs font-semibold text-slate-600">Bayi</span>
                    </div>
                    <div className="text-[11px] text-indigo-800 font-semibold">
                      {branchAnalysis.rightActiveCount} Aktif ·{' '}
                      {Math.max(
                        0,
                        branchAnalysis.rightBranchMembers.length - branchAnalysis.rightActiveCount
                      )}{' '}
                      Pasif
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs font-mono tabular-nums">
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-200/80">
                    <div className="text-[10px] text-slate-500">Direkt Sponsor</div>
                    <div className="text-sm font-bold text-slate-900">
                      {branchAnalysis.rightDirectCount} Bayi
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-200/80">
                    <div className="text-[10px] text-slate-500">Sağ Kol Ciro</div>
                    <div className="text-sm font-bold text-indigo-700">
                      {formatUsd(branchAnalysis.rightVolume ?? 0)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-200/80">
                    <div className="text-[10px] text-slate-500">Kol Yeterliliği</div>
                    <div
                      className={`text-xs font-bold ${
                        qualificationAnalysis.missingRightBranch === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {qualificationAnalysis.missingRightBranch === 0
                        ? '✓ TAMAMLANDI'
                        : `${qualificationAnalysis.missingRightBranch} Aktif Eksik`}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Sağ Koldaki Alt Bayiler ({branchAnalysis.rightBranchMembers.length}):</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Hedef: Min. {qualificationAnalysis.reqPerBranch} Aktif Bayi
                    </span>
                  </div>
                  {branchAnalysis.rightBranchMembers.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white/80 border border-dashed border-indigo-300 text-xs text-slate-500">
                      Sağ kolunuzda henüz alt bayi bulunmuyor. İkinci kaydettiğiniz bayi ve alt
                      ekibi Sağ Kolunuza yerleşir.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {branchAnalysis.rightBranchMembers.map((m) => (
                        <div
                          key={m.user_id}
                          className="p-2 rounded-lg bg-white border border-indigo-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="truncate">
                            <span className="font-mono font-bold text-indigo-800">
                              #{m.global_line_id}
                            </span>{' '}
                            <span className="font-semibold text-slate-900">{m.full_name}</span>{' '}
                            <span className="text-[10px] text-slate-500">(Seviye {m.career_level})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span className="text-slate-700">
                              {formatUsd(m.personal_volume ?? 0)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KARİYER YETERLİLİKLERİ, EKSİKLER & TERFİ KONTROL TABLOSU */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase">
                    KARİYER TERFİ &amp; YETERLİLİK / EKSİK ANALİZ RAPORU
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-0.5">
                    Mevcut Kariyer Seviyesi {qualificationAnalysis.currentTier.level} → Hedef Kariyer Seviyesi {qualificationAnalysis.nextTier.level}
                  </h4>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono self-start ${
                    qualificationAnalysis.isNextTierFullyMet
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {qualificationAnalysis.isNextTierFullyMet
                    ? '✓ TÜM YETERLİLİKLER TAMAMLANDI'
                    : '⚠️ TAMAMLANMASI GEREKEN EKSİKLER VAR'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* 1. Doğrudan Aktif Bayi Şartı */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>1. Direkt Aktif Bayi</span>
                    {qualificationAnalysis.missingDirects === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="text-base font-black font-mono text-white">
                    {qualificationAnalysis.activeDirects} / {qualificationAnalysis.reqDirects} Bayi
                  </div>
                  <div
                    className={`text-[11px] font-semibold ${
                      qualificationAnalysis.missingDirects === 0
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {qualificationAnalysis.missingDirects === 0
                      ? '✓ Yeterlilik Sağlandı'
                      : `Eksik: +${qualificationAnalysis.missingDirects} yeni direkt bayi gerekli`}
                  </div>
                </div>

                {/* 2. Sol & Sağ Kol Dengesi */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>2. Sol / Sağ Kol Dengesi</span>
                    {qualificationAnalysis.missingLeftBranch === 0 &&
                    qualificationAnalysis.missingRightBranch === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="text-base font-black font-mono text-white">
                    Sol: {branchAnalysis.leftActiveCount} · Sağ: {branchAnalysis.rightActiveCount}
                  </div>
                  <div
                    className={`text-[11px] font-semibold ${
                      qualificationAnalysis.missingLeftBranch === 0 &&
                      qualificationAnalysis.missingRightBranch === 0
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {qualificationAnalysis.missingLeftBranch === 0 &&
                    qualificationAnalysis.missingRightBranch === 0
                      ? '✓ Sol ve Sağ Kol Dengeli'
                      : `Eksik: Sol Kol (${qualificationAnalysis.missingLeftBranch}), Sağ Kol (${qualificationAnalysis.missingRightBranch})`}
                  </div>
                </div>

                {/* 3. Kişisel & Ekip Ciro Yeterliliği */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>3. Toplam Ciro Şartı</span>
                    {qualificationAnalysis.missingVolume === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="text-base font-black font-mono text-white">
                    {formatUsd(qualificationAnalysis.totalTeamVol ?? 0)} /{' '}
                    {formatUsd(qualificationAnalysis.reqVolume ?? 0)}
                  </div>
                  <div
                    className={`text-[11px] font-semibold ${
                      qualificationAnalysis.missingVolume === 0
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {qualificationAnalysis.missingVolume === 0
                      ? '✓ Ciro Yeterliliği Sağlandı'
                      : `Eksik Ciro: ${formatUsd(qualificationAnalysis.missingVolume ?? 0)}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-slate-900">
                  Ağaç Kök Bayisi: #{selectedMember.global_line_id} {selectedMember.full_name}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Doğrudan Sponsor Olduğu:{' '}
                  <strong className="text-emerald-700 font-mono tabular-nums">
                    {directReferrals.length} Bayi
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Kendisinden Sonraki Alt Ağaç Toplamı:{' '}
                  <strong className="text-slate-900 font-mono tabular-nums">
                    {downlineMembersAfterDealer.length} Bayi
                  </strong>
                </span>
              </div>
              <div className="text-emerald-800 font-medium">
                Üst sponsorların diğer bayileri gizlenmiştir (Sadece kendi alt hattınız gösterilir)
              </div>
            </div>
          </div>
        )}

        {filteredMembers.length === 1 && filteredMembers[0].user_id === selectedMember?.user_id && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4">
            <span>
              Henüz kendi sponsorluğunuzda sizden sonra eklenmiş bir alt bayi bulunmuyor. Yeni bayi
              kaydettiğinizde otomatik olarak sponsoru olursunuz ve burada tek hat ağaç yapısında
              sizden sonra sıralanır.
            </span>
          </div>
        )}

        {orientation === 'horizontal' ? (
          <div className="overflow-x-auto pb-4 pt-2">
            <div className="inline-flex items-stretch gap-3 min-w-full">
              {filteredMembers.map((member, idx) => {
                const isSelected = member.user_id === selectedMember?.user_id;
                const isDirectChildOfSelected =
                  member.sponsor_id === selectedMember?.user_id && !isSelected;
                const sponsorObj = member.sponsor_id
                  ? sortedMembers.find((s) => s.user_id === member.sponsor_id)
                  : null;
                const uplineInfo = uplineDepthMap.get(member.user_id);

                return (
                  <React.Fragment key={member.user_id}>
                    <div
                      onClick={() => {
                        if (isAdminAuthenticated) onSelectMember(member.user_id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (isAdminAuthenticated && (e.key === 'Enter' || e.key === ' ')) {
                          onSelectMember(member.user_id);
                        }
                      }}
                      className={`w-64 shrink-0 rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isAdminAuthenticated ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : isDirectChildOfSelected
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 hover:border-emerald-400'
                          : uplineInfo
                          ? 'bg-amber-50/70 border-amber-300 text-slate-900 hover:border-amber-400'
                          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {isSelected
                              ? `BAŞLANGIÇ (SİZ) · #${member.global_line_id}`
                              : `ALT HAT #${idx} · (Global #${member.global_line_id})`}
                          </span>
                          <span
                            className={isSelected ? 'text-amber-300' : 'text-slate-500'}
                          >
                            {(member.session_credits ?? 0).toLocaleString('tr-TR')} Kredi
                          </span>
                        </div>

                        <div className="min-h-[18px] text-[11px] font-medium">
                          {isSelected && (
                            <span className="text-amber-300">★ Kendi Bayi Kök Noktanız</span>
                          )}
                          {!isSelected && isDirectChildOfSelected && (
                            <span className="text-emerald-800 font-mono tabular-nums">
                              ★ Doğrudan Kaydettiğiniz Bayi (Sponsor: Siz · %20)
                            </span>
                          )}
                          {!isSelected && !isDirectChildOfSelected && (
                            <span className="text-slate-600 font-mono tabular-nums">
                              ↳ Alt Bayinizin Kaydı (Sponsor: {sponsorObj?.full_name || '-'})
                            </span>
                          )}
                        </div>

                        <div>
                          <div
                            className={`font-bold text-sm truncate ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {member.full_name}
                          </div>
                          <div
                            className={`text-xs mt-0.5 truncate ${
                              isSelected ? 'text-slate-300' : 'text-slate-600'
                            }`}
                          >
                            {member.career_level > 0
                              ? `Kariyer Seviyesi ${member.career_level}`
                              : 'Kariyer Öncesi (Aday)'}
                          </div>
                          <div className="mt-1.5">
                            <MemberRegionBadge countryCode={member?.country_code} isSelected={isSelected} />
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-4 pt-3 border-t text-xs font-mono tabular-nums space-y-1 ${
                          isSelected
                            ? 'border-slate-700 text-slate-300'
                            : 'border-slate-100 text-slate-600'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>Sponsoru:</span>
                          <span className="font-semibold truncate max-w-[135px]">
                            {isSelected
                              ? 'Ana Merkez / Üst Hat (Gizli)'
                              : sponsorObj
                              ? sponsorObj.full_name
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paket:</span>
                          <span className="font-semibold truncate max-w-[130px]">
                            {member.highest_package_id
                              ? PACKAGES[member.highest_package_id]?.code || '-'
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Açık Derinlik:</span>
                          <span className="font-semibold">{member.unlocked_depth ?? 1} / 7</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kazanç:</span>
                          <span
                            className={`font-semibold ${
                              isSelected ? 'text-emerald-300' : 'text-slate-900'
                            }`}
                          >
                            {formatUsd(member.wallets?.total_earnings ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {idx < filteredMembers.length - 1 && (
                      <div className="flex items-center justify-center text-slate-300 shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {registrationOrderedMembers.map((member, idx) => {
              const isSelected = member.user_id === selectedMember?.user_id;
              const isDirectChildOfSelected =
                member.sponsor_id === selectedMember?.user_id && !isSelected;
              const sponsorObj = member.sponsor_id
                ? sortedMembers.find((s) => s.user_id === member.sponsor_id)
                : null;

              return (
                <React.Fragment key={member.user_id}>
                  <div
                    onClick={() => {
                      if (isAdminAuthenticated) onSelectMember(member.user_id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (isAdminAuthenticated && (e.key === 'Enter' || e.key === ' ')) {
                        onSelectMember(member.user_id);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isAdminAuthenticated ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : isDirectChildOfSelected
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono tabular-nums shrink-0 border ${
                          isSelected
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <span className="text-[10px] text-slate-400">
                          {isSelected ? 'KÖK' : `ALT #${idx}`}
                        </span>
                        <span className="text-sm font-bold">#{member.global_line_id}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{member.full_name}</span>
                          <MemberRegionBadge countryCode={member?.country_code} />
                          <span
                            className={`text-xs ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            ·{' '}
                            {member.career_level > 0
                              ? `Kariyer Seviyesi ${member.career_level}`
                              : 'Aday'}
                          </span>
                          <span
                            className={`text-xs font-mono tabular-nums ${
                              isSelected ? 'text-amber-300' : 'text-slate-600'
                            }`}
                          >
                            · {(member.session_credits ?? 0).toLocaleString('tr-TR')} Seans Kredisi
                          </span>
                        </div>

                        <div
                          className={`text-xs ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {isSelected ? (
                            <span>
                              Kendi Bayi Hesabınız · Sizden Sonraki Alt Ağaç:{' '}
                              {downlineMembersAfterDealer.length} Bayi
                            </span>
                          ) : (
                            <span>
                              Direkt Sponsoru:{' '}
                              <strong>
                                {sponsorObj
                                  ? `#${sponsorObj.global_line_id} ${sponsorObj.full_name}`
                                  : '-'}
                              </strong>{' '}
                              · Referans Kodu: {member.ref_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 font-mono tabular-nums text-xs shrink-0">
                      {isDirectChildOfSelected && !isSelected && (
                        <div className="text-emerald-800 font-semibold">
                          ★ Doğrudan Sponsorunuz (%20)
                        </div>
                      )}
                      <div className="text-right">
                        <div className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                          Toplam Kazanç
                        </div>
                        <div className="text-sm font-bold">
                          {formatUsd(member.wallets?.total_earnings ?? 0, 2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {idx < registrationOrderedMembers.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowDown className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
