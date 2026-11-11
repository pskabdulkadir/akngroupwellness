/**
 * Monoline MLM & Frekans Reseller Smart Accounting Integration Models
 * Based on: "Akıllı Muhasebe Entegrasyonu İçin Teknik Devir Raporu"
 */

import { Currency } from './accounting';

// 1. OTORİTATİF VERİ KAYNAKLARI
export type FinancialDataSource =
  | 'MONOLINE_SERVER_MEMORY'     // server.ts Express proses belleği (members, commissionLogs, withdrawalRequests)
  | 'SUPABASE_POSTGRES'           // Supabase PostgreSQL tables & real-time listeners
  | 'FREKANS_LOCAL_STORE'         // src/lib/db.ts offline sync & monolineSyncBridge
  | 'SMART_ACCOUNTING_CANONICAL'; // Yeni Merkezi Çift Taraflı Yevmiye Defteri (Otoritatif Hedef)

// 2. KAYNAK FİNANSAL OLAY TÜRLERİ (Source Event Types)
export type SourceFinancialEventType =
  | 'ORDER_PAYMENT_CONFIRMED'       // Siparişin ödeme olarak kesinleşmesi (3DS/Kredi Kartı/Havale)
  | 'COMMISSION_PENDING_ACCRUED'    // Komisyonun 14 günlük bekleme (pending) cüzdanına tahakkuku
  | 'COMMISSION_14D_RELEASED'       // 14 günlük yasal bekleme süresi dolan komisyonun çekilebilir bakiyeye aktarılması
  | 'WITHDRAWAL_REQUESTED'          // Çekim talebi oluşturulması (Cüzdandan bloke)
  | 'WITHDRAWAL_ADMIN_APPROVED'     // Yönetici çekim onay kararı (Ön onay - banka çıkışı henüz yok)
  | 'WITHDRAWAL_BANK_SETTLED'       // Gerçek banka / payout transferinin gerçekleşmesi ve dekont ref üretimi
  | 'WITHDRAWAL_REJECTED_REFUND'    // Reddedilen çekim tutarının cüzdana iadesi
  | 'ORDER_REFUND_CLAWBACK'         // İade / Chargeback ve komisyonların ters kaydı (clawback)
  | 'WALLET_PURCHASE_OR_P2P'        // Cüzdan ile paket aktivasyonu veya üyeler arası P2P transfer
  | 'TAX_WITHHOLDING_REMITTANCE'    // Bireysel bayi stopajının (%20) vergi dairesine beyanı ve tahakkuku
  | 'TAX_REFUND_INVOICE_DECISION';  // Çekime bağlı vergi iadesi faturası inceleme kararı

// 3. MONOLINE SİSTEM MODELLERİ (Devir Raporu Bölüm 3)
export interface MonolineMemberSync {
  user_id: string;                  // Monoline üye ID
  frekans_uid?: string;             // Frekans UserMember uid eşleşmesi
  full_name: string;
  email: string;
  sponsor_id: string;
  career_level: number;             // Monoline derinlik seviyesi
  wallet_domestic_usd: number;      // Yurtiçi çekilebilir bakiye (USD bazlı model)
  wallet_international_usd: number; // Global $3x$ çekilebilir bakiye
  pending_domestic_usd: number;     // 14 gün bekleyen yurtiçi komisyon
  pending_international_usd: number;// 14 gün bekleyen yurtdışı komisyon
  wallet_try_equivalent: number;    // TCMB anlık kur karşılığı (TRY)
  iban?: string;
  identity_number?: string;         // TCKN / VKN
  is_company: boolean;              // Şirket mi / Bireysel mi?
  is_active: boolean;
  source: FinancialDataSource;
}

export interface MonolineOrderRecord {
  order_id: string;                 // Monoline order_id
  frekans_order_id?: string;        // Frekans dealer order id
  user_id: string;
  customer_name: string;
  package_name: string;
  amount: number;
  currency: Currency;
  exchange_rate_snapshot: number;   // Sipariş anındaki TCMB Döviz Alış Kuru (Snapshot)
  amount_try: number;               // Kesinleşmiş resmi TRY tutarı
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  created_at: string;
  is_financialized: boolean;        // Muhasebe defterine işlendi mi?
  is_pending_financialized_risk?: boolean; // Tehlikeli durum: Pending siparişin komisyona girmesi riski
}

export interface MonolineCommissionRecord {
  commission_id: string;
  order_id: string;
  source_user_id: string;
  target_user_id: string;
  target_user_name: string;
  commission_type: 'DIRECT_SPONSOR_20' | 'MONOLINE_DEPTH' | 'SYSTEM_FUND_5';
  tier_depth: number;               // Derinlik (%7, %5, %4, %3, %2, %2, %2)
  rate_percentage: number;
  amount_usd: number;
  exchange_rate_snapshot: number;
  amount_try: number;
  withholding_tax_try: number;      // Bireysel ise %20 Stopaj (360)
  net_payable_try: number;          // Net ödenecek (320)
  region: 'DOMESTIC' | 'INTERNATIONAL';
  release_status:
    | 'PENDING_14D'
    | 'RELEASED'
    | 'CLAWBACKED'
    | 'POOL_TRANSFER_NO_YETKI'
    | 'POOL_TRANSFER_INACTIVE'
    | 'POOL_TRANSFER_NO_UPLINE'
    | 'POOL_TRANSFER_NO_SPONSOR'
    | 'POOL_TRANSFER_NO_USER'
    | string;
  transfer_reason_code?: string;
  order_date: string;
  release_eligible_date: string;    // order_date + 14 gün
  is_released_early_risk?: boolean; // 14 gün dolmadan release edilme riski
  source: FinancialDataSource;
}

