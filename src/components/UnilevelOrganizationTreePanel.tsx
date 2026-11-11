import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Filter,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Award,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Building2,
  Phone,
  Mail,
  MapPin,
  Check,
  AlertTriangle,
  UserCheck,
  UserX,
  Info,
  Maximize2,
  Minimize2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { MonolineMember, SystemStateResponse } from '../types/monoline';
import { getActiveResellerSession } from '../utils/resellerManager';
import { getActiveMemberSession } from '../utils/authManager';

export const CAREER_TIER_CONFIG: Record<
  number,
  { name: string; color: string; bg: string; border: string; text: string; icon: string }
> = {
  1: {
    name: 'Emmâre',
    color: 'slate',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-800',
    icon: '🌱',
  },
  2: {
    name: 'Levvâme',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    icon: '🌿',
  },
  3: {
    name: 'Mülhime',
    color: 'teal',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    text: 'text-teal-800',
    icon: '✨',
  },
  4: {
    name: 'Mutmainne',
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-800',
    icon: '💎',
  },
  5: {
    name: 'Râziye',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    icon: '🏆',
  },
  6: {
    name: 'Marziyye',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-800',
    icon: '👑',
  },
  7: {
    name: 'Kâmile (Sâfiye)',
    color: 'amber',
    bg: 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200',
    border: 'border-amber-400',
    text: 'text-amber-950 font-black',
    icon: '🌟',
  },
};

export interface UnilevelOrganizationTreePanelProps {
  mode: 'admin' | 'dealer';
  currentDealerId?: string;
  onBack?: () => void;
  embedded?: boolean;
  onMemberUpdated?: () => void;
}

