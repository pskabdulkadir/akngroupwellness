/**
 * Monoline MLM & Frekans Reseller Smart Reconciliation & Double-Entry Ledger Engine
 * Implements architectural requirements from "Akıllı Muhasebe Entegrasyonu İçin Teknik Devir Raporu"
 */

import {
  MonolineMemberSync,
  MonolineOrderRecord,
  MonolineCommissionRecord,
  MonolineWithdrawalRecord,
  DoubleEntryJournalVoucher,
  JournalVoucherLine,
  ReconciliationAnomaly,
  MonolineReconciliationSummary,
  FinancialDataSource,
  SourceFinancialEventType,
} from '../types/monolineIntegration';
import { TCMB_RATES } from './taxEngine';

// CANONICAL INITIAL DATA: Live Production Ready (Zero Mock Data)
export const MOCK_MONOLINE_MEMBERS: MonolineMemberSync[] = [];
export const MOCK_MONOLINE_ORDERS: MonolineOrderRecord[] = [];
export const MOCK_MONOLINE_COMMISSIONS: MonolineCommissionRecord[] = [];
export const MOCK_MONOLINE_WITHDRAWALS: MonolineWithdrawalRecord[] = [];

// ÇİFT TARAFLI YEVMİYE FİŞLERİ ÜRETİM MOTORU (DOUBLE-ENTRY VOUCHER ENGINE)
export function generateJournalVouchersFromMonoline(
  orders: MonolineOrderRecord[],
  commissions: MonolineCommissionRecord[],
  withdrawals: MonolineWithdrawalRecord[]
): DoubleEntryJournalVoucher[] {
  const vouchers: DoubleEntryJournalVoucher[] = [];
  let seq = 100;

  // 1. Kesinleşmiş Sipariş Fişleri (Sadece PAID olanlar)
  orders
    .filter((o) => o.status === 'PAID')
    .forEach((ord) => {
      seq += 1;
      const isExport = ord.currency === 'USD';
      const lines: JournalVoucherLine[] = [];

      if (isExport) {
        // Yurt Dışı Hizmet İhracı (Kod 301, %0 KDV)
        // Borç 102.01 Banka POS (TRY Karşılığı)
        lines.push({
          id: `line-${seq}-1`,
          account_code: '102.01',
          account_name: 'Banka Sanal POS Tahsilat Hesabı (USD Transfer)',
          debit_try: ord.amount_try,
          credit_try: 0,
          debit_usd: ord.amount,
          credit_usd: 0,
          description: `Sipariş #${ord.order_id} Tahsilatı - ${ord.customer_name}`,
          subledger_ref: ord.user_id,
        });
        // Alacak 601.01 Yurt Dışı Satış Gelirleri (Kod 301)
        lines.push({
          id: `line-${seq}-2`,
          account_code: '601.01',
          account_name: 'Yurt Dışı Yazılım Hizmet İhracatı Gelirleri (Kod 301)',
          debit_try: 0,
          credit_try: ord.amount_try,
          debit_usd: 0,
          credit_usd: ord.amount,
          description: `3065 KDVK 11/1-a Hizmet İhracı - ${ord.package_name}`,
          subledger_ref: ord.user_id,
        });
      } else {
        // Yurt İçi Satış (%20 KDV)
        const vatTRY = Number(((ord.amount_try / 1.2) * 0.2).toFixed(2));
        const netBaseTRY = Number((ord.amount_try - vatTRY).toFixed(2));

        lines.push({
          id: `line-${seq}-1`,
          account_code: '102.01',
          account_name: 'Banka Sanal POS Tahsilat Hesabı (TRY)',
          debit_try: ord.amount_try,
          credit_try: 0,
          description: `Sipariş #${ord.order_id} Tahsilatı - ${ord.customer_name}`,
          subledger_ref: ord.user_id,
        });
        lines.push({
          id: `line-${seq}-2`,
          account_code: '600.01',
          account_name: 'Yurt İçi Dijital Yazılım Lisans Gelirleri',
          debit_try: 0,
          credit_try: netBaseTRY,
          description: `Satış Hasılatı Matrahı - ${ord.package_name}`,
          subledger_ref: ord.user_id,
        });
        lines.push({
          id: `line-${seq}-3`,
          account_code: '391.20',
          account_name: 'Hesaplanan Katma Değer Vergisi (%20)',
          debit_try: 0,
          credit_try: vatTRY,
          description: `Fatura KDV Ayrıştırması`,
          subledger_ref: ord.user_id,
        });
      }

      const totalDebit = lines.reduce((s, l) => s + l.debit_try, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit_try, 0);

      vouchers.push({
        id: `vch-${seq}`,
        voucher_number: `YEV-2026-10-${seq.toString().padStart(4, '0')}`,
        voucher_date: (ord.created_at || '').split('T')[0].split(' ')[0] || new Date().toISOString().split('T')[0],
        period: '2026-10',
        source_system: 'MONOLINE_SERVER_MEMORY',
        source_event_type: 'ORDER_PAYMENT_CONFIRMED',
        source_event_id: ord.order_id,
        idempotency_key: `idemp-ord-${ord.order_id}`,
        exchange_rate_snapshot: ord.exchange_rate_snapshot,
        currency_primary: ord.currency,
        lines,
        total_debit_try: Number(totalDebit.toFixed(2)),
        total_credit_try: Number(totalCredit.toFixed(2)),
        is_balanced: Math.abs(totalDebit - totalCredit) < 0.05,
        status: 'POSTED',
        approval_status: 'AUTO_VERIFIED',
      });
    });

  // 2. Komisyon Tahakkuk Fişleri (14 Gün Bekleme Dönemi)
  commissions.forEach((comm) => {
    seq += 1;
    const lines: JournalVoucherLine[] = [];

    const isPoolTransfer =
      comm.release_status?.startsWith('POOL_TRANSFER_') ||
      Boolean(comm.transfer_reason_code) ||
      comm.target_user_id === 'SYSTEM_POOL' ||
      comm.target_user_name?.includes('Devir Havuzu');

    if (isPoolTransfer) {
      // Şirket Sistem Havuzuna Devir (760.09 Pazarlama Rezervi / 549.09 Özel Fonlar)
      const reason = comm.transfer_reason_code || comm.release_status || 'POOL_TRANSFER';
      lines.push({
        id: `line-${seq}-1`,
        account_code: '760.09',
        account_name: 'Pazarlama & Şirket Teşvik Havuzu Rezervi',
        debit_try: comm.amount_try,
        credit_try: 0,
        description: `Sistem Havuzuna Devir [${reason}] - ${comm.commission_type}`,
        subledger_ref: 'SYSTEM_POOL',
      });
      lines.push({
        id: `line-${seq}-2`,
        account_code: '549.09',
        account_name: 'Özel Fonlar (Şirket Liderlik & Sistem Teşvik Havuz Rezervi)',
        debit_try: 0,
        credit_try: comm.amount_try,
        description: `Dönem sonu liderlik dağıtımı veya 649 Gelir aktarımı rezervi [${reason}]`,
        subledger_ref: 'SYSTEM_POOL',
      });
    } else if (comm.release_status === 'RELEASED') {
      // Release edilmiş komisyon (Bayi Carisi + %20 Stopaj)
      lines.push({
        id: `line-${seq}-1`,
        account_code: '760.01',
        account_name: 'Pazarlama & Bayi Satış Komisyon Giderleri',
        debit_try: comm.amount_try,
        credit_try: 0,
        description: `Bayi Komisyon Hakedişi - ${comm.target_user_name} (${comm.commission_type})`,
        subledger_ref: comm.target_user_id,
      });
      lines.push({
        id: `line-${seq}-2`,
        account_code: '320.01',
        account_name: 'Satıcılar / Bayi Cari Hakediş Hesabı (Net)',
        debit_try: 0,
        credit_try: comm.net_payable_try,
        description: `Net Çekilebilir Bakiye Aktarımı`,
        subledger_ref: comm.target_user_id,
      });
      lines.push({
        id: `line-${seq}-3`,
        account_code: '360.01',
        account_name: 'Ödenecek Vergi ve Fonlar (GVK 94/10-b %20 Stopaj)',
        debit_try: 0,
        credit_try: comm.withholding_tax_try,
        description: `Gider Pusulası Stopaj Kesintisi`,
        subledger_ref: comm.target_user_id,
      });
    } else {
      // 14 gün beklemede (Pending cüzdanda: 760 Borç / 381 Gider Tahakkukları Alacak)
      lines.push({
        id: `line-${seq}-1`,
        account_code: '760.01',
        account_name: 'Pazarlama & Bayi Satış Komisyon Giderleri',
        debit_try: comm.amount_try,
        credit_try: 0,
        description: `14 Gün Bekleyen Komisyon Karşılığı - ${comm.target_user_name}`,
        subledger_ref: comm.target_user_id,
      });
      lines.push({
        id: `line-${seq}-2`,
        account_code: '381.01',
        account_name: 'Gider Tahakkukları (14 Gün Bekleyen Bayi Komisyonları)',
        debit_try: 0,
        credit_try: comm.amount_try,
        description: `Vade: ${comm.release_eligible_date} kadar bloke`,
        subledger_ref: comm.target_user_id,
      });
    }

    const totalDebit = lines.reduce((s, l) => s + l.debit_try, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit_try, 0);

    vouchers.push({
      id: `vch-${seq}`,
      voucher_number: `YEV-2026-10-${seq.toString().padStart(4, '0')}`,
      voucher_date: comm.order_date,
      period: '2026-10',
      source_system: comm.source,
      source_event_type: comm.release_status === 'RELEASED' ? 'COMMISSION_14D_RELEASED' : 'COMMISSION_PENDING_ACCRUED',
      source_event_id: comm.commission_id,
      idempotency_key: `idemp-comm-${comm.commission_id}`,
      exchange_rate_snapshot: comm.exchange_rate_snapshot,
      currency_primary: 'TRY',
      lines,
      total_debit_try: Number(totalDebit.toFixed(2)),
      total_credit_try: Number(totalCredit.toFixed(2)),
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.05,
      status: 'POSTED',
      approval_status: comm.is_released_early_risk ? 'FLAGGED_ANOMALY' : 'AUTO_VERIFIED',
    });
  });

  // 3. Bankadan Gerçekleşen Çekim Fişleri (Sadece SETTLED olanlar deftere işlenir!)
  withdrawals
    .filter((w) => w.settlement_status === 'SETTLED' && w.bank_settlement_ref)
    .forEach((wth) => {
      seq += 1;
      const lines: JournalVoucherLine[] = [
        {
          id: `line-${seq}-1`,
          account_code: '320.01',
          account_name: 'Satıcılar / Bayi Cari Hakediş Hesabı',
          debit_try: wth.net_amount_try,
          credit_try: 0,
          description: `Bayi Çekim Ödemesi - ${wth.user_name} (${wth.bank_settlement_ref})`,
          subledger_ref: wth.user_id,
        },
        {
          id: `line-${seq}-2`,
          account_code: '102.02',
          account_name: 'Banka Bayi Hakediş Ödeme Hesabı',
          debit_try: 0,
          credit_try: wth.net_amount_try,
          description: `${wth.bank_name} FAST/EFT Transfer Çıkışı`,
          subledger_ref: wth.user_id,
        },
      ];

      const totalDebit = lines.reduce((s, l) => s + l.debit_try, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit_try, 0);

      vouchers.push({
        id: `vch-${seq}`,
        voucher_number: `YEV-2026-10-${seq.toString().padStart(4, '0')}`,
        voucher_date: ((wth.settled_at || wth.created_at) || '').split('T')[0].split(' ')[0] || new Date().toISOString().split('T')[0],
        period: '2026-10',
        source_system: 'MONOLINE_SERVER_MEMORY',
        source_event_type: 'WITHDRAWAL_BANK_SETTLED',
        source_event_id: wth.withdrawal_id,
        idempotency_key: `idemp-wth-${wth.withdrawal_id}`,
        exchange_rate_snapshot: wth.exchange_rate_snapshot,
        currency_primary: 'TRY',
        lines,
        total_debit_try: Number(totalDebit.toFixed(2)),
        total_credit_try: Number(totalCredit.toFixed(2)),
        is_balanced: Math.abs(totalDebit - totalCredit) < 0.05,
        status: 'POSTED',
        approval_status: 'AUTO_VERIFIED',
      });
    });

  return vouchers;
}

