export type Currency = 'TRY' | 'USD' | 'EUR';

export type InvoiceScenario = 'TEMELFATURA' | 'TICARIFATURA' | 'EARSIVBELGE' | 'IHRACAT' | 'IADE';

export type InvoiceType = 'SATIS' | 'HIZMET_IHRACI' | 'KOMISYON_GIDER' | 'IADE';

export type GibStatusCode = '1200' | '1100' | '1300' | '1210';

export interface GibStatus {
  code: GibStatusCode;
  description: string;
  sentAt: string;
  signedAt?: string;
  gibEnvelopeId?: string;
  responseMessage?: string;
}

export interface CustomerInfo {
  name: string;
  taxNumber: string; // TCKN (11 hane) or VKN (10 hane)
  isCorporate: boolean;
  isGibRegistered: boolean; // GİB e-Fatura mükellefi mi?
  taxOffice?: string;
  address: string;
  city: string;
  country: string; // 'TR', 'DE', 'FR', 'US', etc.
  email: string;
  euVatNumber?: string; // AB içi B2B alıcılar için VIES geçerli KDV numarası
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  vatRate: number; // 0.20 or 0 or OSS rate
  vatAmount: number;
  subtotal: number;
  total: number;
  vatExemptionCode?: string; // 301 for Hizmet İhracatı
  vatExemptionReason?: string;
  isPhysicalGood?: boolean;
  sku?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "VRS202600000108"
  ettn: string; // UUID v4
  issueDate: string;
  issueTime: string;
  customer: CustomerInfo;
  scenario: InvoiceScenario;
  type: InvoiceType;
  currency: Currency;
  exchangeRateTCMB: number; // 1 USD / EUR = X TRY (TCMB Döviz Alış)
  items: InvoiceItem[];
  subtotal: number; // Matrah
  vatTotal: number; // Hesaplanan KDV
  grandTotal: number; // Genel Toplam (Orijinal Para Birimi)
  grandTotalTRY: number; // Genel Toplam TRY (Deftere giren resmi tutar)
  gibStatus: GibStatus;
  integrator: 'Logo' | 'Uyumsoft' | 'Parasut' | 'NetGSM';
  notes: string[];
  paymentMethod: '3D_SECURE_CREDIT_CARD' | 'HAVALE_EFT' | 'CRYPTO';
  affiliatedDistributorId?: string;
  isRefunded?: boolean;
  refundDate?: string;
  refundInvoiceNumber?: string;
}

export interface Distributor {
  id: string;
  name: string;
  identityNumber: string; // TCKN or VKN
  isCompany: boolean; // True -> Corporate, False -> Individual (Gider Pusulası)
  companyTitle?: string;
  taxOffice?: string;
  iban: string;
  level: number; // Monoline tier: 1 (Direct), 2, 3, 4
  status: 'ACTIVE' | 'PENDING_DOCUMENT' | 'SUSPENDED';
  totalEarningsTRY: number;
  totalStopajPaidTRY: number;
  currentWalletBalanceTRY: number; // Cüzdan hakediş bakiyesi (Clawback yapılabilir)
  country?: string; // Mukimlik ülkesi
  hasTaxResidencyCertificate?: boolean; // ÇVÖA mukimlik belgesi
}

export interface CommissionPayout {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  distributorId: string;
  distributorName: string;
  isCompany: boolean;
  tierLevel: number;
  commissionRate: number; // e.g. 0.15 (15%)
  baseAmountTRY: number; // Net satış matrahı
  grossCommissionTRY: number; // Brüt hakediş
  withholdingRate: number; // Stopaj oranı (0.20 if individual, 0 if company)
  withholdingAmountTRY: number; // Gelir Vergisi Kesintisi (Stopaj)
  stampTaxRate?: number; // Damga vergisi (binde 9.48)
  stampTaxAmountTRY?: number;
  netPayableTRY: number; // Bayiye net ödenecek
  payoutDate: string;
  documentType: 'GIDER_PUSULASI' | 'KOMISYON_FATURASI';
  documentNumber: string; // e.g. "GDP20260000042"
  isPaid: boolean;
  ledgerPosted: boolean;
  isClawbacked?: boolean;
  clawbackDate?: string;
  clawbackReason?: string;
}