export const UnilevelOrganizationTreePanel: React.FC<UnilevelOrganizationTreePanelProps> = ({
  mode,
  currentDealerId,
  onBack,
  embedded = false,
  onMemberUpdated,
}) => {
  const [members, setMembers] = useState<MonolineMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rootUserId, setRootUserId] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'UNILEVEL_TREE' | 'MONOLINE_QUEUE' | 'TABLE_VIEW' | 'CAREER_SUMMARY'>('UNILEVEL_TREE');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCareer, setFilterCareer] = useState<number | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PASSIVE'>('ALL');
  const [filterLeg, setFilterLeg] = useState<'ALL' | 'LEFT' | 'RIGHT' | 'AUTO'>('ALL');

  // Edit / Management Modal State (Admin Mode)
  const [editingMember, setEditingMember] = useState<MonolineMember | null>(null);
  const [editActiveStatus, setEditActiveStatus] = useState<boolean>(true);
  const [editCareerLevel, setEditCareerLevel] = useState<number>(1);
  const [editSponsorId, setEditSponsorId] = useState<string>('');
  const [editAssignedLeg, setEditAssignedLeg] = useState<'LEFT' | 'RIGHT' | 'AUTO'>('AUTO');
  const [editGlobalLineId, setEditGlobalLineId] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Auto-hide notification
  useEffect(() => {
    if (!statusNotification) return;
    const timer = setTimeout(() => setStatusNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [statusNotification]);

  // Load initial members from API
  const fetchState = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/state');
      if (res.ok) {
        const data: SystemStateResponse = await res.json();
        if (Array.isArray(data.members)) {
          setMembers(data.members);
          initRootUser(data.members);
        }
      }
    } catch (err: any) {
      console.warn('[UnilevelTreePanel] Veri çekme uyarısı:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initRootUser = (mList: MonolineMember[]) => {
    if (mList.length === 0) return;
    if (mode === 'dealer') {
      const activeRes = getActiveResellerSession();
      const activeMem = getActiveMemberSession();
      const targetId =
        currentDealerId ||
        (activeRes?.uid && mList.find((m) => m.user_id === activeRes.uid)?.user_id) ||
        (activeMem?.uid && mList.find((m) => m.user_id === activeMem.uid)?.user_id) ||
        mList[0]?.user_id;
      setRootUserId(targetId);
      setExpandedNodes(new Set([targetId]));
    } else {
      // Admin defaults to system root (USR-ADMIN or first member)
      const adminMember = mList.find((m) => m.user_id === 'USR-ADMIN') || mList[0];
      setRootUserId(adminMember.user_id);
      // Auto-expand first 2 levels
      const toExpand = new Set<string>([adminMember.user_id]);
      mList
        .filter((m) => m.sponsor_id === adminMember.user_id)
        .forEach((m) => toExpand.add(m.user_id));
      setExpandedNodes(toExpand);
    }
  };

  useEffect(() => {
    fetchState();

    const handleStateUpdated = (e: Event) => {
      const incoming = (e as CustomEvent<SystemStateResponse>).detail;
      if (incoming && Array.isArray(incoming.members)) {
        setMembers(incoming.members);
      }
    };
    window.addEventListener('aurabio_monoline_state_updated', handleStateUpdated);
    return () => {
      window.removeEventListener('aurabio_monoline_state_updated', handleStateUpdated);
    };
  }, [mode, currentDealerId]);

  // Map of downline counts and direct referrals
  const membersBySponsor = useMemo(() => {
    const map = new Map<string, MonolineMember[]>();
    for (const m of members) {
      const spId = m.sponsor_id || '__ROOT__';
      const existing = map.get(spId) || [];
      existing.push(m);
      map.set(spId, existing);
    }
    return map;
  }, [members]);

  const memberMap = useMemo(() => {
    const map = new Map<string, MonolineMember>();
    for (const m of members) {
      map.set(m.user_id, m);
    }
    return map;
  }, [members]);

  // Recursively calculate total downline count for any member
  const getSubtreeCount = (userId: string): number => {
    const directs = membersBySponsor.get(userId) || [];
    let count = directs.length;
    for (const d of directs) {
      count += getSubtreeCount(d.user_id);
    }
    return count;
  };

  // Recursively calculate total subtree volume for any member
  const getSubtreeVolume = (userId: string): number => {
    const directs = membersBySponsor.get(userId) || [];
    let vol = 0;
    for (const d of directs) {
      vol += (d.personal_volume || 0) + getSubtreeVolume(d.user_id);
    }
    return vol;
  };

  // Toggle expand / collapse
  const toggleNode = (userId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    members.forEach((m) => all.add(m.user_id));
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(rootUserId ? [rootUserId] : []));
  };

  // Open Edit Modal for Admin
  const handleOpenEdit = (m: MonolineMember) => {
    if (mode !== 'admin') return;
    setEditingMember(m);
    setEditActiveStatus(m.is_active !== false);
    setEditCareerLevel(m.career_level || 1);
    setEditSponsorId(m.sponsor_id || '');
    setEditAssignedLeg(m.assigned_leg || 'AUTO');
    setEditGlobalLineId(m.global_line_id || 1);
  };

  // One-click quick toggle Active / Passive (Admin mode)
  const handleQuickToggleActive = async (m: MonolineMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mode !== 'admin') return;

    const newActiveState = !m.is_active;
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('aurabio_admin_token_v1') || sessionStorage.getItem('aurabio_admin_jwt');
      const res = await fetch(`/api/v1/admin/members/${m.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          is_active: newActiveState,
        }),
      });

      if (res.ok) {
        // Optimistic local update
        setMembers((prev) =>
          prev.map((item) =>
            item.user_id === m.user_id ? { ...item, is_active: newActiveState } : item
          )
        );
        setStatusNotification({
          type: 'success',
          message: `${m.full_name} bayisi ${newActiveState ? 'AKTİF' : 'PASİF'} duruma getirildi. Sistem anında güncellendi!`,
        });
        onMemberUpdated?.();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Güncelleme başarısız oldu.');
      }
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: `Hata: ${err.message || 'Yetki güncellenemedi.'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Full Edit Form
  const handleSaveMemberEdit = async () => {
    if (!editingMember || mode !== 'admin') return;
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('aurabio_admin_token_v1') || sessionStorage.getItem('aurabio_admin_jwt');
      const payload: Record<string, any> = {
        is_active: editActiveStatus,
        career_level: editCareerLevel,
        manual_career_override: editCareerLevel,
        sponsor_id: editSponsorId || null,
        assigned_leg: editAssignedLeg,
        target_line_id: editGlobalLineId,
      };

      const res = await fetch(`/api/v1/admin/members/${editingMember.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.state && Array.isArray(resData.state.members)) {
          setMembers(resData.state.members);
        } else {
          // Optimistic local update
          setMembers((prev) =>
            prev.map((item) =>
              item.user_id === editingMember.user_id
                ? {
                    ...item,
                    is_active: editActiveStatus,
                    career_level: editCareerLevel,
                    career_title: CAREER_TIER_CONFIG[editCareerLevel]?.name || item.career_title,
                    sponsor_id: editSponsorId || null,
                    assigned_leg: editAssignedLeg,
                    global_line_id: editGlobalLineId,
                  }
                : item
            )
          );
        }

        setStatusNotification({
          type: 'success',
          message: `${editingMember.full_name} ağaç yerleşimi, kariyeri ve yetkileri başarıyla güncellendi!`,
        });
        setEditingMember(null);
        onMemberUpdated?.();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Güncelleme hatası.');
      }
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: `Kayıt hatası: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Top Statistics
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.is_active !== false).length;
    const passive = total - active;
    const totalPGV = members.reduce((sum, m) => sum + (m.personal_volume || 0), 0);
    const careerCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    members.forEach((m) => {
      const lvl = m.career_level || 1;
      careerCounts[lvl] = (careerCounts[lvl] || 0) + 1;
    });

    return { total, active, passive, totalPGV, careerCounts };
  }, [members]);

  // Filtered members for Table & Queue view
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          m.full_name.toLowerCase().includes(term) ||
          m.user_id.toLowerCase().includes(term) ||
          (m.ref_code && m.ref_code.toLowerCase().includes(term)) ||
          (m.city && m.city.toLowerCase().includes(term));
        if (!match) return false;
      }
      if (filterCareer !== 'ALL' && m.career_level !== filterCareer) return false;
      if (filterStatus === 'ACTIVE' && m.is_active === false) return false;
      if (filterStatus === 'PASSIVE' && m.is_active !== false) return false;
      if (filterLeg !== 'ALL' && (m.assigned_leg || 'AUTO') !== filterLeg) return false;
      return true;
    });
  }, [members, searchTerm, filterCareer, filterStatus, filterLeg]);

  // Unilevel Level Statistics for dealer mode
  const unilevelDepthStats = useMemo(() => {
    if (!rootUserId) return [];
    const depths: { depth: number; members: MonolineMember[]; rate: number; volume: number }[] = [];
    const rates = [7, 5, 4, 3, 2, 2, 2];

    let currentLevelIds = new Set<string>([rootUserId]);
    for (let d = 1; d <= 7; d++) {
      const nextLevelMembers: MonolineMember[] = [];
      const nextLevelIds = new Set<string>();

      for (const m of members) {
        if (m.sponsor_id && currentLevelIds.has(m.sponsor_id)) {
          nextLevelMembers.push(m);
          nextLevelIds.add(m.user_id);
        }
      }

      const vol = nextLevelMembers.reduce((sum, m) => sum + (m.personal_volume || 0), 0);
      depths.push({
        depth: d,
        members: nextLevelMembers,
        rate: rates[d - 1] || 2,
        volume: vol,
      });

      currentLevelIds = nextLevelIds;
    }
    return depths;
  }, [members, rootUserId]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (userId: string, depth: number = 0) => {
    const m = memberMap.get(userId);
    if (!m) return null;

    const children = membersBySponsor.get(userId) || [];
    const isExpanded = expandedNodes.has(userId);
    const hasChildren = children.length > 0;
    const directCount = children.length;
    const totalTeamCount = getSubtreeCount(userId);
    const totalTeamVolume = getSubtreeVolume(userId);
    const careerCfg = CAREER_TIER_CONFIG[m.career_level || 1] || CAREER_TIER_CONFIG[1];
    const isRoot = userId === rootUserId;

    // Filters check
    const matchesSearch =
      !searchTerm ||
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCareer = filterCareer === 'ALL' || m.career_level === filterCareer;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && m.is_active !== false) ||
      (filterStatus === 'PASSIVE' && m.is_active === false);

    const isMatch = matchesSearch && matchesCareer && matchesStatus;

    return (
      <div key={userId} className="relative transition-all">
        {/* Node Card */}
        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
            isRoot
              ? 'bg-slate-900 text-white border-slate-700 shadow-lg ring-2 ring-emerald-500/50'
              : m.is_active === false
              ? 'bg-slate-100/90 border-slate-300 text-slate-500 opacity-80'
              : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-300 hover:shadow-sm'
          } ${!isMatch ? 'opacity-40 grayscale-30' : ''}`}
        >
          {/* Expand / Collapse Button */}
          <div className="pt-0.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(userId)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isRoot
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title={isExpanded ? 'Alt ekibi daralt' : 'Alt ekibi genişlet'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm tracking-tight truncate">{m.full_name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isRoot ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                {m.user_id}
              </span>

              {/* Status Badge */}
              {m.is_active !== false ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  AKTİF
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="w-3 h-3" />
                  PASİF
                </span>
              )}

              {/* Career Badge */}
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${careerCfg.bg} ${careerCfg.border} ${careerCfg.text}`}>
                <span>{careerCfg.icon}</span>
                <span>{m.career_level || 1}. {careerCfg.name}</span>
              </span>

              {/* Leg Badge */}
              {m.assigned_leg && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  m.assigned_leg === 'LEFT' ? 'bg-blue-100 text-blue-800' : m.assigned_leg === 'RIGHT' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {m.assigned_leg === 'LEFT' ? '⬅️ Sol Kol' : m.assigned_leg === 'RIGHT' ? '➡️ Sağ Kol' : '⚡ Otomatik'}
                </span>
              )}
            </div>

            {/* Sub-line: Stats & Sponsor */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1.5 opacity-90">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Direkt: <strong>{directCount}</strong> Bayi</span>
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                <span>Toplam Alt Ekip: <strong>{totalTeamCount}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Kişisel Ciro: <strong>${(m.personal_volume || 0).toLocaleString('tr-TR')}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-500" />
                <span>Ekip Hacmi: <strong>${totalTeamVolume.toLocaleString('tr-TR')}</strong></span>
              </span>
              {m.sponsor_id && (
                <span className="text-[11px] text-slate-400">
                  Sponsor: <span className="font-semibold text-slate-600">{memberMap.get(m.sponsor_id)?.full_name || m.sponsor_id}</span>
                </span>
              )}
              {m.city && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>{m.city}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {mode === 'admin' ? (
              <>
                {/* Quick Toggle Active/Passive */}
                <button
                  type="button"
                  onClick={(e) => handleQuickToggleActive(m, e)}
                  disabled={isSaving}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                    m.is_active !== false
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  }`}
                  title={m.is_active !== false ? 'Bayiyi Pasife Al' : 'Bayiyi Aktif Yap'}
                >
                  {m.is_active !== false ? (
                    <>
                      <UserX className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pasif Yap</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Aktif Yap</span>
                    </>
                  )}
                </button>

                {/* Edit & Career/Sponsor Assignment */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(m)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yönet</span>
                </button>

                {/* Focus as Root */}
                {!isRoot && (
                  <button
                    type="button"
                    onClick={() => {
                      setRootUserId(m.user_id);
                      setExpandedNodes(new Set([m.user_id]));
                    }}
                    className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Bu bayiyi ağacın kökü yap"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              /* Dealer View Actions */
              <>
                {!isRoot && (
                  <button
                    type="button"
                    onClick={() => {
                      setRootUserId(m.user_id);
                      setExpandedNodes(new Set([m.user_id]));
                    }}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Alt Ekibini Gör
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Children Sub-tree with indentation line */}
        {hasChildren && isExpanded && (
          <div className="pl-6 border-l-2 border-slate-200 ml-5 my-2 space-y-2">
            {children.map((child) => renderTreeNode(child.user_id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-full space-y-5 animate-in fade-in duration-200 ${embedded ? '' : 'min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8'}`}>
      {/* TOP HEADER WITH BACK BUTTON & TITLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Prominent Back Button */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                <span>← Geri Dön</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <GitBranch className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Unilevel &amp; Monoline Organizasyon Ağaç Yönetimi</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase">
                      {mode === 'admin' ? 'Yönetici Tam Yetkili' : 'Bayi Organizasyonu'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mode === 'admin'
                      ? 'Tüm bayilerin ağaç yapısı, sponsor hiyerarşisi, kariyer atamaları, aktif/pasif yetkisi ve gerçek zamanlı sistem yönetimi.'
                      : 'Kendi kurduğunuz 7 derinlik sponsorluk ağacı, alt bayileriniz, kariyer basamakları ve ekip ciro katkıları.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchState}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            {/* Reset to Default Root Button */}
            {rootUserId !== (members[0]?.user_id || 'USR-ADMIN') && (
              <button
                type="button"
                onClick={() => {
                  const defaultRoot = mode === 'dealer' && currentDealerId ? currentDealerId : (members[0]?.user_id || 'USR-ADMIN');
                  setRootUserId(defaultRoot);
                  setExpandedNodes(new Set([defaultRoot]));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <span>Ana Köke Dön</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusNotification && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2 ${
              statusNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusNotification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotification(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4 KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Toplam Kayıtlı Bayi</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-400 font-sans">Bayi</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <span className="text-emerald-700 font-bold">{stats.active} Aktif</span>
              <span className="text-slate-300">·</span>
              <span className="text-red-700 font-bold">{stats.passive} Pasif</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Toplam Sistem Cirosu (PGV)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-800">
                ${stats.totalPGV.toLocaleString('tr-TR')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">7 Derinlik Ciro Havuzu</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Kariyer Zirvesi (Liderlik)</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span>🌟 Kâmile: <strong>{stats.careerCounts[7] || 0}</strong></span>
              <span className="text-slate-300">·</span>
              <span>👑 Marziyye: <strong>{stats.careerCounts[6] || 0}</strong></span>
            </div>
            <p className="text-[11px] text-slate-500">
              Râziye: {stats.careerCounts[5] || 0} · Mutmainne: {stats.careerCounts[4] || 0}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Ağaç Yönetim Durumu</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Anında Canlı Yansıma</span>
            </div>
            <p className="text-[11px] text-slate-500">PostgreSQL-18 &amp; In-Memory</p>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('UNILEVEL_TREE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'UNILEVEL_TREE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Unilevel 7 Derinlik Ağacı</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MONOLINE_QUEUE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MONOLINE_QUEUE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Monoline Küresel Sıra</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TABLE_VIEW')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'TABLE_VIEW'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>3. Bayi &amp; Sponsor Tablosu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CAREER_SUMMARY')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CAREER_SUMMARY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Kariyer Basamak Özeti</span>
            </button>
          </div>

          {/* Quick Tree Controls */}
          {activeTab === 'UNILEVEL_TREE' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Tümünü Genişlet
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Tümünü Daralt
              </button>
            </div>
          )}
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Bayi adı, kod, şehir ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <select
              value={filterCareer}
              onChange={(e) =>
                setFilterCareer(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Tüm Kariyerler (1–7)</option>
              {Object.entries(CAREER_TIER_CONFIG).map(([lvl, cfg]) => (
                <option key={lvl} value={lvl}>
                  {lvl}. Seviye - {cfg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Tüm Durumlar (Aktif &amp; Pasif)</option>
              <option value="ACTIVE">Sadece Aktif Bayiler</option>
              <option value="PASSIVE">Sadece Pasif Bayiler</option>
            </select>
          </div>

          <div>
            <select
              value={filterLeg}
              onChange={(e) => setFilterLeg(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Tüm Kol Yerleşimleri</option>
              <option value="LEFT">Sol Kol</option>
              <option value="RIGHT">Sağ Kol</option>
              <option value="AUTO">Otomatik Dengeleyici</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE UNILEVEL TREE */}
      {activeTab === 'UNILEVEL_TREE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hiyerarşik Unilevel Ağaç Görünümü
              </h3>
              <p className="text-xs text-slate-500">
                Kök Bayi: <strong className="text-slate-800">{memberMap.get(rootUserId)?.full_name || rootUserId}</strong> ({rootUserId})
              </p>
            </div>

            {/* Breadcrumbs or quick root switch */}
            {mode === 'admin' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Kök Bayi Değiştir:</span>
                <select
                  value={rootUserId}
                  onChange={(e) => {
                    setRootUserId(e.target.value);
                    setExpandedNodes(new Set([e.target.value]));
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs"
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} ({m.user_id}) - {m.career_title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tree Structure Output */}
          <div className="overflow-x-auto p-2">
            {rootUserId && renderTreeNode(rootUserId, 0)}
          </div>
        </div>
      )}

      {/* TAB 2: MONOLINE QUEUE ORDER */}
      {activeTab === 'MONOLINE_QUEUE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monoline Küresel Tek Hat Sıra Kuyruğu (Global Line ID)
              </h3>
              <p className="text-xs text-slate-500">
                Dünya genelinde bayilerin sisteme giriş sıralaması. Her siparişte arkasından gelen ilk 7 kişi %5 havuzdan teşvik primi alır.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Kuyruktaki Toplam Bayi: <strong>{filteredMembers.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Sıra #</th>
                  <th className="py-2.5 px-3">Bayi Bilgisi</th>
                  <th className="py-2.5 px-3">Kariyer</th>
                  <th className="py-2.5 px-3">Sponsor</th>
                  <th className="py-2.5 px-3 text-right">Kişisel Ciro</th>
                  <th className="py-2.5 px-3 text-right">Ekip Cirosu</th>
                  <th className="py-2.5 px-3 text-center">Durum</th>
                  {mode === 'admin' && <th className="py-2.5 px-3 text-right">Yönetici İşlemleri</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMembers
                  .sort((a, b) => (a.global_line_id || 0) - (b.global_line_id || 0))
                  .map((m) => {
                    const careerCfg = CAREER_TIER_CONFIG[m.career_level || 1] || CAREER_TIER_CONFIG[1];
                    const sp = m.sponsor_id ? memberMap.get(m.sponsor_id) : null;
                    return (
                      <tr key={m.user_id} className={`hover:bg-slate-50/80 ${m.is_active === false ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            #{m.global_line_id}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <div className="font-bold text-slate-900">{m.full_name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {m.user_id} · {m.city || 'Türkiye'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${careerCfg.bg} ${careerCfg.border} ${careerCfg.text}`}>
                            <span>{careerCfg.icon}</span>
                            <span>{careerCfg.name}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-700">
                          {sp ? sp.full_name : m.sponsor_id || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          ${(m.personal_volume || 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-800 font-bold">
                          ${(m.group_volume || 0).toLocaleString('tr-TR')}
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {m.is_active !== false ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Aktif
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              Pasif
                            </span>
                          )}
                        </td>
                        {mode === 'admin' && (
                          <td className="py-3 px-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickToggleActive(m)}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer ${
                                  m.is_active !== false ? 'text-amber-800 bg-amber-50 hover:bg-amber-100' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {m.is_active !== false ? 'Pasif' : 'Aktif'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(m)}
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                              >
                                Düzenle
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERS & SPONSORS TABLE */}
      {activeTab === 'TABLE_VIEW' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tüm Bayiler &amp; Sponsorluk İlişki Matrisi
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'admin'
                  ? 'Tüm bayilerin kariyer seviyeleri, sponsorları ve aktiflik durumları.'
                  : 'Kişisel organizasyonunuzdaki bayilerin detay dökümü.'}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Listelenen: <strong>{filteredMembers.length}</strong> Bayi
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">ID / Kod</th>
                  <th className="py-2.5 px-3">Ad Soyad</th>
                  <th className="py-2.5 px-3">Kariyer</th>
                  <th className="py-2.5 px-3">Sponsor Bilgisi</th>
                  <th className="py-2.5 px-3">Kol Tercihi</th>
                  <th className="py-2.5 px-3 text-right">Direkt Üye</th>
                  <th className="py-2.5 px-3 text-right">Bakiye</th>
                  <th className="py-2.5 px-3 text-center">Durum</th>
                  {mode === 'admin' && <th className="py-2.5 px-3 text-right">İşlemler</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredMembers.map((m) => {
                  const careerCfg = CAREER_TIER_CONFIG[m.career_level || 1] || CAREER_TIER_CONFIG[1];
                  const sp = m.sponsor_id ? memberMap.get(m.sponsor_id) : null;
                  const directCount = (membersBySponsor.get(m.user_id) || []).length;
                  return (
                    <tr key={m.user_id} className={`hover:bg-slate-50/80 ${m.is_active === false ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{m.user_id}</div>
                        <div className="text-[10px] text-slate-400">{m.ref_code || '-'}</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-900">{m.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${careerCfg.bg} ${careerCfg.border} ${careerCfg.text}`}>
                          <span>{careerCfg.icon}</span>
                          <span>{careerCfg.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700">
                        {sp ? (
                          <div>
                            <span className="font-semibold text-slate-900">{sp.full_name}</span>
                            <span className="block text-[10px] font-mono text-slate-400">{sp.user_id}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">{m.sponsor_id || 'Kök / Yok'}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          m.assigned_leg === 'LEFT' ? 'bg-blue-50 text-blue-800 border border-blue-200' : m.assigned_leg === 'RIGHT' ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {m.assigned_leg === 'LEFT' ? 'Sol Kol' : m.assigned_leg === 'RIGHT' ? 'Sağ Kol' : 'Otomatik'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {directCount}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800">
                        ${((m.wallets?.total_earnings || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {m.is_active !== false ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            Pasif
                          </span>
                        )}
                      </td>
                      {mode === 'admin' && (
                        <td className="py-3 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleActive(m)}
                              className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${
                                m.is_active !== false ? 'text-amber-800 bg-amber-50 hover:bg-amber-100' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {m.is_active !== false ? 'Pasif' : 'Aktif'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                            >
                              Yönet
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CAREER SUMMARY & UNILEVEL DEPTHS */}
      {activeTab === 'CAREER_SUMMARY' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              7 Derinlik Unilevel Komisyon Dağılımı &amp; Ciro Katkısı
            </h3>
            <p className="text-xs text-slate-500">
              Sponsorluk hattınızdaki 1. kademeden 7. kademeye kadar gerçekleşen derinlik oranları ve toplam ciro katkıları.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {unilevelDepthStats.map((lvl) => (
              <div
                key={lvl.depth}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-center"
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {lvl.depth}. Derinlik
                </div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  %{lvl.rate}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {lvl.members.length} Bayi
                </div>
                <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  ${lvl.volume.toLocaleString('tr-TR')}
                </div>
              </div>
            ))}
          </div>

          {/* 7 Nefis Mertebesi Kariyer Basamakları Tablosu */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              7 Nefis Mertebesi Kariyer Kriterleri &amp; Açtığı Derinlikler
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(CAREER_TIER_CONFIG).map(([lvlStr, cfg]) => {
                const lvl = Number(lvlStr);
                const count = stats.careerCounts[lvl] || 0;
                return (
                  <div key={lvl} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <span>{cfg.icon}</span>
                        <span>{lvl}. Seviye: {cfg.name}</span>
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {count} Bayi
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>Açılan Unilevel Derinlik: <strong>{lvl}. Derinlik</strong></div>
                      <div>Açılan Monoline Derinlik: <strong>{lvl}. Üst Sıra</strong></div>
                      <div>Şart: <strong>Kişisel Aktiflik + Belirlenen Ekip Hacmi (PGV)</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT & MANAGEMENT MODAL (ADMIN MODE ONLY) */}
      {editingMember && mode === 'admin' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bayi &amp; Ağaç Yerleşimi Yönetimi
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMember.full_name} ({editingMember.user_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. AKTİF / PASİF DURUMU */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="font-bold text-slate-800 block">
                  Bayi Yetki &amp; Aktiflik Durumu *
                </label>
                <p className="text-[11px] text-slate-500">
                  Bayiyi silmek yerine pasife alabilirsiniz. Pasife alınan bayinin alt ekibi ve verileri korunur, sadece komisyon hak edişi durdurulur ve havuza aktarılır.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditActiveStatus(true)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editActiveStatus
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="w-4 h-4 mx-auto mb-0.5 inline-block" />
                    <span>AKTİF (Yetkili)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditActiveStatus(false)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      !editActiveStatus
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4 mx-auto mb-0.5 inline-block" />
                    <span>PASİF (Durduruldu)</span>
                  </button>
                </div>
              </div>

              {/* 2. KARİYER MERTEBESİ ATAMA */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Kariyer Mertebesi Belirle / Ata *
                </label>
                <select
                  value={editCareerLevel}
                  onChange={(e) => setEditCareerLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {Object.entries(CAREER_TIER_CONFIG).map(([lvl, cfg]) => (
                    <option key={lvl} value={lvl}>
                      {lvl}. Seviye - {cfg.name} (Açtığı Derinlik: {lvl})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Yönetici istediği bayiye doğrudan dilediği kariyeri manuel olarak atayabilir.
                </p>
              </div>

              {/* 3. SPONSOR DEĞİŞTİRME */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Sponsor Değiştir (Ağaçta Yeni Ebeveyne Bağla) *
                </label>
                <select
                  value={editSponsorId}
                  onChange={(e) => setEditSponsorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Sponsor Yok (Kök Seviye)</option>
                  {members
                    .filter((m) => m.user_id !== editingMember.user_id)
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.full_name} ({m.user_id}) - {m.career_title}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Sponsor değiştirildiğinde bayinin alt ekibi de bayiyi takip eder ve hiyerarşi anında yeniden hesaplanır.
                </p>
              </div>

              {/* 4. KOL YERLEŞİMİ & MONOLINE SIRA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Kol Yerleşimi</label>
                  <select
                    value={editAssignedLeg}
                    onChange={(e) => setEditAssignedLeg(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="AUTO">⚡ Otomatik Dengeleyici</option>
                    <option value="LEFT">⬅️ Sol Kol</option>
                    <option value="RIGHT">➡️ Sağ Kol</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">Monoline Sıra No</label>
                  <input
                    type="number"
                    min={1}
                    max={members.length}
                    value={editGlobalLineId}
                    onChange={(e) => setEditGlobalLineId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveMemberEdit}
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Anında Yansıt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
