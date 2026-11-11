import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  CreditCard,
  Percent,
  Coins,
  DollarSign,
  Users,
  FileText,
  Share2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Plus,
  Minus,
  Edit2,
  RefreshCw,
  Sparkles,
  QrCode,
  Globe,
  Briefcase,
  MapPin,
  Send,
  Loader2,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { 
  Reseller, 
  CommissionTransaction, 
  CreditTransaction,
  getReferredUsersForReseller, 
  getCommissionsForReseller,
  getCreditLogsForReseller,
  subscribeToReseller,
  subscribeToResellerCreditLogs,
  adminSaveReseller,
  adminUpdateCommissionStatus,
  adminAdjustDealerCredits,
  generateReferralLink,
  generateBusinessPresentationLink,
  generateTechnicalReportLink,
  generateRegisterLink,
  generateBusinessCardLink,
  generateBulkMarketingMessage,
  generateWhatsAppShareUrl,
  generateTelegramShareUrl
} from '../utils/resellerManager';
import { 
  DealerPackageOrder, 
  getAllDealerPackageOrders 
} from '../utils/dealerOrderManager';
import { UserMember, getLocalMembersDirectory, saveToLocalMembersDirectory } from '../utils/authManager';
import { doc, setDoc, db } from '../lib/db';
import { formatUsd } from '../utils/currency';

interface ResellerDetailModalProps {
  reseller: Reseller | null;
  onClose: () => void;
  onUpdateReseller?: (updated: Reseller) => void;
}