export interface RefundRecord {
  id: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  refundInvoiceNumber: string;
  ettn: string;
  date: string;
  reason: 'MUSTERI_IADE_TALEBI' | 'CHARGEBACK_ITIRAZ' | 'HIZMET_IPTALI';
  refundAmount: number;
  refundAmountTRY: number;
  currency: Currency;
  customerName: string;
  clawbacksApplied: {
    distributorId: string;
    distributorName: string;
    grossClawbackTRY: number;
    stopajReversedTRY: number;
    netClawbackTRY: number;
  }[];
  vatReversalTRY: number; // İade KDV'si (610 Satıştan İadeler ve 191 İndirilecek KDV)
  muhtasarCorrectionFiled: boolean;
}

// 2. FİZİKSEL ÜRÜN & STOK & ENVANTER (153 / 621 Hesaplar & e-İrsaliye)
export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: 'CIHAZ_DONANIM' | 'TAKVIYE_GIDA' | 'KOZMETIK' | 'DIJITAL_PAKET';
  unit: 'ADET' | 'KUTU' | 'LISANS';
  currentStock: number;
  reorderLevel: number;
  unitCostTRY: number; // Birim maliyet (153 Ticari Mallar)
  sellingPriceTRY: number;
  vatRate: number; // 0.10, 0.20
  warehouseLocation: string;
  lastInventoryDate: string;
  inflationAdjustedCostTRY?: number; // VUK 298/A Enflasyon Düzeltmesi Sonrası
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  movementType: 'GIRIS_SATINALMA' | 'CIKIS_SATIS' | 'IADE_GIRIS' | 'FIRE_ZAYIAT';
  quantity: number;
  unitPriceTRY: number;
  totalCostTRY: number; // SMM (621 Satılan Ticari Mallar Maliyeti)
  eWaybillNumber: string; // e-İrsaliye No (Örn: IRS20260000018)
  referenceDocument: string;
  accountingAccount: '153.01' | '621.01';
}

// 3. ULUSLARARASI VERGİ & AB ONE STOP SHOP (OSS / IOSS)
export interface EuOssCountry {
  countryCode: string;
  countryName: string;
  standardVatRate: number; // Örn: Almanya %19, Fransa %20, İtalya %22
  currency: string;
}

export interface OssDeclarationRecord {
  id: string;
  quarter: '2026-Q1' | '2026-Q2' | '2026-Q3' | '2026-Q4';
  countryCode: string;
  countryName: string;
  salesType: 'B2C_DIGITAL_SERVICE' | 'B2C_GOODS_IOSS';
  taxableBaseEUR: number;
  vatRate: number;
  vatAmountEUR: number;
  vatAmountTRY: number;
  isB2BReverseCharge: boolean; // B2B ise ters paylaştırma
  viesStatus?: 'VALID' | 'NOT_APPLICABLE';
}

// 4. AÇIK BANKACILIK & OTOMATİK HESAP MUTABAKATI
export interface BankAccount {
  id: string;
  bankName: string; // 'Akbank', 'Garanti BBVA', 'İş Bankası', 'Yapı Kredi'
  accountNumber: string;
  iban: string;
  currency: Currency;
  balance: number;
  lastSyncAt: string;
  openBankingStatus: 'CONNECTED' | 'SYNCING' | 'ERROR';
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankName: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  flow: 'GIRIS_INFLOW' | 'CIKIS_OUTFLOW';
  category: 'SANAL_POS_TAHSILAT' | 'BAYI_KOMISYON_EFT' | 'SWIFT_DOVIZ' | 'VERGI_ODEME' | 'GENEL_GIDER';
  counterparty: string;
  matchedLedgerEntryId?: string;
  matchStatus: 'MUTABIK' | 'ESLESTI' | 'ESLESMEDI';
  swiftFeeTRY?: number;
  fxDifferenceTRY?: number; // 646 Kambiyo Kârı / 653 Kambiyo Zararı
}

// 5. ŞİRKET İÇİ GİDER (EXPENSE) & BORDROLAMA (760 / 770 / 360 / 361)
export interface ExpenseRecord {
  id: string;
  date: string;
  invoiceNumber: string;
  vendorName: string;
  vendorTaxNumber: string;
  category: '760_PAZARLAMA' | '770_GENEL_YONETIM' | '770_BULUT_SERVER';
  description: string;
  subtotalTRY: number;
  vatRate: number; // 0.20
  vatDeductible191: number; // İndirilecek KDV
  vatWithholding2?: number; // KDV Tevkifatı (2 No.lu KDV Örn: Yurt Dışı Meta/Google Ads)
  stopajAmount360?: number; // Reklam Stopajı (%15) veya Kira Stopajı (%20)
  totalTRY: number;
  paymentStatus: 'ODENDI' | 'BEKLIYOR';
}

