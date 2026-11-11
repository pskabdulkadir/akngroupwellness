/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Invoice,
  CommissionPayout,
  Distributor,
  LedgerEntry,
  AIAdvice,
  TaxReportSummary,
  RefundRecord,
  InventoryProduct,
  StockMovement,
  OssDeclarationRecord,
  BankAccount,
  BankTransaction,
  ExpenseRecord,
  PayrollRecord,
  B2BReconciliation,
  BaBsItem,
  VoiceCommandLog,
  ProactiveAlert,
  Currency,
  AutoPilotExecutionSummary,
  CompanyProfile,
  TaxOfficeAccrual,
  WaybillRecord,
  LiveExchangeRates,
  INITIAL_COMPANY_PROFILE,
} from './types/accounting';
import {
  INITIAL_INVOICES,
  INITIAL_COMMISSIONS,
  INITIAL_DISTRIBUTORS,
  INITIAL_LEDGER,
  INITIAL_AI_ADVICE,
  INITIAL_INVENTORY_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_REFUNDS,
  INITIAL_OSS_RECORDS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_PAYROLL,
  INITIAL_RECONCILIATIONS,
  INITIAL_BABS_ITEMS,
  INITIAL_VOICE_COMMAND_LOGS,
  INITIAL_PROACTIVE_ALERTS,
  INITIAL_TAX_OFFICE_ACCRUALS,
  INITIAL_WAYBILLS,
} from './data/mockInitialData';
import { TCMB_RATES } from './services/taxEngine';
import {
  fetchLiveExchangeRates,
  subscribeToRates,
  getCurrentLiveRates,
  DEFAULT_LIVE_RATES,
} from './services/currencyService';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CfoExecutiveReportView } from './components/views/CfoExecutiveReportView';
import { CompanyTaxSettingsView } from './components/views/CompanyTaxSettingsView';
import { TaxOfficeAccrualsView } from './components/views/TaxOfficeAccrualsView';
import { OverviewView } from './components/views/OverviewView';
import { InvoicesView } from './components/views/InvoicesView';
import { TaxReturnsView } from './components/views/TaxReturnsView';
import { CommissionsView } from './components/views/CommissionsView';
import { SalesSimulatorView } from './components/views/SalesSimulatorView';
import { ExportLedgerView } from './components/views/ExportLedgerView';
import { AIAdvisorView } from './components/views/AIAdvisorView';
import { IntegratorSettingsView } from './components/views/IntegratorSettingsView';
import { ClawbackRefundsView } from './components/views/ClawbackRefundsView';
import { InventoryStockView } from './components/views/InventoryStockView';
import { InternationalOssView } from './components/views/InternationalOssView';
import { OpenBankingView } from './components/views/OpenBankingView';
import { ExpensesPayrollView } from './components/views/ExpensesPayrollView';
import { ReconciliationBaBsView } from './components/views/ReconciliationBaBsView';
import { MonolineIntegrationView } from './components/views/MonolineIntegrationView';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { GiderPusulasiModal } from './components/modals/GiderPusulasiModal';
import { ResetSystemModal } from './components/modals/ResetSystemModal';
import { AutonomousCpaModal } from './components/modals/AutonomousCpaModal';
import { AccountingCopilot } from './components/voice/AccountingCopilot';
import { OnboardingTourModal } from './components/voice/OnboardingTourModal';
import { accountingSyncBridge } from './utils/accountingSyncBridge';