export const ResellerDetailModal: React.FC<ResellerDetailModalProps> = ({
  reseller,
  onClose,
  onUpdateReseller
}) => {
  if (!reseller) return null;

  // Active sub-tab state inside details modal
  const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'referred' | 'commissions' | 'orders' | 'marketing'>('profile');
  
  // Local editable copy of current reseller
  const [currentReseller, setCurrentReseller] = useState<Reseller>(reseller);
  
  // Data lists
  const [referredUsers, setReferredUsers] = useState<UserMember[]>([]);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [dealerOrders, setDealerOrders] = useState<DealerPackageOrder[]>([]);
  const [associatedMember, setAssociatedMember] = useState<UserMember | null>(null);
  const [creditLogs, setCreditLogs] = useState<CreditTransaction[]>([]);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quick Action Forms State
  const [creditAmountInput, setCreditAmountInput] = useState<string>('30');
  const [editCommissionRate, setEditCommissionRate] = useState<number>(reseller.commissionRate || 20);
  const [notesInput, setNotesInput] = useState<string>(reseller.notes || '');
  const [bankNameInput, setBankNameInput] = useState<string>(reseller.bankInfo?.bankName || '');
  const [accountHolderInput, setAccountHolderInput] = useState<string>(reseller.bankInfo?.accountHolder || reseller.resellerName);
  const [ibanInput, setIbanInput] = useState<string>(reseller.bankInfo?.iban || '');

  // Copy feedbacks
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load all deep data related to this dealer
  const loadDeepData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch referred users
      const users = await getReferredUsersForReseller(reseller.uid, reseller.referralCode);
      setReferredUsers(users);

      // 2. Fetch commissions
      const comms = await getCommissionsForReseller(reseller.uid);
      setCommissions(comms);

      // 3. Fetch orders
      const allOrders = await getAllDealerPackageOrders();
      const myOrders = allOrders.filter(
        o => o.resellerId === reseller.uid || Boolean(o.resellerEmail && reseller.email && o.resellerEmail.toLowerCase() === reseller.email.toLowerCase())
      );
      setDealerOrders(myOrders);

      // 4. Find associated user account in local members directory
      const allMembers = getLocalMembersDirectory();
      const matched = allMembers.find(
        m => m.uid === reseller.uid || Boolean(m.email && reseller.email && m.email.toLowerCase() === reseller.email.toLowerCase())
      );
      if (matched) {
        setAssociatedMember(matched);
      }
    } catch (err) {
      console.error('Error loading deep dealer data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    setCurrentReseller(reseller);
    setEditCommissionRate(reseller.commissionRate || 20);
    setNotesInput(reseller.notes || '');
    setBankNameInput(reseller.bankInfo?.bankName || '');
    setAccountHolderInput(reseller.bankInfo?.accountHolder || reseller.resellerName);
    setIbanInput(reseller.bankInfo?.iban || '');
    loadDeepData();
  }, [reseller]);

  // LIVE SYNC: Real-time Firestore listener for this dealer's balance, scan stats and audit trail.
  // The admin screen updates instantly whenever the dealer scans on any device (no manual refresh).
  useEffect(() => {
    if (!reseller?.uid) return;

    let isActive = true;
    setIsLiveSynced(false);

    // Initial offline-friendly fetch of the dealer's credit history
    getCreditLogsForReseller(reseller.uid)
      .then(logs => { if (isActive) setCreditLogs(logs); })
      .catch(() => {});

    const unsubReseller = subscribeToReseller(reseller.uid, (updated) => {
      if (!isActive || !updated) return;
      setCurrentReseller(prev => prev ? {
        ...prev,
        creditsBalance: typeof updated.creditsBalance === 'number' ? updated.creditsBalance : prev.creditsBalance,
        totalScans: typeof updated.totalScans === 'number' ? updated.totalScans : prev.totalScans,
        lastScanAt: updated.lastScanAt || prev.lastScanAt,
        status: updated.status || prev.status,
        updatedAt: updated.updatedAt || prev.updatedAt
      } : { ...updated });
      setIsLiveSynced(true);
    });

    const unsubLogs = subscribeToResellerCreditLogs(reseller.uid, (logs) => {
      if (isActive) setCreditLogs(logs);
    });

    // Keep local audit mirror consistent with realtime source
    const handleLogsUpdated = () => {
      if (!isActive) return;
      getCreditLogsForReseller(reseller.uid)
        .then(logs => { if (isActive) setCreditLogs(logs); })
        .catch(() => {});
    };
    window.addEventListener('aurabio_credit_logs_updated', handleLogsUpdated);

    return () => {
      isActive = false;
      unsubReseller();
      unsubLogs();
      window.removeEventListener('aurabio_credit_logs_updated', handleLogsUpdated);
    };
  }, [reseller?.uid]);

  const showSuccessNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Quick Credit Addition / Deduction with Audit Logging
  const handleModifyCredits = async (delta: number) => {
    setIsSaving(true);
    try {
      const result = await adminAdjustDealerCredits(
        currentReseller.uid,
        delta,
        `Yönetici Detay Paneli: ${delta > 0 ? `+${delta} Seans Kredi Yüklendi` : `${delta} Seans Kredi Düşürüldü`}`,
        'Sistem Yöneticisi'
      );

      if (result.success) {
        const updatedReseller: Reseller = {
          ...currentReseller,
          creditsBalance: result.newBalance,
          updatedAt: new Date().toISOString()
        };
        setCurrentReseller(updatedReseller);
        onUpdateReseller?.(updatedReseller);
        showSuccessNotification(`Kredi bakiyesi güncellendi: ${result.newBalance} Seans`);
      } else {
        alert('Kredi güncellenirken hata oluştu: ' + (result.message || 'Bilinmeyen hata'));
      }
    } catch (err) {
      console.error('Error modifying credits:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Commission Rate & Notes & Bank Details
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated: Reseller = {
        ...currentReseller,
        commissionRate: Number(editCommissionRate) || 20,
        notes: notesInput.trim(),
        bankInfo: {
          bankName: bankNameInput.trim(),
          accountHolder: accountHolderInput.trim(),
          iban: ibanInput.trim().toUpperCase()
        },
        updatedAt: new Date().toISOString()
      };

      const ok = await adminSaveReseller(updated);
      if (ok) {
        setCurrentReseller(updated);
        onUpdateReseller?.(updated);
        showSuccessNotification('Bayi bilgileri ve finansal ayarları başarıyla kaydedildi.');
      } else {
        alert('Bayi bilgileri kaydedilemedi.');
      }
    } catch (err) {
      console.error('Error saving reseller settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Reseller Status (Active / Suspended)
  const handleToggleStatus = async () => {
    setIsSaving(true);
    const newStatus = currentReseller.status === 'active' ? 'suspended' : 'active';
    try {
      const updated: Reseller = {
        ...currentReseller,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      const ok = await adminSaveReseller(updated);
      if (ok) {
        setCurrentReseller(updated);
        onUpdateReseller?.(updated);
        showSuccessNotification(`Bayi durumu "${newStatus === 'active' ? 'Aktif' : 'Askıya Alındı'}" olarak güncellendi.`);
      }
    } catch (err) {
      console.error('Error changing status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Commission Status Change (Admin Approval / Payment)
  const handleCommissionStatusChange = async (
    transactionId: string, 
    newStatus: 'pending' | 'approved' | 'paid' | 'rejected'
  ) => {
    setIsSaving(true);
    try {
      const ok = await adminUpdateCommissionStatus(transactionId, newStatus);
      if (ok) {
        showSuccessNotification(`Komisyon kaydı durumu güncellendi: ${newStatus.toUpperCase()}`);
        await loadDeepData();
      }
    } catch (err) {
      console.error('Error updating commission status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct WhatsApp Link to Dealer
  const rawPhone = (currentReseller.phone || associatedMember?.phone || '').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('90') ? rawPhone : (rawPhone.startsWith('0') ? `9${rawPhone}` : `90${rawPhone}`);
  const whatsappDealerUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Merhaba Sayın ${currentReseller.resellerName}, AKN AuraBio Frekans Genel Yönetim Merkezi'nden sizinle iletişime geçiyoruz.`
  )}`;

  // Calculated Financial Metrics
  const calculatedCredits = currentReseller.creditsBalance !== undefined ? currentReseller.creditsBalance : 100;
  const totalSales = currentReseller.totalSalesAmount || 0;
  const totalCommission = currentReseller.totalEarnings || 0;
  const paidCommission = currentReseller.paidEarnings || 0;
  const pendingCommission = currentReseller.pendingEarnings || Math.max(0, totalCommission - paidCommission);

  // Marketing Links
  const registerUrl = generateRegisterLink(currentReseller.referralCode);
  const cardUrl = generateBusinessCardLink(currentReseller.referralCode);
  const presentationUrl = generateBusinessPresentationLink(currentReseller.referralCode);
  const techReportUrl = generateTechnicalReportLink(currentReseller.referralCode);
  const fullMarketingText = generateBulkMarketingMessage(currentReseller.referralCode, currentReseller.resellerName, currentReseller.phone);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-950/90 space-y-6 my-auto max-h-[94vh] overflow-y-auto">
        
        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-950/60 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOP HEADER: DEALER IDENTITY & QUICK ACTION BADGES */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
              <Building2 className="w-7 h-7 text-emerald-400" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                  {currentReseller.resellerName}
                </h2>

                {/* Referral Code Badge */}
                <span 
                  onClick={() => handleCopy(currentReseller.referralCode, 'top-code')}
                  className="px-2.5 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900 transition-colors shadow-sm"
                  title="Kopyalamak için tıklayın"
                >
                  <span>{currentReseller.referralCode}</span>
                  {copiedKey === 'top-code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </span>

                {/* Status Badge */}
                <button
                  onClick={handleToggleStatus}
                  disabled={isSaving}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentReseller.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-emerald-950/50 hover:text-emerald-300 hover:border-emerald-500/40'
                  }`}
                  title="Durumu değiştirmek için tıklayın"
                >
                  <span className={`w-2 h-2 rounded-full ${currentReseller.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span>{currentReseller.status === 'active' ? 'Aktif Bayi' : 'Askıda / Pasif'}</span>
                </button>

                {/* Package Badge */}
                <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
                  {currentReseller.dealerPackageId === 'diamond-dealer' ? '💎 Elmas Master Bayi' :
                   currentReseller.dealerPackageId === 'gold-dealer' ? '🥇 Altın Bayi' :
                   currentReseller.dealerPackageId === 'silver-dealer' ? '🥈 Gümüş Bayi' :
                   currentReseller.dealerPackageId === 'bronze-dealer' ? '🥉 Bronz Bayi' : '⭐ Yetkili Bayi'}
                </span>
              </div>

              {/* Subtitle & Contact line */}
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300 font-mono">{currentReseller.email}</span>
                </span>
                {currentReseller.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 font-mono">{currentReseller.phone}</span>
                  </span>
                )}
                <span className="text-slate-500 text-[11px] font-mono">UID: {currentReseller.uid}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Direct */}
            {rawPhone && (
              <a
                href={whatsappDealerUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Görüşmesi</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Genel & Kurumsal Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'financial'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Kredi Havuzu & Finans</span>
          </button>

          <button
            onClick={() => setActiveTab('referred')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'referred'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Bağlı Danışanlar ({referredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'commissions'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Komisyonlar ({commissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paket Siparişleri ({dealerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'marketing'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/70'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Pazarlama & Davet Linkleri</span>
          </button>
        </div>

        {/* TAB 1: GENEL & KURUMSAL PROFİL */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Cards */}
            <div className="flex items-center justify-end">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${isLiveSynced ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveSynced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isLiveSynced ? 'CANLI SENKRONİZASYON' : 'Yükleniyor...'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Kalan Seans Kredisi</span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {calculatedCredits} Seans
                </div>
                <span className="text-[10px] text-slate-500 block">Süre Sınırı Yok</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Toplam Yapılan Tarama</span>
                <div className="text-xl font-black font-mono text-rose-300">
                  {currentReseller.totalScans ?? creditLogs.filter(l => l.type === 'scan_usage').length} Tarama
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {currentReseller.lastScanAt ? `Son: ${new Date(currentReseller.lastScanAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Henüz Tarama Yok'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Komisyon Oranı</span>
                <div className="text-xl font-black font-mono text-teal-300">
                  %{currentReseller.commissionRate || 20}
                </div>
                <span className="text-[10px] text-slate-500 block">Danışan Satış Payı</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium block">Kayıtlı Danışan</span>
                <div className="text-xl font-black font-mono text-amber-400">
                  {referredUsers.length || currentReseller.totalReferredUsers || 0} Üye
                </div>
                <span className="text-[10px] text-slate-500 block">Aktif Alt Ağ</span>
              </div>
            </div>

            {/* Corporate & Identity Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Official Contact & Company */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  <span>Resmi & İletişim Bilgileri</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Bayi / Kurum Adı:</span>
                    <span className="font-bold text-slate-100">{currentReseller.resellerName}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Yetkili Adı Soyadı:</span>
                    <span className="font-bold text-slate-200">
                      {associatedMember?.fullName || currentReseller.fullName || currentReseller.resellerName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">E-Posta Adresi:</span>
                    <span className="font-mono text-slate-200">{currentReseller.email}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Telefon / WhatsApp:</span>
                    <span className="font-mono text-emerald-400 font-bold">{currentReseller.phone || 'Belirtilmedi'}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Sektör & Faaliyet Alanı:</span>
                    <span className="text-amber-300 font-medium">
                      {associatedMember?.dealerDetails?.businessField || 'Biyo-Rezonans & Frekans'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Vergi / TC No:</span>
                    <span className="font-mono text-slate-200">
                      {associatedMember?.dealerDetails?.taxNumber || 'Belirtilmedi'} ({associatedMember?.dealerDetails?.taxOffice || 'Daire Yok'})
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-slate-400">Açık Adres:</span>
                    <span className="text-slate-300 text-right max-w-xs text-[11px]">
                      {associatedMember?.dealerDetails?.address || 'Açık adres belirtilmemiş.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: System & Audit Information */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sistem Kimliği & Tarihçesi</span>
                  </div>

                  <div className="space-y-3 text-xs mt-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Sistem UID:</span>
                      <span className="font-mono text-[11px] text-emerald-400 select-all">{currentReseller.uid}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Referans Davet Kodu:</span>
                      <span className="font-mono font-bold text-teal-300">{currentReseller.referralCode}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Oluşturulma / Kayıt Tarihi:</span>
                      <span className="text-slate-200">
                        {currentReseller.createdAt ? new Date(currentReseller.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="text-slate-400">Son Güncelleme:</span>
                      <span className="text-slate-200">
                        {currentReseller.updatedAt ? new Date(currentReseller.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Kullanıcı Hesabı Bağlantısı:</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${associatedMember ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {associatedMember ? '✓ Senkronize Üye Hesabı Var' : 'Yalnızca Bayi Kaydı'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Internal Notes Form */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Yönetici Özel Notları:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Yalnızca yöneticiler görür</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Bayi hakkında not giriniz..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Kaydet'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: KREDİ HAVUZU & FİNANSAL YÖNETİM */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            
            {/* Credits Manager Hero Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-950 to-teal-950/80 border-2 border-emerald-500/50 shadow-xl shadow-emerald-950/60 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shadow-inner">
                    <Coins className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100">
                      Bayi Tarama & Seans Kredisi Havuzu
                    </h3>
                    <p className="text-xs text-emerald-300/80">
                      Bayinin merkezden aldığı ve danışanlarına seans yaparken kullanacağı kredi bakiyesi
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Mevcut Kullanılabilir Kredi</span>
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    {calculatedCredits} <span className="text-sm font-sans font-bold text-slate-300">Seans</span>
                  </span>
                </div>
              </div>

              {/* Quick Add / Deduct Credit Controls */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Hızlı Kredi Tanımlama veya Düşürme:
                </span>
                
                <div className="flex flex-wrap items-center gap-2">
                  {[+10, +30, +100, +300, +1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleModifyCredits(amount)}
                      disabled={isSaving}
                      className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold shadow-sm transition-all cursor-pointer"
                    >
                      +{amount} Seans Ekle
                    </button>
                  ))}

                  {[-10, -30, -100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleModifyCredits(amount)}
                      disabled={isSaving}
                      className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold shadow-sm transition-all cursor-pointer"
                    >
                      {amount} Seans Düş
                    </button>
                  ))}
                </div>

                {/* Custom Amount Form */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                  <div className="relative w-44">
                    <input
                      type="number"
                      min="1"
                      value={creditAmountInput}
                      onChange={(e) => setCreditAmountInput(e.target.value)}
                      placeholder="Miktar girin"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-300 outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 absolute right-3 top-2.5 font-mono">Seans</span>
                  </div>

                  <button
                    onClick={() => handleModifyCredits(Number(creditAmountInput) || 0)}
                    disabled={isSaving || !Number(creditAmountInput)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Özel Miktar Yükle</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE BIYO-REZONANS HAREKET GECMISI (DENETIM YOLU) */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Kredi Hareket Geçmişi (Denetim Yolu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${isLiveSynced ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isLiveSynced ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    {isLiveSynced ? 'CANLI' : 'Yükleniyor'}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200">
                    Toplam: {creditLogs.length} Hareket
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>
                  Bayi seans taraması tamamlandığı anda bu liste <strong className="text-emerald-300">anlık (real-time)</strong> güncellenir. Her satır; hangi tarih/saatte, hangi tarama/işlem için kaç kredi kullanıldığını gösterir.
                </span>
              </div>

              {creditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Henüz kredi hareketi kaydedilmemiş. Bayi tarama yaptıkça işlem geçmişi burada anlık olarak görünecektir.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3">Tarih / Saat</th>
                        <th className="p-3">İşlem Türü</th>
                        <th className="p-3 text-center">Kredi Değişimi</th>
                        <th className="p-3 text-center">Bakiye</th>
                        <th className="p-3">Açıklama</th>
                        <th className="p-3 text-right">Kaynak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {creditLogs.map(log => {
                        const isPositive = log.amount > 0;
                        const isZero = log.amount === 0;
                        return (
                          <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 font-sans text-[11px] text-slate-400 whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 font-sans">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                log.type === 'scan_usage'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : log.type === 'purchase' || log.type === 'admin_add' || log.type === 'bonus' || log.type === 'initial'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : log.type === 'admin_set'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {log.type === 'scan_usage' ? 'Tarama (-)' :
                                 log.type === 'purchase' ? 'Paket (+) ' :
                                 log.type === 'admin_add' ? 'Admin Yükleme (+)' :
                                 log.type === 'admin_deduct' ? 'Admin Düşüm (-)' :
                                 log.type === 'admin_set' ? 'Bakiye Sabitleme (=)' :
                                 log.type === 'bonus' ? 'Bonus (+)' :
                                 'Başlangıç'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-sm">
                              <span className={isPositive ? 'text-emerald-400' : isZero ? 'text-slate-400' : 'text-rose-400'}>
                                {isPositive ? `+${log.amount}` : log.amount}
                              </span>
                            </td>
                            <td className="p-3 text-center text-[11px]">
                              <span className="text-slate-500">{log.previousBalance}</span>
                              <span className="text-slate-600 mx-1">➔</span>
                              <span className="font-bold text-slate-100">{log.newBalance}</span>
                            </td>
                            <td className="p-3 font-sans text-[11px] text-slate-300 max-w-xs">
                              {log.description}
                            </td>
                            <td className="p-3 text-right font-sans text-[10px] text-slate-400">
                              {log.performedBy || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Overview Grid & Commission Setting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Financial Balance Summary */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  <span>Komisyon ve Kazanç Özeti</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Toplam Üye Satış Cirosu:</span>
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {formatUsd(totalSales)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Toplam Hak Edilen Komisyon:</span>
                    <span className="font-mono font-bold text-teal-300 text-sm">
                      {formatUsd(totalCommission)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-400">Merkezce Ödenen Komisyon:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatUsd(paidCommission)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ödeme Bekleyen Bakiye:</span>
                    <span className="font-mono font-bold text-amber-400 text-base">
                      {formatUsd(pendingCommission)}
                    </span>
                  </div>
                </div>

                {/* Change Commission Rate */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Komisyon Oranı (%):</span>
                    <span className="text-teal-400 font-bold font-mono">Mevcut: %{editCommissionRate}</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editCommissionRate}
                      onChange={(e) => setEditCommissionRate(Number(e.target.value) || 20)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-100 outline-none focus:border-teal-500"
                    />
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Oranı Güncelle
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank & IBAN Account Information */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CreditCard className="w-4 h-4" />
                    <span>Bayi Banka & IBAN Bilgileri</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Banka Adı:</label>
                      <input
                        type="text"
                        value={bankNameInput}
                        onChange={(e) => setBankNameInput(e.target.value)}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Hesap Sahibi Adı Soyadı:</label>
                      <input
                        type="text"
                        value={accountHolderInput}
                        onChange={(e) => setAccountHolderInput(e.target.value)}
                        placeholder="Hesap Sahibi Ünvanı"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">IBAN Numarası (TR...):</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ibanInput}
                          onChange={(e) => setIbanInput(e.target.value.toUpperCase())}
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-emerald-400 font-bold outline-none focus:border-emerald-500"
                        />
                        {ibanInput && (
                          <button
                            type="button"
                            onClick={() => handleCopy(ibanInput, 'iban-copy')}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                            title="IBAN Kopyala"
                          >
                            {copiedKey === 'iban-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    Banka Bilgilerini Kaydet
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: BAĞLI DANIŞANLAR & YÖNLENDİRİLEN ÜYE AĞI */}
        {activeTab === 'referred' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs text-slate-300">
                Bu bayinin referans kodu (<strong className="text-emerald-400 font-mono">{currentReseller.referralCode}</strong>) ile sisteme kaydolan danışanlar ve üyeler:
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                Toplam {referredUsers.length} Danışan
              </span>
            </div>

            {isLoadingData ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Danışan listesi yükleniyor...</span>
              </div>
            ) : referredUsers.length > 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Danışan Adı Soyadı</th>
                        <th className="py-3 px-4">İletişim</th>
                        <th className="py-3 px-4">Kalan Kredi</th>
                        <th className="py-3 px-4">Lisans Durumu</th>
                        <th className="py-3 px-4 text-right">Kayıt Tarihi</th>
                        <th className="py-3 px-4 text-center">İletişim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {referredUsers.map((client) => {
                        const clientRawPhone = (client.phone || '').replace(/[^0-9]/g, '');
                        const clientWa = clientRawPhone.startsWith('90') ? clientRawPhone : `90${clientRawPhone}`;

                        return (
                          <tr key={client.uid} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-100">
                              {client.fullName}
                              <div className="text-[10px] text-slate-500 font-mono">UID: {client.uid.slice(0, 10)}...</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              <div>{client.email}</div>
                              {client.phone && <div className="text-[10px] text-slate-500 font-mono">{client.phone}</div>}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              {client.creditsBalance ?? 0} Seans
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                client.isAllowed 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {client.isAllowed ? '● Lisans Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-mono">
                              {client.createdAt ? new Date(client.createdAt).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {clientRawPhone && (
                                <a
                                  href={`https://wa.me/${clientWa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 inline-flex items-center justify-center transition-colors"
                                  title="WhatsApp Mesajı Gönder"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                Bu bayinin referans kodu ile henüz bir danışan kaydı gerçekleşmemiştir.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KOMİSYON VE SATIŞ HAREKETLERİ */}
        {activeTab === 'commissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs text-slate-300">
                Bu bayinin yönlendirdiği üyelerin paket alımlarından oluşan komisyon hak edişleri:
              </div>
              <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold font-mono">
                {commissions.length} İşlem
              </span>
            </div>

            {commissions.length > 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">İşlem No</th>
                        <th className="py-3 px-4">Paket</th>
                        <th className="py-3 px-4 text-right">Sipariş Tutarı</th>
                        <th className="py-3 px-4 text-center">Oran</th>
                        <th className="py-3 px-4 text-right">Hak Edilen Komisyon</th>
                        <th className="py-3 px-4 text-center">Durum</th>
                        <th className="py-3 px-4 text-right">Tarih</th>
                        <th className="py-3 px-4 text-center">Yönetici Aksiyonu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {commissions.map((c) => (
                        <tr key={c.transactionId} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {c.transactionId}
                          </td>
                          <td className="py-3 px-4 font-bold text-teal-300">
                            {c.packageName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                            {formatUsd(c.amount)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                            %{c.commissionRate || c.rate || 20}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                            {formatUsd(c.commissionAmount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {c.status === 'paid' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                ✓ Ödendi
                              </span>
                            )}
                            {c.status === 'approved' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold">
                                ● Onaylandı
                              </span>
                            )}
                            {c.status === 'pending' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                                ⏳ Onay Bekliyor
                              </span>
                            )}
                            {c.status === 'rejected' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                ✕ Reddedildi
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-mono">
                            {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {c.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleCommissionStatusChange(c.transactionId, 'approved')}
                                    className="px-2 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => handleCommissionStatusChange(c.transactionId, 'rejected')}
                                    className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-medium transition-all cursor-pointer"
                                  >
                                    Reddet
                                  </button>
                                </>
                              )}
                              {c.status === 'approved' && (
                                <button
                                  onClick={() => handleCommissionStatusChange(c.transactionId, 'paid')}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Ödendi İşaretle</span>
                                </button>
                              )}
                              {c.status === 'paid' && (
                                <span className="text-[10px] text-slate-500 italic">Tamamlandı</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                Bu bayiye ait henüz bir komisyon işlemi bulunmamaktadır.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BAYİ PAKET SİPARİŞLERİ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs text-slate-300">
                Bayinin merkezden satın aldığı lisans & kredi paketi siparişleri:
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                {dealerOrders.length} Paket Siparişi
              </span>
            </div>

            {dealerOrders.length > 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Sipariş No</th>
                        <th className="py-3 px-4">Paket Adı</th>
                        <th className="py-3 px-4">Kredi Miktarı</th>
                        <th className="py-3 px-4 text-right">Tutar</th>
                        <th className="py-3 px-4">Dekont / Açıklama</th>
                        <th className="py-3 px-4 text-center">Durum</th>
                        <th className="py-3 px-4 text-right">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {dealerOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">{order.id}</td>
                          <td className="py-3 px-4 font-bold text-teal-300">{order.packageName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-teal-950 border border-teal-500/40 text-teal-300 font-mono font-bold text-xs">
                              +{order.scanCredits} Seans
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            {order.priceText || formatUsd(order.price)}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                            {order.paymentReference || <span className="text-slate-500 italic">Belirtilmedi</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {order.status === 'approved' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                ✓ Onaylandı & Yüklendi
                              </span>
                            )}
                            {order.status === 'pending' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                                ⏳ Havale Onayı Bekliyor
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                ✕ Reddedildi
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-mono">
                            {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                Bu bayiye ait kayıtlı bir paket satın alma siparişi bulunmamaktadır.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PAZARLAMA VE ÖZEL DAVET LİNKLERİ */}
        {activeTab === 'marketing' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Direct Register Link */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Özel Danışan Kayıt Linki</span>
                  </span>
                  <button
                    onClick={() => handleCopy(registerUrl, 'link-reg')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'link-reg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] truncate select-all">
                  {registerUrl}
                </div>
              </div>

              {/* Digital Business Card Link */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>Dijital Kartvizit & Karekod Sayfası</span>
                  </span>
                  <button
                    onClick={() => handleCopy(cardUrl, 'link-card')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'link-card' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 text-teal-300 font-mono text-[11px] truncate select-all">
                  {cardUrl}
                </div>
              </div>

              {/* Business Presentation Link */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>İnteraktif İş & Ürün Sunum Raporu</span>
                  </span>
                  <button
                    onClick={() => handleCopy(presentationUrl, 'link-pres')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'link-pres' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] truncate select-all">
                  {presentationUrl}
                </div>
              </div>

              {/* Technical Biophysics Report Link */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Teknik Rapor & Frekans Dökümantasyonu</span>
                  </span>
                  <button
                    onClick={() => handleCopy(techReportUrl, 'link-tech')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'link-tech' ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 text-purple-300 font-mono text-[11px] truncate select-all">
                  {techReportUrl}
                </div>
              </div>

            </div>

            {/* Bulk WhatsApp Presentation Text */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Bayiye Özel Hazır WhatsApp Tanıtım & Davet Metni</span>
                </span>
                <button
                  onClick={() => handleCopy(fullMarketingText, 'bulk-text')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {copiedKey === 'bulk-text' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Tüm Metni Kopyala</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {fullMarketingText}
              </div>
            </div>

          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Bayi Bilgileri Anlık Olarak Senkronize Edilmektedir</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