export interface PayrollRecord {
  id: string;
  periodMonth: string;
  employeeName: string;
  employeeIdNumber: string;
  department: string;
  grossSalaryTRY: number;
  sgkWorkerShare14: number; // %14 SGK İşçi Payı
  unemploymentWorker1: number; // %1 İşsizlik İşçi Payı
  incomeTax360: number; // Gelir Vergisi (360)
  stampTax360: number; // Damga Vergisi
  sgkEmployerShare20_5: number; // %20.5 SGK İşveren Payı (770 Gider)
  unemploymentEmployer2: number; // %2 İşsizlik İşveren Payı
  netSalaryTRY: number; // Personele Ödenen Net Maaş
  totalEmployerCostTRY: number; // Şirkete Toplam Maliyet (770.01)
  totalSgkPayable361: number; // SGK'ya Ödenecek (361)
}

// 6. CARİ HESAP & Ba/Bs E-MUTABAKAT MODÜLÜ
export interface B2BReconciliation {
  id: string;
  distributorId: string;
  companyTitle: string;
  vkn: string;
  taxOffice: string;
  period: string;
  ourLedgerBalanceTRY: number; // Bizim defterimizdeki bakiye
  theirLedgerBalanceTRY: number; // Bayinin bildirdiği bakiye
  differenceTRY: number;
  status: 'MUTABIK' | 'ITIRAZ' | 'ONAY_BEKLIYOR';
  disputeNotes?: string;
  lastNotifiedAt: string;
  autoReconciled: boolean;
}

export interface BaBsItem {
  id: string;
  type: 'FORM_BA' | 'FORM_BS'; // Ba: Alış Bildirimi, Bs: Satış Bildirimi
  partnerName: string;
  taxNumber: string;
  country: string;
  documentCount: number;
  totalExcludingVatTRY: number;
  isOverLimit: boolean; // 5.000 TL KDV hariç haddi aşıyor mu?
  notifiedToGib: boolean;
}

// GENEL YEVMİYE VE FİNANSAL RAPOR
export interface LedgerEntry {
  id: string;
  date: string;
  entryNumber: number; // Yevmiye Madde No
  accountCode: string; // e.g. "600.01", "391.20", "102.01", "360.01", "760.01", "153.01", "621.01", "610.01"
  accountName: string;
  debitTRY: number; // Borç
  creditTRY: number; // Alacak
  description: string;
  documentNumber: string;
  currency: Currency;
  originalAmount?: number;
}

export interface TaxReportSummary {
  periodMonth: string;
  tcmbUsdRate: number;
  tcmbEurRate: number;
  totalDomesticSalesTRY: number;
  totalExportSalesTRY: number;
  totalExportSalesUSD: number;
  totalGrossRevenueTRY: number;
  vatCalculated391: number;
  vatDeductible191: number; // Şirket giderleri ve ürün alışlarından gelen KDV
  vatPayableNet: number;
  vatRefundEligibleTRY: number;
  totalWithholdingTax360: number;
  totalNetCommissionsPaidTRY: number;
  estimatedCorporateTaxTRY: number;
  totalRefundsTRY: number;
  totalClawbacksTRY: number;
  totalInventoryValueTRY: number;
  totalSmmCostTRY: number;
  totalExpenses770TRY: number;
  totalPayrollCostTRY: number;
  euOssVatPayableEUR: number;
}

export interface AIAdvice {
  id: string;
  title: string;
  category: 'KDV_IADE' | 'STOPAJ_LIKIDITE' | 'GECICI_VERGI' | 'GIB_UYUM' | 'NAKIT_AKISI' | 'CLAWBACK' | 'OSS_TAX' | 'ENVANTER';
  priority: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFO';
  summary: string;
  detailedAnalysis: string;
  actionRecommendation: string;
  statutoryDeadline?: string;
  financialImpactTRY?: number;
  createdAt: string;
}

// 7. SESLİ ASİSTAN & GÜVENLİK KİLİDİ (VOICE GUARD & AUDIT TRAIL)
export type SupportedLanguage = 'tr' | 'en' | 'de';

export type VoiceCommandStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'QUERY_SUCCESS'
  | 'FALLBACK';