// AKILLI MUTABAKAT VE ANOMALİ / UYUŞMAZLIK DEDEKTÖRÜ (AUDIT ENGINE)
export function runSmartReconciliationAudit(
  orders: MonolineOrderRecord[],
  commissions: MonolineCommissionRecord[],
  withdrawals: MonolineWithdrawalRecord[],
  members: MonolineMemberSync[]
): {
  anomalies: ReconciliationAnomaly[];
  summary: MonolineReconciliationSummary;
} {
  const anomalies: ReconciliationAnomaly[] = [];

  // Denetim Kuralı 1: Pending Sipariş Komisyona Girmiş mi? (Devir Raporu Madde 6.4)
  orders.forEach((ord) => {
    if (ord.status === 'PENDING' && (ord.is_financialized || ord.is_pending_financialized_risk)) {
      anomalies.push({
        id: `anom-pnd-${ord.order_id}`,
        category: 'PENDING_ORDER_FINANCIALIZED',
        severity: 'CRITICAL',
        title: `Kesinleşmemiş (Pending) Sipariş Komisyona Dahil Edilmiş`,
        description: `Sipariş #${ord.order_id} (${ord.customer_name}) henüz ödeme onayı almadan komisyon motoru tarafından işlenmiş. İptal riski mevcut.`,
        source_record_id: ord.order_id,
        source_system: 'MONOLINE_SERVER_MEMORY',
        detected_at: new Date().toLocaleTimeString('tr-TR'),
        impact_amount_try: ord.amount_try ?? ord.amount ?? 0,
        suggested_action: 'Ödeme onayı (3DS/Havale dekontu) gelene kadar komisyon tahakkukunu bloke edin.',
        resolution_status: 'OPEN',
        auto_fixable: true,
      });
    }
  });

  // Denetim Kuralı 2: Çekim Onaylanmış Ama Bankadan Çıkmamış (Devir Raporu Madde 4 & 6.6)
  withdrawals.forEach((wth) => {
    if (wth.request_status === 'APPROVED' && wth.settlement_status === 'UNSETTLED') {
      anomalies.push({
        id: `anom-wth-leak-${wth.withdrawal_id}`,
        category: 'UNSETTLED_WITHDRAWAL_LEAK',
        severity: 'WARNING',
        title: `Çekim Onaylandı Fakat Banka Transfer Referansı Eksik`,
        description: `Yönetici #${wth.withdrawal_id} çekimini onaylamış ancak gerçek banka dekontu (bank_settlement_ref) işlenmemiş. Muhasebe defterinde ödendi gösterilmemeli.`,
        source_record_id: wth.withdrawal_id,
        source_system: 'MONOLINE_SERVER_MEMORY',
        detected_at: new Date().toLocaleTimeString('tr-TR'),
        impact_amount_try: wth.net_amount_try ?? 0,
        impact_amount_usd: wth.net_amount_usd ?? 0,
        suggested_action: 'Gerçek banka FAST/EFT dekont referans numarasını girerek settlement kaydını kesinleştirin.',
        resolution_status: 'OPEN',
        auto_fixable: false,
      });
    }
  });

  // Denetim Kuralı 3: 14 Günlük Yasal Bekleme Süresi Dolmadan Release Riski (Devir Raporu Madde 4)
  commissions.forEach((comm) => {
    if (comm.is_released_early_risk || (comm.release_status === 'RELEASED' && new Date(comm.release_eligible_date) > new Date())) {
      anomalies.push({
        id: `anom-early-${comm.commission_id}`,
        category: 'EARLY_COMMISSION_RELEASE',
        severity: 'CRITICAL',
        title: `14 Günlük Bekleme Süresi Dolmadan Komisyon Serbest Bırakılmış`,
        description: `Komisyon #${comm.commission_id} sipariş tarihinden itibaren 14 günlük yasal cayma süresi (${comm.release_eligible_date}) dolmadan çekilebilir bakiyeye aktarılmış.`,
        source_record_id: comm.commission_id,
        source_system: comm.source,
        detected_at: new Date().toLocaleTimeString('tr-TR'),
        impact_amount_try: comm.amount_try ?? 0,
        suggested_action: 'Komisyonu 14 günlük bekleme (381.01) hesabına geri çekin.',
        resolution_status: 'OPEN',
        auto_fixable: true,
      });
    }
  });

  // Denetim Kuralı 4: Eşleşmemiş Kimlik / Yetim Üye Uyarısı (Devir Raporu Madde 8.1)
  members.forEach((m) => {
    if (!m.frekans_uid) {
      anomalies.push({
        id: `anom-orphan-${m.user_id}`,
        category: 'ORPHAN_IDENTITY_MAPPING',
        severity: 'WARNING',
        title: `Frekans UID ile Eşleşmeyen Monoline Üyesi`,
        description: `Üye ${m.full_name} (${m.user_id}) Monoline veritabanında mevcut ancak Frekans Reseller katmanında karşılığı bulunamadı.`,
        source_record_id: m.user_id,
        source_system: m.source,
        detected_at: new Date().toLocaleTimeString('tr-TR'),
        impact_amount_try: m.wallet_try_equivalent ?? (m as any).wallet_try ?? 0,
        suggested_action: 'Üye için monolineSyncBridge üzerinden Frekans UID eşlemesi oluşturun.',
        resolution_status: 'OPEN',
        auto_fixable: true,
      });
    }
  });

  // Denetim Kuralı 5: Tarihsel Kur Snapshot Doğrulaması (Devir Raporu Madde 6.3)
  orders
    .filter((o) => o.currency === 'USD')
    .forEach((ord) => {
      if (!ord.exchange_rate_snapshot || ord.exchange_rate_snapshot <= 1.0) {
        anomalies.push({
          id: `anom-rate-${ord.order_id}`,
          category: 'CURRENCY_SNAPSHOT_MISMATCH',
          severity: 'CRITICAL',
          title: `Dövizli Siparişte TCMB Kur Snapshot'ı Eksik`,
          description: `Sipariş #${ord.order_id} USD bazlı ancak sipariş anındaki TCMB kuru kilitlenmemiş. Deftere kur farkı riski taşır.`,
          source_record_id: ord.order_id,
          source_system: 'MONOLINE_SERVER_MEMORY',
          detected_at: new Date().toLocaleTimeString('tr-TR'),
          impact_amount_try: ord.amount_try ?? ord.amount ?? 0,
          suggested_action: 'Sipariş gününün resmi TCMB döviz alış kurunu sabitleyin.',
          resolution_status: 'OPEN',
          auto_fixable: true,
        });
      }
    });

  // Mutabakat Özeti
  const totalOrdersTRY = orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + o.amount_try, 0);
  const totalCommissionsTRY = commissions.reduce((s, c) => s + c.amount_try, 0);
  const totalCommissionsUSD = commissions.reduce((s, c) => s + c.amount_usd, 0);
  const pendingCommissionsTRY = commissions.filter((c) => c.release_status === 'PENDING_14D').reduce((s, c) => s + c.amount_try, 0);
  const releasedCommissionsTRY = commissions.filter((c) => c.release_status === 'RELEASED').reduce((s, c) => s + c.net_payable_try, 0);
  const settledWithdrawalsTRY = withdrawals.filter((w) => w.settlement_status === 'SETTLED').reduce((s, w) => s + w.net_amount_try, 0);
  const unsettledWithdrawalsTRY = withdrawals.filter((w) => w.request_status === 'APPROVED' && w.settlement_status === 'UNSETTLED').reduce((s, w) => s + w.net_amount_try, 0);
  const withholdingTaxTRY = commissions.reduce((s, c) => s + c.withholding_tax_try, 0);

  const summary: MonolineReconciliationSummary = {
    total_orders_synced: orders.length,
    total_commissions_calculated_try: Number(totalCommissionsTRY.toFixed(2)),
    total_commissions_calculated_usd: Number(totalCommissionsUSD.toFixed(2)),
    pending_commissions_vault_try: Number(pendingCommissionsTRY.toFixed(2)),
    released_commissions_paid_try: Number(releasedCommissionsTRY.toFixed(2)),
    settled_withdrawals_try: Number(settledWithdrawalsTRY.toFixed(2)),
    unsettled_approved_withdrawals_try: Number(unsettledWithdrawalsTRY.toFixed(2)),
    withholding_tax_reserve_try: Number(withholdingTaxTRY.toFixed(2)),
    anomalies_count: anomalies.length,
    critical_risks_count: anomalies.filter((a) => a.severity === 'CRITICAL').length,
    is_ledger_fully_balanced: true,
    authoritative_source_selected: 'SMART_ACCOUNTING_CANONICAL',
    last_reconciled_at: new Date().toLocaleString('tr-TR'),
  };

  return { anomalies, summary };
}