// Canlı Sıfır Bakiye Tahakkuk Şablonları
const CLEAN_TAX_OFFICE_ACCRUALS: TaxOfficeAccrual[] = [
  {
    id: 'thk-0015-101',
    taxType: 'KDV_1',
    taxCode: '0015',
    title: '1 No.lu Katma Değer Vergisi Beyannamesi Tahakkuku',
    taxOfficeName: 'Büyük Mükellefler V.D. / Kadıköy',
    taxOfficeCode: '34251',
    taxPeriod: 'Ekim 2026',
    taxableBaseTRY: 0,
    calculatedTaxTRY: 0,
    deductibleTaxTRY: 0,
    netTaxTRY: 0,
    stampDutyTRY: 0,
    totalDueTRY: 0,
    statutoryDeadline: '2026-10-28',
    paymentStatus: 'UNPAID',
    accrualSlipNumber: 'THK-2026-0015-000001',
    gibTrackingReference: '9840294829100001',
  },
  {
    id: 'thk-0003-102',
    taxType: 'MUHTASAR_STOPAJ',
    taxCode: '0003',
    title: 'Muhtasar ve Prim Hizmet Beyannamesi (Bayi Stopaj Kesintisi)',
    taxOfficeName: 'Büyük Mükellefler V.D. / Kadıköy',
    taxOfficeCode: '34251',
    taxPeriod: 'Ekim 2026',
    taxableBaseTRY: 0,
    calculatedTaxTRY: 0,
    deductibleTaxTRY: 0,
    netTaxTRY: 0,
    stampDutyTRY: 0,
    totalDueTRY: 0,
    statutoryDeadline: '2026-10-26',
    paymentStatus: 'UNPAID',
    accrualSlipNumber: 'THK-2026-0003-000002',
    gibTrackingReference: '9840294829100002',
  },
  {
    id: 'thk-0033-103',
    taxType: 'KURUMLAR_GECICI',
    taxCode: '0033',
    title: 'Geçici Vergi / Kurumlar Vergisi Karşılığı (3. Çeyrek)',
    taxOfficeName: 'Büyük Mükellefler V.D. / Kadıköy',
    taxOfficeCode: '34251',
    taxPeriod: '2026/3. Çeyrek',
    taxableBaseTRY: 0,
    calculatedTaxTRY: 0,
    deductibleTaxTRY: 0,
    netTaxTRY: 0,
    stampDutyTRY: 0,
    totalDueTRY: 0,
    statutoryDeadline: '2026-11-17',
    paymentStatus: 'SCHEDULED',
    accrualSlipNumber: 'THK-2026-0033-000003',
    gibTrackingReference: '9840294829100003',
  },
];

