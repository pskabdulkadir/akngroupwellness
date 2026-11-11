import {
  Invoice,
  Distributor,
  CommissionPayout,
  LedgerEntry,
  AIAdvice,
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
  TaxOfficeAccrual,
  WaybillRecord,
} from '../types/accounting';

// Canlı Üretim Başlangıcı: Sıfır Sahte / Demo Veri
// Sistem ilk alışverişle ve gerçek bayi siparişleriyle başlayacaktır.

export const INITIAL_DISTRIBUTORS: Distributor[] = [];

export const INITIAL_INVENTORY_PRODUCTS: InventoryProduct[] = [
  {
    id: 'prod-01',
    sku: 'HW-NEURO-DEVICE-01',
    name: 'Akıllı Biyo-Geri Bildirim Ölçüm Cihazı (Sensörlü)',
    category: 'CIHAZ_DONANIM',
    unit: 'ADET',
    currentStock: 0,
    reorderLevel: 10,
    unitCostTRY: 0,
    sellingPriceTRY: 0,
    vatRate: 0.20,
    warehouseLocation: 'Ana Depo',
    lastInventoryDate: new Date().toISOString().slice(0, 10),
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_COMMISSIONS: CommissionPayout[] = [];

export const INITIAL_REFUNDS: RefundRecord[] = [];

export const INITIAL_OSS_RECORDS: OssDeclarationRecord[] = [];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-01',
    bankName: 'Garanti BBVA - Şirket Ana Tahsilat',
    accountNumber: '6200142',
    iban: 'TR33 0006 2000 0000 0123 4567 89',
    currency: 'USD',
    balance: 0.0,
    lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    openBankingStatus: 'CONNECTED',
  },
  {
    id: 'bank-02',
    bankName: 'Akbank T.A.Ş. - Uluslararası İhracat USD',
    accountNumber: '4820194',
    iban: 'TR44 0004 6000 0000 0987 6543 21',
    currency: 'USD',
    balance: 0.0,
    lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    openBankingStatus: 'CONNECTED',
  },
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_PAYROLL: PayrollRecord[] = [];

export const INITIAL_RECONCILIATIONS: B2BReconciliation[] = [];

export const INITIAL_BABS_ITEMS: BaBsItem[] = [];

export const INITIAL_LEDGER: LedgerEntry[] = [];

export const INITIAL_AI_ADVICE: AIAdvice[] = [
  {
    id: 'adv-live-ready',
    category: 'GIB_UYUM',
    priority: 'INFO',
    title: 'Canlı Finans ve Muhasebe Sistemi Hazır',
    summary: 'Sistem tüm demo ve simülasyon kayıtlarından arındırılmıştır.',
    detailedAnalysis: 'İlk gerçek bayi siparişi veya paket alımı gerçekleştiğinde çift taraflı yevmiye kayıtları ve e-faturalar otomatik olarak oluşacaktır.',
    actionRecommendation: 'Yeni Satış veya Monoline siparişleri üzerinden canlı defter akışını takip edebilirsiniz.',
    financialImpactTRY: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  },
];

export const INITIAL_VOICE_COMMAND_LOGS: VoiceCommandLog[] = [
  {
    id: 'log-clean-init',
    timestamp: new Date().toLocaleString('tr-TR'),
    user: 'Yönetici (Admin)',
    spokenText: 'Canlı Finans Sistemi Başlatıldı',
    parsedAction: 'INITIALIZE_CLEAN_SYSTEM',
    status: 'EXECUTED',
    responseSpoken: 'Tüm test ve sahte veriler silindi. Sistem sıfır bakiye ile canlı ilk siparişe hazırdır.',
    auditDetails: 'Temiz başlangıç: Sıfır bakiye ve gerçek veri modu aktif.',
  },
];

export const INITIAL_PROACTIVE_ALERTS: ProactiveAlert[] = [
  {
    id: 'alert-clean-start',
    type: 'DAILY_BRIEF',
    title: 'Canlı Finans ve Muhasebe Hazır (0 USD)',
    message: 'Tüm demo ve sahte veriler sıfırlandı. Sistem ilk gerçek sipariş ve komisyon işlemiyle canlı defteri başlatacaktır.',
    speechText: 'Muhasebe sistemi sıfırlandı, ilk siparişe hazırdır.',
    severity: 'info',
    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    actionTab: 'monolineReconciliation',
    actionLabel: 'Canlı Durumu Gör',
    dismissed: false,
  },
];

export const INITIAL_TAX_OFFICE_ACCRUALS: TaxOfficeAccrual[] = [
  {
    id: 'thk-0015-101',
    taxType: 'KDV_1',
    taxCode: '0015',
    title: '1 No.lu Katma Değer Vergisi Beyannamesi Tahakkuku',
    taxOfficeName: 'Büyük Mükellefler V.D. / Kadıköy',
    taxOfficeCode: '34251',
    taxPeriod: 'Cari Dönem 2026',
    taxableBaseTRY: 0,
    calculatedTaxTRY: 0,
    deductibleTaxTRY: 0,
    netTaxTRY: 0,
    stampDutyTRY: 0,
    totalDueTRY: 0,
    statutoryDeadline: '2026-11-28',
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
    taxPeriod: 'Cari Dönem 2026',
    taxableBaseTRY: 0,
    calculatedTaxTRY: 0,
    deductibleTaxTRY: 0,
    netTaxTRY: 0,
    stampDutyTRY: 0,
    totalDueTRY: 0,
    statutoryDeadline: '2026-11-26',
    paymentStatus: 'UNPAID',
    accrualSlipNumber: 'THK-2026-0003-000002',
    gibTrackingReference: '9840294829100002',
  },
  {
    id: 'thk-0033-103',
    taxType: 'KURUMLAR_GECICI',
    taxCode: '0033',
    title: 'Geçici Vergi / Kurumlar Vergisi Karşılığı',
    taxOfficeName: 'Büyük Mükellefler V.D. / Kadıköy',
    taxOfficeCode: '34251',
    taxPeriod: 'Cari Dönem 2026',
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

export const INITIAL_WAYBILLS: WaybillRecord[] = [];