export interface VoiceCommandLog {
  id: string;
  timestamp: string;
  user: string;
  spokenText: string;
  parsedAction: string;
  targetEntity?: string;
  amount?: number;
  currency?: Currency;
  status: VoiceCommandStatus;
  responseSpoken: string;
  auditDetails?: string;
  documentRef?: string;
}

export interface PendingVoiceAction {
  id: string;
  type: 'ISSUE_INVOICE' | 'APPROVE_COMMISSION' | 'EXECUTE_CLAWBACK' | 'TRANSFER_FUNDS' | 'ADJUST_STOCK';
  title: string;
  summary: string;
  details: {
    targetName: string;
    targetTaxNo?: string;
    amount: number;
    currency: Currency;
    amountTRY: number;
    vatRate?: number;
    vatAmountTRY?: number;
    taxDeductionTRY?: number;
    netAmountTRY?: number;
    description: string;
  };
  promptQuestion: string;
  createdAt: string;
}

export interface ProactiveAlert {
  id: string;
  type: 'DAILY_BRIEF' | 'CRITICAL_DEADLINE' | 'WALLET_LOW' | 'INVOICE_PENDING';
  title: string;
  message: string;
  speechText: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  actionTab?: string;
  actionLabel?: string;
  dismissed?: boolean;
}

// 8. AKN GLOBAL GROUP LTD. KURUMSAL KİMLİK & DİNAMİK ŞİRKET PROFİLİ
export interface CompanyProfile {
  legalName: string;
  shortName: string;
  tradeTitle: string;
  vkn: string;
  taxOffice: string;
  taxOfficeCode: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  tradeRegistryNumber: string;
  mersisNumber: string;
  kepAddress: string;
  email: string;
  website: string;
  phone: string;
  cfoTitle: string;
  directorName: string;
  gibIntegrator: 'UYUMSOFT' | 'LOGO' | 'PARASUT' | 'NETGSM' | 'GIB_PORTAL';
  gibApiKey: string;
  gibApiSecret: string;
  gibSenderIdentifier: string;
  gibReceiverIdentifier: string;
  gibEndpointUrl: string;
  isSandbox: boolean;
  waybillStatusDefault: 'DRAFT' | 'ISSUED' | 'DELIVERED';
  smmmReadOnlyAccessEnabled: boolean;
  lastUpdatedAt?: string;
}

export const INITIAL_COMPANY_PROFILE: CompanyProfile = {
  legalName: 'AKN Global Group Ltd.',
  shortName: 'AKN Global',
  tradeTitle: 'AKN Global Group Ltd. Teknoloji & Dijital Finans Direktörlüğü',
  vkn: '0849201948',
  taxOffice: 'Büyük Mükellefler V.D. / Kadıköy',
  taxOfficeCode: '34251',
  address: 'Levent Mah. Büyükdere Cad. No: 195 K:12 Beşiktaş / İstanbul',
  city: 'İstanbul',
  district: 'Beşiktaş',
  postalCode: '34394',
  tradeRegistryNumber: '958204-5',
  mersisNumber: '0084920194800001',
  kepAddress: 'aknglobal@hs01.kep.tr',
  email: 'finans@aknglobal.com',
  website: 'www.aknglobal.com',
  phone: '+90 (212) 892 40 00',
  cfoTitle: 'Sanal Finans Direktörü (AI CFO & Mali Müşavir)',
  directorName: 'Ece Yılmaz (Mali İşler Direktörü & AI CFO)',
  gibIntegrator: 'UYUMSOFT',
  gibApiKey: 'akn_live_sec_994821a8f01b',
  gibApiSecret: 'gib_token_77a942b001fe9d',
  gibSenderIdentifier: 'urn:mail:defaultgb@aknglobal.com',
  gibReceiverIdentifier: 'urn:mail:defaultpk@aknglobal.com',
  gibEndpointUrl: 'https://efatura-test.uyumsoft.com.tr/services/integration',
  isSandbox: true,
  waybillStatusDefault: 'ISSUED',
  smmmReadOnlyAccessEnabled: true,
  lastUpdatedAt: '2026-10-21 09:30',
};

// Geriye dönük uyumluluk için alias
export const COMPANY_PROFILE = INITIAL_COMPANY_PROFILE;