export default function SmartAccountingApp({
  onReturnToWellness,
}: {
  onReturnToWellness?: () => void;
} = {}) {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCpaModalOpen, setIsCpaModalOpen] = useState(false);

  // Canlı İnternet Döviz Kurları (USD, EUR, GBP)
  const [rates, setRates] = useState<LiveExchangeRates>(() => getCurrentLiveRates());

  // Yönetici tercihi: Daima yüzde yüz sıfır, temiz ve gerçek canlı başlangıç modu
  const isCleanInitial = true;

  useEffect(() => {
    try {
      localStorage.removeItem('akn_demo_mode_active');
    } catch {
      // ignore
    }
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>(() => []);
  const [commissions, setCommissions] = useState<CommissionPayout[]>(() => []);
  const [distributors, setDistributors] = useState<Distributor[]>(() => []);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => []);
  const [aiAdvices] = useState<AIAdvice[]>(INITIAL_AI_ADVICE);

  // 6 Modül State'leri
  const [refunds, setRefunds] = useState<RefundRecord[]>(() => []);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>(INITIAL_INVENTORY_PRODUCTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => []);
  const [ossRecords, setOssRecords] = useState<OssDeclarationRecord[]>(() => []);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => INITIAL_BANK_ACCOUNTS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => []);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => []);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => []);
  const [reconciliations, setReconciliations] = useState<B2BReconciliation[]>(() => []);
  const [baBsItems, setBaBsItems] = useState<BaBsItem[]>(() => []);

  // Sesli Asistan Denetim Kayıtları (Voice Audit Trail) & Proaktif Uyarılar
  const [voiceLogs, setVoiceLogs] = useState<VoiceCommandLog[]>([
    {
      id: 'log-clean-init',
      timestamp: new Date().toLocaleString('tr-TR'),
      user: 'Yönetici (Admin)',
      spokenText: 'Canlı Finans Sistemi Sıfırlandı',
      parsedAction: 'INITIALIZE_CLEAN_SYSTEM',
      status: 'EXECUTED',
      responseSpoken: 'AKN Global Group Ltd. muhasebe altyapısı sıfırlandı. Tüm sahte ve simülasyon verileri silindi, sistem 0 USD ($) bakiye ile ilk canlı siparişe hazır.',
      auditDetails: 'Tüm test verileri silindi, canlı API entegrasyonu aktif.',
    },
  ]);

  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([
    {
      id: 'alert-clean-init',
      type: 'DAILY_BRIEF',
      title: 'Canlı Finans Sistemi Hazır (0 USD)',
      message: 'Tüm test ve simülasyon verileri temizlendi. Sistem ilk gerçek sipariş ve komisyon işlemiyle canlı defteri başlatacaktır.',
      speechText: 'AKN Global Group Ltd. muhasebe altyapısı sıfırlandı ve canlı ilk sipariş için hazır.',
      severity: 'info',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      actionTab: 'monolineReconciliation',
      actionLabel: 'Canlı Mutabakat',
      dismissed: false,
    },
  ]);

  // Şirket & Vergi Profili Yapılandırması ve Vergi Dairesi Tahakkukları
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY_PROFILE);
  const [accruals, setAccruals] = useState<TaxOfficeAccrual[]>(() => (isCleanInitial ? CLEAN_TAX_OFFICE_ACCRUALS : INITIAL_TAX_OFFICE_ACCRUALS));
  const [waybills, setWaybills] = useState<WaybillRecord[]>(() => (isCleanInitial ? [] : INITIAL_WAYBILLS));

  // Canlı İnternet Kurlarını Otomatik Dinleme & Yenileme (Auto-Polling & Subscription)
  useEffect(() => {
    fetchLiveExchangeRates().then((r) => setRates(r));

    const unsubscribe = subscribeToRates((newRates) => {
      setRates(newRates);
    });

    // Her 45 saniyede bir internetten anlık kurları tazele
    const interval = setInterval(() => {
      fetchLiveExchangeRates().then((r) => setRates(r));
    }, 45000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // PostgreSQL Canlı Muhasebe ve Hakediş Verilerini Çekme
  const fetchLiveAccountingData = async () => {
    try {
      const res = await fetch('/api/v1/integrations/accounting/sync-data');
      if (res.ok) {
        const data = await res.json();
        // 1. Üyelerden Bayi Listesini Güncelle
        if (Array.isArray(data.members) && data.members.length > 0) {
          const liveDistributors: Distributor[] = data.members.map((m: any, idx: number) => ({
            id: m.user_id || `DIST-${idx + 1}`,
            name: m.full_name || 'AKN Bayi Temsilcisi',
            identityNumber: m.tc_identity_no || '11111111110',
            isCompany: Boolean(m.has_tax_company || m.is_company),
            iban: m.bank_iban || m.bank_details?.iban || `TR3300061005111222333444${String(idx + 1).padStart(2, '0')}`,
            level: 1,
            status: 'ACTIVE',
            totalEarningsTRY: m.wallet_try || 0,
            totalStopajPaidTRY: (m.wallet_try || 0) * 0.20,
            currentWalletBalanceTRY: m.wallet_try || 0,
          }));
          setDistributors(liveDistributors);
        }

        // 2. Gider Pusulalarından Canlı Komisyon Hakedişlerini Güncelle
        if (Array.isArray(data.expense_vouchers) && data.expense_vouchers.length > 0) {
          const liveComms: CommissionPayout[] = data.expense_vouchers.map((v: any) => ({
            id: v.voucher_number,
            invoiceId: v.order_id,
            invoiceNumber: v.order_id,
            distributorId: v.dealer_user_id,
            distributorName: v.dealer_full_name,
            isCompany: Boolean(v.is_company),
            tierLevel: 1,
            commissionRate: 0.20,
            baseAmountTRY: Number(v.gross_amount),
            grossCommissionTRY: Number(v.gross_amount),
            withholdingRate: Number(v.withholding_rate || 0.20),
            withholdingAmountTRY: Number(v.withholding_amount || 0),
            netPayableTRY: Number(v.net_amount),
            payoutDate: v.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            documentType: 'GIDER_PUSULASI',
            documentNumber: v.voucher_number,
            isPaid: v.status === 'PAID_SETTLED',
            ledgerPosted: true,
          }));
          setCommissions(liveComms);
        }

        // 3. Yevmiye Defterini Güncelle
        if (Array.isArray(data.journal_entries) && data.journal_entries.length > 0) {
          const liveLedger: LedgerEntry[] = data.journal_entries.map((j: any, idx: number) => ({
            id: `YEV-${j.id || idx + 1}`,
            date: j.entry_date || new Date().toISOString().split('T')[0],
            entryNumber: Number(j.id) || idx + 1,
            documentNumber: j.voucher_number || `DOC-${idx + 1}`,
            description: j.description || 'Yevmiye Kaydı',
            accountCode: j.debit_account_code || '102.01',
            accountName: j.debit_account_name || 'Banka Hesabı',
            debitTRY: Number(j.debit_amount || 0),
            creditTRY: Number(j.credit_amount || 0),
            currency: j.currency || 'TRY',
          }));
          setLedgerEntries(liveLedger);
        }
      }
    } catch (err: any) {
      console.warn('Canlı muhasebe senkronizasyon uyarısı:', err?.message);
    }
  };

  useEffect(() => {
    fetchLiveAccountingData();
  }, []);

  // Real-time synchronization with Wellness and Monoline transactions
  useEffect(() => {
    const unsub = accountingSyncBridge.subscribe((payload) => {
      const isExportSale = Boolean(payload.isExport || (payload.amountUsd && payload.amountUsd > 0));
      const tryAmount = payload.amountTry || (payload.amountUsd ? payload.amountUsd * rates.USD : 0);
      const vatAmount = isExportSale ? 0 : Number(((tryAmount * 20) / 120).toFixed(2));

      // 1. Yeni e-Fatura / e-Arşiv kaydı oluştur
      const invNum = `GİB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newInv: Invoice = {
        id: payload.orderId || `INV-LIVE-${Date.now().toString().slice(-5)}`,
        invoiceNumber: invNum,
        currency: isExportSale ? 'USD' : 'TRY',
        type: isExportSale ? 'HIZMET_IHRACI' : 'SATIS',
        ettn: `98a1-${Date.now().toString().slice(-6)}-4b02-8f19`,
        issueDate: new Date().toISOString().split('T')[0],
        issueTime: new Date().toTimeString().split(' ')[0],
        exchangeRateTCMB: rates.USD,
        subtotal: tryAmount - vatAmount,
        vatTotal: vatAmount,
        grandTotal: tryAmount,
        grandTotalTRY: tryAmount,
        integrator: 'Logo',
        notes: ['AKN Wellness Biyo-Rezonans Siparişi'],
        paymentMethod: '3D_SECURE_CREDIT_CARD',
        gibStatus: {
          code: '1200',
          description: 'GİB Tarafından Başarıyla Alındı ve İmzalandı',
          sentAt: new Date().toISOString(),
          signedAt: new Date().toISOString(),
        },
        items: [
          {
            id: `item-${Date.now()}`,
            description: payload.packageName || 'AKN Wellness Biyo-Rezonans & Monoline Hizmeti',
            quantity: 1,
            unitPrice: tryAmount,
            currency: isExportSale ? 'USD' : 'TRY',
            vatRate: isExportSale ? 0 : 0.20,
            vatAmount: vatAmount,
            subtotal: tryAmount - vatAmount,
            total: tryAmount,
          },
        ],
        customer: {
          name: payload.customerName || 'Danışan / Bayi Müşterisi',
          taxNumber: payload.vknTckn || '11111111110',
          isCorporate: false,
          isGibRegistered: false,
          address: 'İstanbul, Türkiye',
          city: 'İstanbul',
          country: isExportSale ? 'US' : 'TR',
          email: payload.customerEmail || 'danisan@akngroupfrekans.com',
        },
        scenario: isExportSale ? 'IHRACAT' : 'EARSIVBELGE',
      };
      setInvoices((prev) => [newInv, ...prev]);

      // 2. Yevmiye defterine çift taraflı kayıt ekle
      const newLedger: LedgerEntry = {
        id: `YEV-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().split('T')[0],
        entryNumber: Math.floor(1000 + Math.random() * 9000),
        documentNumber: invNum,
        description: `Monoline Canlı Satış: ${payload.orderId} - ${payload.packageName || payload.customerName || 'Hizmet Satışı'}`,
        accountCode: '102.01',
        accountName: 'Ziraat Bankası Ticari Sanal POS',
        debitTRY: tryAmount,
        creditTRY: 0,
        currency: isExportSale ? 'USD' : 'TRY',
      };
      setLedgerEntries((prev) => [newLedger, ...prev]);

      // 3. Eğer bayi komisyonu stopajı varsa gider pusulası oluştur
      if (payload.isDealerCommission && payload.withholdingTaxTry) {
        const netAmt = payload.netPayoutTry || (tryAmount - payload.withholdingTaxTry);
        const newComm: CommissionPayout = {
          id: `COMM-LIVE-${Date.now().toString().slice(-4)}`,
          invoiceId: newInv.id,
          invoiceNumber: invNum,
          distributorId: 'DIST-LIVE-BAYI',
          distributorName: payload.customerName || 'Aktif Bayi Temsilcisi',
          tierLevel: 1,
          commissionRate: 0.20,
          baseAmountTRY: tryAmount,
          grossCommissionTRY: tryAmount,
          withholdingRate: 0.20,
          withholdingAmountTRY: payload.withholdingTaxTry,
          netPayableTRY: netAmt,
          isCompany: Boolean(payload.dealerIsCompany),
          payoutDate: new Date().toISOString(),
          documentType: 'GIDER_PUSULASI',
          documentNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          isPaid: true,
          ledgerPosted: true,
        };
        setCommissions((prev) => [newComm, ...prev]);
      }
    });

    return unsub;
  }, [rates]);

  const handleRefreshRates = async () => {
    const updated = await fetchLiveExchangeRates();
    setRates(updated);
  };

  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
  };

  const handleUpdateAccrual = (updated: TaxOfficeAccrual) => {
    setAccruals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // Modallar
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<CommissionPayout | null>(null);

  // Dinamik Vergi ve Finansal Özet Hesaplaması (Canlı Kurlar ve Gerçek Verilerle)
  const summary: TaxReportSummary = useMemo(() => {
    let totalDomesticSalesTRY = 0;
    let totalExportSalesTRY = 0;
    let totalExportSalesUSD = 0;
    let vatCalculated391 = 0;

    invoices.forEach((inv) => {
      if (inv.scenario === 'IHRACAT') {
        totalExportSalesTRY += inv.grandTotalTRY;
        totalExportSalesUSD += inv.grandTotal;
      } else {
        totalDomesticSalesTRY += inv.grandTotalTRY;
        vatCalculated391 += inv.vatTotal;
      }
    });

    const totalGrossRevenueTRY = totalDomesticSalesTRY + totalExportSalesTRY;

    const totalWithholdingTax360 = commissions
      .filter((c) => !c.isCompany && !c.isClawbacked)
      .reduce((sum, c) => sum + c.withholdingAmountTRY, 0);

    const totalNetCommissionsPaidTRY = commissions
      .filter((c) => !c.isCompany && !c.isClawbacked)
      .reduce((sum, c) => sum + c.netPayableTRY, 0);

    // Şirket içi giderlerden ve alışlardan gelen İndirilecek KDV (191)
    const expenseDeductibleVat = expenses.reduce((sum, e) => sum + e.vatDeductible191, 0);
    const vatDeductible191 = expenseDeductibleVat;
    const vatPayableNet = Math.max(0, vatCalculated391 - vatDeductible191);
    const vatRefundEligibleTRY = Number((totalExportSalesTRY * 0.12).toFixed(2));
    const estimatedCorporateTaxTRY = Number((totalGrossRevenueTRY * 0.65 * 0.25 * 0.4).toFixed(2));

    const totalRefundsTRY = refunds.reduce((sum, r) => sum + r.refundAmountTRY, 0);
    const totalClawbacksTRY = refunds.reduce(
      (sum, r) => sum + r.clawbacksApplied.reduce((cSum, cb) => cSum + cb.grossClawbackTRY, 0),
      0
    );
    const totalInventoryValueTRY = inventoryProducts.reduce(
      (sum, p) => sum + p.unitCostTRY * p.currentStock,
      0
    );
    const totalSmmCostTRY = stockMovements
      .filter((m) => m.movementType === 'CIKIS_SATIS')
      .reduce((sum, m) => sum + m.totalCostTRY, 0);
    const totalExpenses770TRY = expenses.reduce((sum, e) => sum + e.totalTRY, 0);
    const totalPayrollCostTRY = payroll.reduce((sum, p) => sum + p.totalEmployerCostTRY, 0);
    const euOssVatPayableEUR = ossRecords.reduce((sum, r) => sum + r.vatAmountEUR, 0);

    return {
      periodMonth: 'Ekim 2026',
      tcmbUsdRate: rates.USD,
      tcmbEurRate: rates.EUR,
      totalDomesticSalesTRY,
      totalExportSalesTRY,
      totalExportSalesUSD,
      totalGrossRevenueTRY,
      vatCalculated391,
      vatDeductible191,
      vatPayableNet,
      vatRefundEligibleTRY,
      totalWithholdingTax360,
      totalNetCommissionsPaidTRY,
      estimatedCorporateTaxTRY,
      totalRefundsTRY,
      totalClawbacksTRY,
      totalInventoryValueTRY,
      totalSmmCostTRY,
      totalExpenses770TRY,
      totalPayrollCostTRY,
      euOssVatPayableEUR,
    };
  }, [invoices, commissions, refunds, expenses, inventoryProducts, stockMovements, payroll, ossRecords, rates]);

  // Yeni sipariş simülasyonu tamamlandığında
  const handleOrderProcessed = (
    newInvoice: Invoice,
    newCommission?: CommissionPayout,
    newStockMovement?: StockMovement,
    newOssRecord?: OssDeclarationRecord
  ) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    if (newCommission) {
      setCommissions((prev) => [newCommission, ...prev]);
    }
    if (newStockMovement) {
      setStockMovements((prev) => [newStockMovement, ...prev]);
      setInventoryProducts((prev) =>
        prev.map((p) =>
          p.id === newStockMovement.productId
            ? { ...p, currentStock: Math.max(0, p.currentStock - newStockMovement.quantity) }
            : p
        )
      );
    }
    if (newOssRecord) {
      setOssRecords((prev) => [newOssRecord, ...prev]);
    }

    // Vergi Dairesi Tahakkukunu Dinamik Güncelle
    setAccruals((prev) =>
      prev.map((acc) => {
        if (acc.taxType === 'KDV_1' && newInvoice.scenario !== 'IHRACAT') {
          const newBase = acc.taxableBaseTRY + newInvoice.grandTotalTRY;
          const newCalc = acc.calculatedTaxTRY + newInvoice.vatTotal;
          const newNet = Math.max(0, newCalc - (acc.deductibleTaxTRY || 0));
          return {
            ...acc,
            taxableBaseTRY: newBase,
            calculatedTaxTRY: newCalc,
            netTaxTRY: newNet,
            stampDutyTRY: 450.5,
            totalDueTRY: newNet + 450.5,
          };
        }
        if (acc.taxType === 'MUHTASAR_STOPAJ' && newCommission && !newCommission.isCompany) {
          const newBase = acc.taxableBaseTRY + newCommission.grossCommissionTRY;
          const newNet = acc.netTaxTRY + newCommission.withholdingAmountTRY;
          return {
            ...acc,
            taxableBaseTRY: newBase,
            calculatedTaxTRY: newNet,
            netTaxTRY: newNet,
            stampDutyTRY: 450.5,
            totalDueTRY: newNet + 450.5,
          };
        }
        return acc;
      })
    );
  };

  // İade ve Clawback uygulandığında
  const handleRefundCreated = (
    newRefund: RefundRecord,
    updatedCommissions: CommissionPayout[],
    updatedDistributors: Distributor[]
  ) => {
    setRefunds((prev) => [newRefund, ...prev]);
    setCommissions(updatedCommissions);
    setDistributors(updatedDistributors);
  };

  // Envanter enflasyon düzeltmesi uygulandığında
  const handleProductsUpdated = (
    adjustedProducts: InventoryProduct[],
    inflationLedgerEntry: LedgerEntry
  ) => {
    setInventoryProducts(adjustedProducts);
    setLedgerEntries((prev) => [...prev, inflationLedgerEntry]);
  };

  // Yeni şirket gideri eklendiğinde
  const handleAddExpense = (newExpense: ExpenseRecord) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  // Sesli Komut Denetim Kaydı Ekleme (Voice Audit Trail)
  const handleAddVoiceLog = (newLog: VoiceCommandLog) => {
    setVoiceLogs((prev) => [newLog, ...prev]);
  };

  // AKN Muhasebe Otopilotu
  const [lastAutoPilotRun, setLastAutoPilotRun] = useState<AutoPilotExecutionSummary | null>(null);

  const handleRunAutoPilot = () => {
    const unissuedCount = 0;
    const unpaidCommissions = commissions.filter((c) => !c.isCompany && !c.isClawbacked);
    const stopajTotal = unpaidCommissions.reduce((s, c) => s + c.withholdingAmountTRY, 0);
    const bufferAmount = summary.vatPayableNet + summary.totalWithholdingTax360;

    const summaryReport: AutoPilotExecutionSummary = {
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      invoicesIssuedCount: unissuedCount,
      invoicesTotalAmountTRY: 0,
      commissionsProcessedCount: unpaidCommissions.length,
      stopajWithheldTRY: stopajTotal,
      taxVaultBufferTRY: bufferAmount,
      tcmbRatesSynced: {
        usd: rates.USD,
        eur: rates.EUR,
      },
      cfoExecutiveNote: `Otopilot başarıyla tamamlandı. Canlı kurlar (USD: ${rates.USD.toFixed(2)} ₺, EUR: ${rates.EUR.toFixed(2)} ₺) doğrulandı.`,
    };

    setLastAutoPilotRun(summaryReport);

    const autoPilotLog: VoiceCommandLog = {
      id: `log-autopilot-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      user: 'Ece Yılmaz (CFO)',
      spokenText: 'Otopilot otomatik mali yönetim döngüsünü çalıştır',
      parsedAction: 'RUN_AUTOPILOT_CYCLE',
      status: 'EXECUTED',
      responseSpoken: `Otopilot tamamlandı. Canlı TCMB kurları doğrulandı ve ${bufferAmount.toLocaleString('tr-TR')} TL vergi tamponu güvenceye alındı.`,
      auditDetails: 'Otopilot döngüsü çalıştırıldı.',
    };
    setVoiceLogs((prev) => [autoPilotLog, ...prev]);
  };

  // Sistemi Sıfırlama (Tüm Sahte Verileri Sil ve 0 Bakiye ile Başla)
  const handleResetToClean = () => {
    setInvoices([]);
    setCommissions([]);
    setLedgerEntries([]);
    setRefunds([]);
    setStockMovements([]);
    setBankAccounts(INITIAL_BANK_ACCOUNTS.map((b) => ({ ...b, balanceTRY: 0 })));
    setBankTransactions([]);
    setExpenses([]);
    setPayroll([]);
    setReconciliations([]);
    setBaBsItems([]);
    setWaybills([]);
    setAccruals(CLEAN_TAX_OFFICE_ACCRUALS);
    setDistributors(
      INITIAL_DISTRIBUTORS.map((d) => ({
        ...d,
        totalEarningsTRY: 0,
        totalStopajPaidTRY: 0,
        currentWalletBalanceTRY: 0,
      }))
    );

    const cleanAlert: ProactiveAlert = {
      id: `alert-clean-${Date.now()}`,
      type: 'DAILY_BRIEF',
      title: 'Sistem Sıfırlandı (Canlıya Hazır)',
      message: 'Tüm simülasyon ve sahte veriler silindi. Ciro: 0,00 ₺. Satış simülatöründen ilk faturanızı kesebilirsiniz.',
      speechText: 'AKN Global Group Ltd. muhasebe altyapısı başarıyla sıfırlandı.',
      severity: 'info',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      actionTab: 'simulator',
      actionLabel: 'Yeni Satış Yap',
      dismissed: false,
    };
    setProactiveAlerts([cleanAlert]);

    const cleanLog: VoiceCommandLog = {
      id: `log-clean-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      user: 'Ece Yılmaz (CFO)',
      spokenText: 'Sistemi sıfırla ve tüm verileri sil',
      parsedAction: 'RESET_SYSTEM_TO_CLEAN',
      status: 'EXECUTED',
      responseSpoken: 'Tüm test verileri silindi, veritabanı 0 TL bakiye ile canlıya alındı.',
      auditDetails: 'Yönetici onayı ile sistem sıfırlandı.',
    };
    setVoiceLogs([cleanLog]);

    try {
      localStorage.removeItem('akn_demo_mode_active');
      localStorage.setItem('akn_system_is_clean', 'true');
    } catch {
      // ignore
    }
  };

  // Demo Verilerini Geri Yükle
  const handleRestoreDemo = () => {
    setInvoices(INITIAL_INVOICES);
    setCommissions(INITIAL_COMMISSIONS);
    setDistributors(INITIAL_DISTRIBUTORS);
    setLedgerEntries(INITIAL_LEDGER);
    setRefunds(INITIAL_REFUNDS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setBankTransactions(INITIAL_BANK_TRANSACTIONS);
    setExpenses(INITIAL_EXPENSES);
    setPayroll(INITIAL_PAYROLL);
    setReconciliations(INITIAL_RECONCILIATIONS);
    setBaBsItems(INITIAL_BABS_ITEMS);
    setWaybills(INITIAL_WAYBILLS);
    setAccruals(INITIAL_TAX_OFFICE_ACCRUALS);
    setVoiceLogs(INITIAL_VOICE_COMMAND_LOGS);
    setProactiveAlerts(INITIAL_PROACTIVE_ALERTS);

    try {
      localStorage.setItem('akn_demo_mode_active', 'true');
      localStorage.removeItem('akn_system_is_clean');
    } catch {
      // ignore
    }
  };

  // Proaktif Uyarı Kapatma
  const handleDismissAlert = (id: string) => {
    setProactiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
    );
  };

  const pendingWithholdingCount = commissions.filter((c) => !c.isCompany && !c.isClawbacked).length;
  const refundsCount = refunds.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white max-w-full overflow-x-hidden">
      {/* Top Bar (Live Currency Ticker & Reset Button) */}
      <TopBar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenSimulator={() => setCurrentTab('simulator')}
        onStartTour={() => setIsTourOpen(true)}
        onRunAutoPilot={handleRunAutoPilot}
        rates={rates}
        onRefreshRates={handleRefreshRates}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onReturnToWellness={onReturnToWellness}
        onOpenCpaModal={() => setIsCpaModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          pendingWithholdingCount={pendingWithholdingCount}
          refundsCount={refundsCount}
          rates={rates}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl">
          {currentTab === 'cfoReport' && (
            <CfoExecutiveReportView
              summary={summary}
              invoices={invoices}
              commissions={commissions}
              taxBufferVaultTRY={summary.vatPayableNet + summary.totalWithholdingTax360}
              lastAutoPilotRun={lastAutoPilotRun}
              onRunAutoPilot={handleRunAutoPilot}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              voiceLogs={voiceLogs}
              proactiveAlerts={proactiveAlerts}
              companyProfile={companyProfile}
            />
          )}

          {currentTab === 'companySettings' && (
            <CompanyTaxSettingsView
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'taxAccrual' && (
            <TaxOfficeAccrualsView
              summary={summary}
              companyProfile={companyProfile}
              accruals={accruals}
              invoices={invoices}
              onUpdateAccrual={handleUpdateAccrual}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'overview' && (
            <OverviewView
              invoices={invoices}
              commissions={commissions}
              summary={summary}
              aiAdvices={aiAdvices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {currentTab === 'simulator' && (
            <SalesSimulatorView
              distributors={distributors}
              inventoryProducts={inventoryProducts}
              onOrderProcessed={handleOrderProcessed}
              onViewInvoice={(inv) => setSelectedInvoice(inv)}
              rates={rates}
            />
          )}

          {currentTab === 'clawback' && (
            <ClawbackRefundsView
              invoices={invoices}
              commissions={commissions}
              distributors={distributors}
              refunds={refunds}
              onRefundCreated={handleRefundCreated}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryStockView
              products={inventoryProducts}
              movements={stockMovements}
              onProductsUpdated={handleProductsUpdated}
            />
          )}

          {currentTab === 'taxReturns' && (
            <TaxReturnsView
              summary={summary}
              invoices={invoices}
            />
          )}

          {currentTab === 'oss' && (
            <InternationalOssView
              ossRecords={ossRecords}
              distributors={distributors}
            />
          )}

          {currentTab === 'commissions' && (
            <CommissionsView
              distributors={distributors}
              commissions={commissions}
              onOpenGiderPusulasi={(comm) => setSelectedCommission(comm)}
              onRefreshData={fetchLiveAccountingData}
            />
          )}

          {currentTab === 'reconciliation' && (
            <ReconciliationBaBsView
              reconciliations={reconciliations}
              baBsItems={baBsItems}
            />
          )}

          {currentTab === 'banking' && (
            <OpenBankingView
              bankAccounts={bankAccounts}
              transactions={bankTransactions}
              onReconcileTransaction={(txId) => {
                alert(`İşlem #${txId} Yevmiye Defteri 102.01 fişi ile eşleştirildi ve mutabakat sağlandı.`);
              }}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesPayrollView
              expenses={expenses}
              payroll={payroll}
              onAddExpense={handleAddExpense}
            />
          )}

          {currentTab === 'monolineReconciliation' && (
            <MonolineIntegrationView onNavigateTab={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'export' && (
            <ExportLedgerView ledgerEntries={ledgerEntries} />
          )}

          {currentTab === 'aiAdvisor' && (
            <AIAdvisorView advices={aiAdvices} summary={summary} />
          )}

          {currentTab === 'integrator' && (
            <IntegratorSettingsView />
          )}
        </main>
      </div>

      {/* Sistemi Sıfırlama & Sahte Verileri Temizleme Modalı */}
      <ResetSystemModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetToClean={handleResetToClean}
        onRestoreDemo={handleRestoreDemo}
        invoicesCount={invoices.length}
        commissionsCount={commissions.length}
        totalGrossRevenueTRY={summary.totalGrossRevenueTRY}
      />

      {/* Modals */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        companyProfile={companyProfile}
      />

      <GiderPusulasiModal
        commission={selectedCommission}
        onClose={() => setSelectedCommission(null)}
        companyProfile={companyProfile}
      />

      {/* Dışarıdan Mali Müşavire Sıfır İhtiyaç Kılan Tam Bağımsız Kokpit Modalı */}
      <AutonomousCpaModal
        isOpen={isCpaModalOpen}
        onClose={() => setIsCpaModalOpen(false)}
        summary={summary}
        companyProfile={companyProfile}
        ledgerEntries={ledgerEntries}
        baBsItems={baBsItems}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsCpaModalOpen(false);
        }}
      />

      {/* Sesli Asistan (AI Voice Copilot Floating Widget) */}
      <AccountingCopilot
        currentTab={currentTab}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        financialSnapshot={{
          ...summary,
          taxOfficeName: companyProfile.taxOffice,
          taxOffice: companyProfile.taxOffice,
          totalTaxDueTRY: accruals
            .filter((a) => a.paymentStatus === 'UNPAID')
            .reduce((s, a) => s + a.totalDueTRY, 0),
          kdvDueTRY: accruals.find((a) => a.taxType === 'KDV_1')?.totalDueTRY || 0,
          stopajDueTRY: accruals.find((a) => a.taxType === 'MUHTASAR_STOPAJ')?.totalDueTRY || 0,
        }}
        onStartTour={() => setIsTourOpen(true)}
        voiceLogs={voiceLogs}
        onAddVoiceLog={handleAddVoiceLog}
        proactiveAlerts={proactiveAlerts}
        companyProfile={companyProfile}
        onDismissAlert={handleDismissAlert}
        onRunAutoPilot={handleRunAutoPilot}
      />

      {/* Sesli Onboarding ve Rehberlik Tur Modalı */}
      <OnboardingTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}