export interface MonolineWithdrawalRecord {
  withdrawal_id: string;
  user_id: string;
  user_name: string;
  gross_amount_usd: number;
  exchange_rate_snapshot: number;
  gross_amount_try: number;
  tax_deduction_rate: number;       // 0.20 (%20 Stopaj)
  tax_deduction_try: number;        // Kesilen vergi
  net_amount_try: number;           // Bayiye ödenecek net TL
  net_amount_usd: number;
  channel: 'BANK_TRANSFER' | 'CRYPTO_USDT' | 'WALLET_TRANSFER';
  request_status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Yönetici kararı
  settlement_status: 'UNSETTLED' | 'SETTLED' | 'CANCELLED'; // Gerçek banka çıkışı
  bank_name?: string;
  iban?: string;
  bank_settlement_ref?: string;     // Dekont / Banka EFT-FAST Referansı (Yoksa mutabakat tamamlanamaz)
  payout_provider?: string;         // Örn: Akbank API / Papara / Stripe Payout
  tax_refund_invoice_id?: string;   // Fatura yüklenmiş mi?
  created_at: string;
  decision_at?: string;
  settled_at?: string;
}

// 4. ÇİFT TARAFLI STANDART YEVMİYE DEFTERİ (Double-Entry General Ledger Voucher)
export interface JournalVoucherLine {
  id: string;
  account_code: string;             // Örn: 102.01, 120.01, 320.01, 381.01, 360.01, 391.20, 600.01, 601.01, 760.01
  account_name: string;
  debit_try: number;                // Borç TRY
  credit_try: number;               // Alacak TRY
  debit_usd?: number;               // Orijinal USD Borç (varsa)
  credit_usd?: number;              // Orijinal USD Alacak (varsa)
  description: string;
  subledger_ref?: string;           // Cari kod (Bayi ID / Müşteri ID)
}

export interface DoubleEntryJournalVoucher {
  id: string;
  voucher_number: string;           // Örn: YEV-2026-10-0042
  voucher_date: string;
  period: string;                   // '2026-10'
  source_system: FinancialDataSource;
  source_event_type: SourceFinancialEventType;
  source_event_id: string;          // Orijinal sipariş/komisyon/çekim ID'si
  idempotency_key: string;          // Mükerrerliği önleyen tekil anahtar
  exchange_rate_snapshot: number;   // İşlem anındaki TCMB Döviz Alış Kuru
  currency_primary: Currency;
  lines: JournalVoucherLine[];
  total_debit_try: number;
  total_credit_try: number;
  is_balanced: boolean;             // total_debit == total_credit (Kuruşuna kadar eşit olmak zorunda)
  status: 'POSTED' | 'PROVISIONAL' | 'REVERSED';
  approval_status: 'AUTO_VERIFIED' | 'NEEDS_CFO_REVIEW' | 'FLAGGED_ANOMALY';
  reversal_voucher_id?: string;     // İade durumunda ters kayıt fiş no
  notes?: string;
}

// 5. AKILLI MUTABAKAT VE ANOMALİ / UYUŞMAZLIK DEDEKTÖRÜ (Reconciliation Engine)
export type ReconciliationSeverity = 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'RESOLVED';

export type ReconciliationAnomalyCategory =
  | 'PENDING_ORDER_FINANCIALIZED'   // Kesinleşmemiş sipariş komisyona girmiş
  | 'DUPLICATE_SOURCE_EVENT'        // Mükerrer sipariş / idempotent ihlali
  | 'CURRENCY_SNAPSHOT_MISMATCH'    // USD/TRY kur farkı veya eksik snapshot
  | 'UNSETTLED_WITHDRAWAL_LEAK'     // Çekim onaylanmış ama bankadan çıkmamış (settlement ref yok)
  | 'EARLY_COMMISSION_RELEASE'      // 14 günlük yasal bekleme süresi dolmadan release riski
  | 'NEGATIVE_WALLET_BALANCE'       // Clawback sonrası eksi bakiye
  | 'ORPHAN_IDENTITY_MAPPING'       // Monoline user_id ile Frekans uid eşleşememiş
  | 'TAX_WITHHOLDING_DISCREPANCY';  // %20 stopaj veya gider pusulası matrah uyumsuzluğu

export interface ReconciliationAnomaly {
  id: string;
  category: ReconciliationAnomalyCategory;
  severity: ReconciliationSeverity;
  title: string;
  description: string;
  source_record_id: string;
  source_system: FinancialDataSource;
  detected_at: string;
  impact_amount_try: number;
  impact_amount_usd?: number;
  suggested_action: string;
  resolution_status: 'OPEN' | 'INVESTIGATING' | 'REVERSED' | 'DISMISSED';
  auto_fixable: boolean;
}

export interface MonolineReconciliationSummary {
  total_orders_synced: number;
  total_commissions_calculated_try: number;
  total_commissions_calculated_usd: number;
  pending_commissions_vault_try: number;
  released_commissions_paid_try: number;
  settled_withdrawals_try: number;
  unsettled_approved_withdrawals_try: number; // Onaylanmış ama bankadan çıkışı teyit edilmemiş nakit
  withholding_tax_reserve_try: number;
  anomalies_count: number;
  critical_risks_count: number;
  is_ledger_fully_balanced: boolean;
  authoritative_source_selected: FinancialDataSource;
  last_reconciled_at: string;
}