// 9. VERGİ DAİRESİ BAZLI DETAYLI TAHAKKUK VE ÖDEME TAKİBİ
export interface TaxOfficeAccrual {
  id: string;
  taxType: 'KDV_1' | 'MUHTASAR_STOPAJ' | 'KURUMLAR_GECICI';
  taxCode: string; // '0015', '0003', '0033'
  title: string;
  taxOfficeName: string;
  taxOfficeCode: string;
  taxPeriod: string; // 'Ekim 2026'
  taxableBaseTRY: number;
  calculatedTaxTRY: number;
  deductibleTaxTRY?: number;
  netTaxTRY: number;
  stampDutyTRY: number; // Damga Vergisi (1047): 450.50 TL
  totalDueTRY: number;
  statutoryDeadline: string; // '2026-10-28', '2026-10-26', '2026-11-17'
  paymentStatus: 'UNPAID' | 'PAID' | 'SCHEDULED';
  accrualSlipNumber: string; // Tahakkuk Fiş No örn: 'THK-2026-0015-8492'
  gibTrackingReference: string; // 16 haneli GİB takip referansı
  paidAt?: string;
  bankReceiptNo?: string;
}

// 10. GELECEK İHTİYAÇLAR ALTYAPISI (E-İRSALİYE & WAYBILL)
export interface WaybillRecord {
  id: string;
  waybillNumber: string;
  ettn: string;
  orderId: string;
  customerName: string;
  destinationAddress: string;
  carrierName: string;
  plateNumber: string;
  issueDate: string;
  deliveryDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  itemCount: number;
  totalWeightKg: number;
}

export interface AutoPilotExecutionSummary {
  timestamp: string;
  invoicesIssuedCount: number;
  invoicesTotalAmountTRY: number;
  commissionsProcessedCount: number;
  stopajWithheldTRY: number;
  taxVaultBufferTRY: number;
  tcmbRatesSynced: {
    usd: number;
    eur: number;
  };
  cfoExecutiveNote: string;
}

export interface LiveExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  TRY: number;
  lastUpdated: string;
  source: string;
  provider: string;
  isLive: boolean;
  buyingSelling?: {
    USD: { buying: number; selling: number };
    EUR: { buying: number; selling: number };
    GBP: { buying: number; selling: number };
  };
}

export interface ExpenseVoucherRecord {
  id: string | number;
  voucher_number: string;
  ettn_uuid: string;
  commission_log_id: string;
  source_event_id: string;
  order_id: string;
  dealer_user_id: string;
  dealer_full_name: string;
  dealer_tckn: string;
  dealer_tax_office?: string;
  dealer_address?: string;
  dealer_iban: string;
  is_company: boolean;
  gross_amount: number;
  withholding_rate: number;
  withholding_amount: number;
  net_amount: number;
  currency: string;
  status: 'ISSUED' | 'QUEUED_FOR_PAYOUT' | 'PAID_SETTLED' | 'CANCELLED';
  integrator_name: string;
  integrator_status: string;
  xml_content?: string;
  pdf_data_url?: string;
  paid_at?: string;
  created_at: string;
}

export interface PayoutBatchRecord {
  id?: string | number;
  batch_id: string;
  bank_name: string;
  total_gross: number;
  total_withholding: number;
  total_net: number;
  currency: string;
  item_count: number;
  status: 'PENDING_APPROVAL' | 'DOWNLOADED_TO_BANK' | 'SETTLED_COMPLETED' | 'REJECTED';
  file_export_format: string;
  executed_by?: string;
  created_at: string;
  executed_at?: string;
}

export interface PayoutBatchItemRecord {
  id?: string | number;
  batch_id: string;
  voucher_id: string;
  commission_id: string;
  dealer_user_id: string;
  dealer_name: string;
  iban: string;
  gross_amount: number;
  withholding_amount: number;
  net_amount: number;
  status: 'QUEUED' | 'PAID' | 'FAILED';
  wallet_tx_id?: string;
  created_at: string;
}

export interface PendingPayoutItem {
  commission_id: string;
  voucher_number: string;
  ettn_uuid: string;
  order_id: string;
  dealer_user_id: string;
  dealer_name: string;
  dealer_tckn: string;
  dealer_iban: string;
  bank_name: string;
  is_company: boolean;
  gross_amount: number;
  withholding_amount: number;
  net_amount: number;
  currency: string;
  release_at: string;
  status: 'QUEUED' | 'READY_FOR_PAYOUT' | 'PAID_SETTLED';
}


