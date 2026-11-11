import {
  Currency,
  CustomerInfo,
  Invoice,
  InvoiceItem,
  InvoiceScenario,
  InvoiceType,
  Distributor,
  CommissionPayout,
  LedgerEntry,
  RefundRecord,
  InventoryProduct,
  StockMovement,
  EuOssCountry,
  OssDeclarationRecord,
  ExpenseRecord,
  PayrollRecord,
} from '../types/accounting';

// Güncel TCMB Gösterge Kurları (Merkez Bankası Döviz Alış)
export const TCMB_RATES = {
  USD: 38.455,
  EUR: 41.82,
  GBP: 48.95,
  TRY: 1.0,
};

// AB One Stop Shop (OSS) KDV Oranları Listesi
export const EU_OSS_COUNTRIES: EuOssCountry[] = [
  { countryCode: 'DE', countryName: 'Almanya', standardVatRate: 0.19, currency: 'EUR' },
  { countryCode: 'FR', countryName: 'Fransa', standardVatRate: 0.20, currency: 'EUR' },
  { countryCode: 'IT', countryName: 'İtalya', standardVatRate: 0.22, currency: 'EUR' },
  { countryCode: 'ES', countryName: 'İspanya', standardVatRate: 0.21, currency: 'EUR' },
  { countryCode: 'NL', countryName: 'Hollanda', standardVatRate: 0.21, currency: 'EUR' },
  { countryCode: 'BE', countryName: 'Belçika', standardVatRate: 0.21, currency: 'EUR' },
  { countryCode: 'AT', countryName: 'Avusturya', standardVatRate: 0.20, currency: 'EUR' },
];

export interface OrderInput {
  customerName: string;
  taxNumber: string;
  isCorporate: boolean;
  isGibRegistered: boolean;
  taxOffice?: string;
  address: string;
  city: string;
  country: string; // 'TR' or 'DE', 'FR', 'US', etc.
  email: string;
  packageName: string;
  currency: Currency;
  price: number;
  distributorId?: string;
  integrator?: 'Logo' | 'Uyumsoft' | 'Parasut' | 'NetGSM';
  isPhysicalGood?: boolean;
  inventoryProductId?: string;
  euVatNumber?: string;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let invoiceSequence = 145;
let documentSequence = 90;
let entrySequence = 220;
let waybillSequence = 18;
let refundSequence = 12;

export function createInvoiceFromOrder(
  order: OrderInput,
  distributor?: Distributor,
  inventoryProduct?: InventoryProduct,
  liveRates?: { USD: number; EUR: number; GBP?: number; TRY?: number }
): {
  invoice: Invoice;
  commission?: CommissionPayout;
  ledgerEntries: LedgerEntry[];
  stockMovement?: StockMovement;
  ossRecord?: OssDeclarationRecord;
} {
  const isGlobal = order.country !== 'TR' || order.currency === 'USD' || order.currency === 'EUR';
  const isEU = EU_OSS_COUNTRIES.some((c) => c.countryCode === order.country);
  const activeRates = liveRates || TCMB_RATES;
  
  let exchangeRate = 1.0;
  if (order.currency === 'USD') exchangeRate = activeRates.USD;
  else if (order.currency === 'EUR') exchangeRate = activeRates.EUR;
  else if (isGlobal && order.currency === 'TRY') exchangeRate = 1.0;

  invoiceSequence += 1;
  const invSeqPadded = invoiceSequence.toString().padStart(8, '0');
  const invoiceNumber = `VRS2026${invSeqPadded}`;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  let vatRate = 0.20;
  let vatExemptionCode: string | undefined;
  let vatExemptionReason: string | undefined;
  let invoiceScenario: InvoiceScenario;
  let invoiceType: InvoiceType;
  let ossRecord: OssDeclarationRecord | undefined;

  // AB OSS ve Uluslararası KDV Ayrımı
  if (isEU) {
    const euCountry = EU_OSS_COUNTRIES.find((c) => c.countryCode === order.country);
    if (order.isCorporate && order.euVatNumber) {
      // AB B2B: Reverse Charge (KDV %0, VIES onaylı)
      vatRate = 0.0;
      vatExemptionCode = '351';
      vatExemptionReason = 'EU VAT Reverse Charge Mechanism (Art. 196 EU VAT Directive)';
      invoiceScenario = 'IHRACAT';
      invoiceType = 'HIZMET_IHRACI';
    } else {
      // AB B2C: One Stop Shop (OSS) yerel KDV tespiti
      vatRate = euCountry ? euCountry.standardVatRate : 0.20;
      invoiceScenario = 'EARSIVBELGE';
      invoiceType = 'SATIS';
      vatExemptionReason = `EU OSS Destination Country VAT (${Math.round(vatRate * 100)}%)`;

      const euroPrice = order.currency === 'EUR' ? order.price : order.price / (activeRates.EUR / (order.currency === 'USD' ? activeRates.USD : 1));
      const ossVatEUR = Number((euroPrice * vatRate).toFixed(2));
      ossRecord = {
        id: generateUUID(),
        quarter: '2026-Q4',
        countryCode: order.country,
        countryName: euCountry?.countryName || order.country,
        salesType: order.isPhysicalGood ? 'B2C_GOODS_IOSS' : 'B2C_DIGITAL_SERVICE',
        taxableBaseEUR: Number(euroPrice.toFixed(2)),
        vatRate: vatRate,
        vatAmountEUR: ossVatEUR,
        vatAmountTRY: Number((ossVatEUR * activeRates.EUR).toFixed(2)),
        isB2BReverseCharge: false,
        viesStatus: 'NOT_APPLICABLE',
      };
    }
  } else if (isGlobal) {
    // ABD / İngiltere / Diğer: 3065 KDVK md. 11/1-a Hizmet İhracatı
    vatRate = 0.0;
    vatExemptionCode = '301';
    vatExemptionReason = '3065 Sayılı KDV Kanunu Madde 11/1-a ve 12 - Yurt Dışı Hizmet İhracatı (KDV İstisnası)';
    invoiceScenario = 'IHRACAT';
    invoiceType = 'HIZMET_IHRACI';
  } else {
    // Türkiye İçi
    invoiceType = 'SATIS';
    if (order.isCorporate && order.isGibRegistered) {
      invoiceScenario = 'TICARIFATURA';
    } else {
      invoiceScenario = 'EARSIVBELGE';
    }
    vatRate = inventoryProduct ? inventoryProduct.vatRate : 0.20;
  }

  // Tutar hesaplama
  let subtotal = 0;
  let vatAmount = 0;
  let grandTotal = 0;

  if (vatRate === 0) {
    subtotal = order.price;
    vatAmount = 0;
    grandTotal = order.price;
  } else {
    if (order.country === 'TR') {
      // Yurt içi brüt fiyattan KDV ayrıştırma
      subtotal = Number((order.price / (1 + vatRate)).toFixed(2));
      vatAmount = Number((order.price - subtotal).toFixed(2));
      grandTotal = order.price;
    } else {
      // Yurt dışı AB OSS: Net fiyat üzerine yerel KDV
      subtotal = order.price;
      vatAmount = Number((order.price * vatRate).toFixed(2));
      grandTotal = Number((subtotal + vatAmount).toFixed(2));
    }
  }

  const grandTotalTRY = Number((grandTotal * exchangeRate).toFixed(2));
  const subtotalTRY = Number((subtotal * exchangeRate).toFixed(2));
  const vatAmountTRY = Number((vatAmount * exchangeRate).toFixed(2));

  const items: InvoiceItem[] = [
    {
      id: generateUUID(),
      description: order.packageName,
      quantity: 1,
      unitPrice: subtotal,
      currency: order.currency,
      vatRate: vatRate,
      vatAmount: vatAmount,
      subtotal: subtotal,
      total: grandTotal,
      vatExemptionCode,
      vatExemptionReason,
      isPhysicalGood: order.isPhysicalGood,
      sku: inventoryProduct?.sku,
    },
  ];

  const customer: CustomerInfo = {
    name: order.customerName,
    taxNumber: order.taxNumber,
    isCorporate: order.isCorporate,
    isGibRegistered: order.isGibRegistered,
    taxOffice: order.taxOffice || (order.isCorporate && order.country === 'TR' ? 'Kadıköy V.D.' : undefined),
    address: order.address,
    city: order.city,
    country: order.country,
    email: order.email,
    euVatNumber: order.euVatNumber,
  };

  const invoice: Invoice = {
    id: generateUUID(),
    invoiceNumber,
    ettn: generateUUID(),
    issueDate: dateStr,
    issueTime: timeStr,
    customer,
    scenario: invoiceScenario,
    type: invoiceType,
    currency: order.currency,
    exchangeRateTCMB: exchangeRate,
    items,
    subtotal,
    vatTotal: vatAmount,
    grandTotal,
    grandTotalTRY,
    gibStatus: {
      code: '1200',
      description: 'GİB ve Özel Entegratör Tarafından Başarıyla İmzalandı ve İletildi',
      sentAt: `${dateStr} ${timeStr}`,
      signedAt: `${dateStr} ${timeStr}`,
      gibEnvelopeId: `GIB-ENV-${generateUUID().substring(0, 12).toUpperCase()}`,
      responseMessage: '1200: Fatura başarıyla işlendi ve alıcı posta kutusuna iletildi.',
    },
    integrator: order.integrator || 'Uyumsoft',
    notes: [
      isGlobal
        ? vatRate === 0
          ? '3065 sayılı KDVK md. 11/1-a gereği Hizmet İhracı kapsamında KDV İstisnası uygulanmıştır.'
          : `AB One Stop Shop (OSS) kapsamında ${order.country} yerel KDV oranı uygulanmıştır.`
        : 'İşbu fatura 213 Sayılı VUK hükümlerine göre elektronik ortamda tanzim edilmiştir.',
      `TCMB Gösterge Alış Kuru (1 ${order.currency}): ${exchangeRate.toFixed(4)} TRY`,
      'Ödeme 3D Secure Güvenli Sanal POS ile tahsil edilmiştir.',
    ],
    paymentMethod: '3D_SECURE_CREDIT_CARD',
    affiliatedDistributorId: distributor?.id,
  };

  // Komisyon Hesaplama (Monoline / MLM)
  let commission: CommissionPayout | undefined;
  if (distributor) {
    documentSequence += 1;
    const docPadded = documentSequence.toString().padStart(6, '0');
    const tierRates: Record<number, number> = { 1: 0.15, 2: 0.07, 3: 0.03, 4: 0.02 };
    const rate = tierRates[distributor.level] || 0.15;
    const grossCommissionTRY = Number((subtotalTRY * rate).toFixed(2));

    if (distributor.isCompany) {
      commission = {
        id: generateUUID(),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        distributorId: distributor.id,
        distributorName: distributor.name,
        isCompany: true,
        tierLevel: distributor.level,
        commissionRate: rate,
        baseAmountTRY: subtotalTRY,
        grossCommissionTRY: grossCommissionTRY,
        withholdingRate: 0,
        withholdingAmountTRY: 0,
        netPayableTRY: grossCommissionTRY,
        payoutDate: dateStr,
        documentType: 'KOMISYON_FATURASI',
        documentNumber: `KMF2026${docPadded}`,
        isPaid: false,
        ledgerPosted: true,
      };
    } else {
      const withholdingRate = 0.20;
      const withholdingAmount = Number((grossCommissionTRY * withholdingRate).toFixed(2));
      const netPayable = Number((grossCommissionTRY - withholdingAmount).toFixed(2));

      commission = {
        id: generateUUID(),
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        distributorId: distributor.id,
        distributorName: distributor.name,
        isCompany: false,
        tierLevel: distributor.level,
        commissionRate: rate,
        baseAmountTRY: subtotalTRY,
        grossCommissionTRY: grossCommissionTRY,
        withholdingRate: withholdingRate,
        withholdingAmountTRY: withholdingAmount,
        stampTaxRate: 0.00948,
        stampTaxAmountTRY: Number((grossCommissionTRY * 0.00948).toFixed(2)),
        netPayableTRY: netPayable,
        payoutDate: dateStr,
        documentType: 'GIDER_PUSULASI',
        documentNumber: `GDP2026${docPadded}`,
        isPaid: true,
        ledgerPosted: true,
      };
    }
  }

  // Yevmiye Defteri (General Ledger) Çift Taraflı Muhasebe Kayıtları
  entrySequence += 1;
  const currentMaddeNo = entrySequence;
  const ledgerEntries: LedgerEntry[] = [];

  // 1. Kasa / Banka Tahsilat Kaydı (Borç 102.01)
  ledgerEntries.push({
    id: generateUUID(),
    date: dateStr,
    entryNumber: currentMaddeNo,
    accountCode: '102.01',
    accountName: 'Bankalar - Sanal POS Tahsilat Hesabı',
    debitTRY: grandTotalTRY,
    creditTRY: 0,
    description: `Sipariş Tahsilatı (${invoice.invoiceNumber}) - ${order.customerName}`,
    documentNumber: invoice.invoiceNumber,
    currency: order.currency,
    originalAmount: grandTotal,
  });

  // 2. Gelir Kaydı: Yurtiçi Satışlar (600) veya Yurtdışı Satışlar (601)
  if (isGlobal && vatRate === 0) {
    ledgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: currentMaddeNo,
      accountCode: '601.01',
      accountName: 'Yurtdışı Satışlar - Hizmet İhracı (KDV %0)',
      debitTRY: 0,
      creditTRY: subtotalTRY,
      description: `Hizmet İhracatı Satışı (TCMB: ${exchangeRate.toFixed(4)})`,
      documentNumber: invoice.invoiceNumber,
      currency: order.currency,
      originalAmount: subtotal,
    });
  } else {
    ledgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: currentMaddeNo,
      accountCode: order.country === 'TR' ? '600.01' : '601.02',
      accountName: order.country === 'TR' ? 'Yurtiçi Satışlar - Paket ve Ürün Bedeli' : 'Yurtdışı Satışlar - AB OSS Kapsamında',
      debitTRY: 0,
      creditTRY: subtotalTRY,
      description: `Satış Matrahı (${invoice.invoiceNumber})`,
      documentNumber: invoice.invoiceNumber,
      currency: order.currency,
      originalAmount: subtotal,
    });

    // 3. Hesaplanan KDV Kaydı (Alacak - 391)
    if (vatAmountTRY > 0) {
      ledgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: currentMaddeNo,
        accountCode: isEU ? '391.25' : '391.20',
        accountName: isEU ? `Hesaplanan KDV - AB OSS (${order.country})` : 'Hesaplanan KDV (%20)',
        debitTRY: 0,
        creditTRY: vatAmountTRY,
        description: `Satış KDV Tahakkuku`,
        documentNumber: invoice.invoiceNumber,
        currency: order.currency,
        originalAmount: vatAmount,
      });
    }
  }

  // 4. Fiziksel Ürün İse: 153 Ticari Mallar ve 621 SMM Kaydı + e-İrsaliye
  let stockMovement: StockMovement | undefined;
  if (order.isPhysicalGood && inventoryProduct) {
    waybillSequence += 1;
    const waybillNo = `IRS2026${waybillSequence.toString().padStart(8, '0')}`;
    const totalCostTRY = Number((inventoryProduct.unitCostTRY * 1).toFixed(2));

    stockMovement = {
      id: generateUUID(),
      date: dateStr,
      productId: inventoryProduct.id,
      productName: inventoryProduct.name,
      movementType: 'CIKIS_SATIS',
      quantity: 1,
      unitPriceTRY: inventoryProduct.unitCostTRY,
      totalCostTRY: totalCostTRY,
      eWaybillNumber: waybillNo,
      referenceDocument: invoice.invoiceNumber,
      accountingAccount: '621.01',
    };

    entrySequence += 1;
    const smmMaddeNo = entrySequence;

    // 621 Satılan Ticari Mallar Maliyeti (Borç)
    ledgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: smmMaddeNo,
      accountCode: '621.01',
      accountName: 'Satılan Ticari Mallar Maliyeti (SMM)',
      debitTRY: totalCostTRY,
      creditTRY: 0,
      description: `SMM Çıkışı (${inventoryProduct.name} - ${waybillNo})`,
      documentNumber: waybillNo,
      currency: 'TRY',
      originalAmount: totalCostTRY,
    });

    // 153 Ticari Mallar Stok Hesabı (Alacak)
    ledgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: smmMaddeNo,
      accountCode: '153.01',
      accountName: 'Ticari Mallar - Depo Stok Çıkışı',
      debitTRY: 0,
      creditTRY: totalCostTRY,
      description: `Depo Stok Azalışı (${waybillNo})`,
      documentNumber: waybillNo,
      currency: 'TRY',
      originalAmount: totalCostTRY,
    });
  }

  // 5. Bayi Komisyon Kayıtları
  if (commission) {
    entrySequence += 1;
    const commMaddeNo = entrySequence;

    ledgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: commMaddeNo,
      accountCode: '760.01',
      accountName: 'Pazarlama Satış Dağıtım - MLM Bayi Komisyon Gideri',
      debitTRY: commission.grossCommissionTRY,
      creditTRY: 0,
      description: `Bayi Komisyon Hakedişi - ${commission.distributorName} (${commission.documentNumber})`,
      documentNumber: commission.documentNumber,
      currency: 'TRY',
      originalAmount: commission.grossCommissionTRY,
    });

    if (!commission.isCompany) {
      ledgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: commMaddeNo,
        accountCode: '360.01',
        accountName: 'Ödenecek Gelir Vergisi Stopajı (%20 GVK 94/10-b)',
        debitTRY: 0,
        creditTRY: commission.withholdingAmountTRY,
        description: `Gider Pusulası Stopaj Kesintisi (${commission.distributorName})`,
        documentNumber: commission.documentNumber,
        currency: 'TRY',
      });

      ledgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: commMaddeNo,
        accountCode: '102.02',
        accountName: 'Bankalar - Bayi Komisyon Ödeme Hesabı',
        debitTRY: 0,
        creditTRY: commission.netPayableTRY,
        description: `Bayi Net Komisyon Havalesi (Gider Pusulası: ${commission.documentNumber})`,
        documentNumber: commission.documentNumber,
        currency: 'TRY',
      });
    } else {
      ledgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: commMaddeNo,
        accountCode: '320.01',
        accountName: 'Satıcılar - Şirket Bayi Komisyon Carisi',
        debitTRY: 0,
        creditTRY: commission.grossCommissionTRY,
        description: `Bayi Fatura Tahakkuku Bekleniyor (${commission.distributorName})`,
        documentNumber: commission.documentNumber,
        currency: 'TRY',
      });
    }
  }

  return { invoice, commission, ledgerEntries, stockMovement, ossRecord };
}

/**
 * 1. CLAWBACK & İADE / CHARGEBACK MOTORU
 * Bir sipariş iptal / iade olduğunda:
 * - e-Arşiv İade Faturası düzenlenir
 * - Dağıtılan komisyonlar üst kollardan geri çekilir (Clawback)
 * - Stopaj düzeltme beyannamesi oluşturulur
 * - Yevmiye defterine ters kayıtlar (610, 191, 102, 760, 360) işlenir
 */
export function processRefundAndClawback(
  invoice: Invoice,
  reason: 'MUSTERI_IADE_TALEBI' | 'CHARGEBACK_ITIRAZ' | 'HIZMET_IPTALI',
  relatedCommissions: CommissionPayout[],
  distributors: Distributor[]
): {
  refundRecord: RefundRecord;
  updatedCommissions: CommissionPayout[];
  updatedDistributors: Distributor[];
  reverseLedgerEntries: LedgerEntry[];
} {
  refundSequence += 1;
  const refundInvoiceNumber = `IAD2026${refundSequence.toString().padStart(8, '0')}`;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const clawbacksApplied: RefundRecord['clawbacksApplied'] = [];
  const updatedCommissions = [...relatedCommissions];
  const updatedDistributors = [...distributors];

  // 1. İlgili komisyonları geri çek (Clawback)
  updatedCommissions.forEach((comm) => {
    if (comm.invoiceId === invoice.id && !comm.isClawbacked) {
      comm.isClawbacked = true;
      comm.clawbackDate = dateStr;
      comm.clawbackReason = `Sipariş İadesi / Chargeback (${invoice.invoiceNumber})`;

      clawbacksApplied.push({
        distributorId: comm.distributorId,
        distributorName: comm.distributorName,
        grossClawbackTRY: comm.grossCommissionTRY,
        stopajReversedTRY: comm.withholdingAmountTRY,
        netClawbackTRY: comm.netPayableTRY,
      });

      // Bayi cüzdan bakiyesini düş veya borçlandır
      const distIndex = updatedDistributors.findIndex((d) => d.id === comm.distributorId);
      if (distIndex >= 0) {
        updatedDistributors[distIndex] = {
          ...updatedDistributors[distIndex],
          currentWalletBalanceTRY: Number((updatedDistributors[distIndex].currentWalletBalanceTRY - comm.netPayableTRY).toFixed(2)),
          totalEarningsTRY: Number((updatedDistributors[distIndex].totalEarningsTRY - comm.grossCommissionTRY).toFixed(2)),
          totalStopajPaidTRY: Number((updatedDistributors[distIndex].totalStopajPaidTRY - comm.withholdingAmountTRY).toFixed(2)),
        };
      }
    }
  });

  // 2. Yevmiye Defteri Ters Kayıtları
  entrySequence += 1;
  const reverseMaddeNo = entrySequence;
  const reverseLedgerEntries: LedgerEntry[] = [];

  // 610.01 Satıştan İadeler (Borç)
  const isGlobal = invoice.scenario === 'IHRACAT';
  const refundMatrahTRY = invoice.subtotal * invoice.exchangeRateTCMB;
  const refundVatTRY = invoice.vatTotal * invoice.exchangeRateTCMB;

  reverseLedgerEntries.push({
    id: generateUUID(),
    date: dateStr,
    entryNumber: reverseMaddeNo,
    accountCode: '610.01',
    accountName: 'Satıştan İadeler - İade Edilen Sipariş Matrahı',
    debitTRY: refundMatrahTRY,
    creditTRY: 0,
    description: `Sipariş İadesi (${invoice.invoiceNumber}) - ${reason}`,
    documentNumber: refundInvoiceNumber,
    currency: invoice.currency,
    originalAmount: invoice.subtotal,
  });

  // Eğer KDV'li satış ise 191.01 İndirilecek KDV (İade KDV'si borç yazılır)
  if (refundVatTRY > 0) {
    reverseLedgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: reverseMaddeNo,
      accountCode: '191.01',
      accountName: 'İndirilecek KDV - İade Alınan Fatura KDV Düzeltmesi',
      debitTRY: refundVatTRY,
      creditTRY: 0,
      description: `İade KDV Tahakkuku (${refundInvoiceNumber})`,
      documentNumber: refundInvoiceNumber,
      currency: invoice.currency,
      originalAmount: invoice.vatTotal,
    });
  }

  // 102.01 Banka Sanal POS İade Çıkışı (Alacak)
  reverseLedgerEntries.push({
    id: generateUUID(),
    date: dateStr,
    entryNumber: reverseMaddeNo,
    accountCode: '102.01',
    accountName: 'Bankalar - Sanal POS Müşteri İade Çıkışı',
    debitTRY: 0,
    creditTRY: invoice.grandTotalTRY,
    description: `Müşteri Kredi Kartı İade Havalesi (${invoice.customer.name})`,
    documentNumber: refundInvoiceNumber,
    currency: invoice.currency,
    originalAmount: invoice.grandTotal,
  });

  // 3. Komisyon Geri Alma (Clawback) Ters Yevmiye Kayıtları
  clawbacksApplied.forEach((cb) => {
    entrySequence += 1;
    const clawbackMaddeNo = entrySequence;

    // 760.01 Pazarlama Komisyon Gideri İptali (Alacak)
    reverseLedgerEntries.push({
      id: generateUUID(),
      date: dateStr,
      entryNumber: clawbackMaddeNo,
      accountCode: '760.01',
      accountName: 'Pazarlama Satış Dağıtım - MLM Komisyon İptali (Clawback)',
      debitTRY: 0,
      creditTRY: cb.grossClawbackTRY,
      description: `Clawback Komisyon İptali - ${cb.distributorName}`,
      documentNumber: refundInvoiceNumber,
      currency: 'TRY',
      originalAmount: cb.grossClawbackTRY,
    });

    if (cb.stopajReversedTRY > 0) {
      // 360.01 Stopaj Düzeltmesi (Borç) - Vergi Dairesinden Tenzil
      reverseLedgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: clawbackMaddeNo,
        accountCode: '360.01',
        accountName: 'Ödenecek Stopaj Düzeltmesi (Muhtasar Tenzil Kaydı)',
        debitTRY: cb.stopajReversedTRY,
        creditTRY: 0,
        description: `İade Stopaj Düzeltmesi (${cb.distributorName})`,
        documentNumber: refundInvoiceNumber,
        currency: 'TRY',
      });

      // 102.02 / 329 Bayi Borçlandırma (Borç)
      reverseLedgerEntries.push({
        id: generateUUID(),
        date: dateStr,
        entryNumber: clawbackMaddeNo,
        accountCode: '329.01',
        accountName: 'Diğer Ticari Borçlar / Bayi Cüzdan Borçlandırması',
        debitTRY: cb.netClawbackTRY,
        creditTRY: 0,
        description: `Bayi Cüzdanından Komisyon Geri Çekimi`,
        documentNumber: refundInvoiceNumber,
        currency: 'TRY',
      });
    }
  });

  const refundRecord: RefundRecord = {
    id: generateUUID(),
    originalInvoiceId: invoice.id,
    originalInvoiceNumber: invoice.invoiceNumber,
    refundInvoiceNumber,
    ettn: generateUUID(),
    date: dateStr,
    reason,
    refundAmount: invoice.grandTotal,
    refundAmountTRY: invoice.grandTotalTRY,
    currency: invoice.currency,
    customerName: invoice.customer.name,
    clawbacksApplied,
    vatReversalTRY: refundVatTRY,
    muhtasarCorrectionFiled: true,
  };

  return {
    refundRecord,
    updatedCommissions,
    updatedDistributors,
    reverseLedgerEntries,
  };
}

/**
 * 2. ENVANTER DEĞERLEMESİ & VUK 298/A ENFLASYON MUHASEBESİ HESAPLAYICI
 */
export function calculateInflationAdjustment(
  products: InventoryProduct[],
  adjustmentCoefficient: number = 1.442 // Yİ-ÜFE Enflasyon Düzeltme Katsayısı
): {
  adjustedProducts: InventoryProduct[];
  totalAdjustmentDifferenceTRY: number;
  ledgerEntry: LedgerEntry;
} {
  let totalDiff = 0;
  const now = new Date().toISOString().split('T')[0];

  const adjustedProducts = products.map((p) => {
    const historicalCost = p.unitCostTRY;
    const adjustedCost = Number((historicalCost * adjustmentCoefficient).toFixed(2));
    const stockTotalDiff = (adjustedCost - historicalCost) * p.currentStock;
    totalDiff += stockTotalDiff;

    return {
      ...p,
      inflationAdjustedCostTRY: adjustedCost,
    };
  });

  entrySequence += 1;
  const entryMaddeNo = entrySequence;

  // 153 Ticari Mallar Enflasyon Düzeltmesi (Borç) / 698 Enflasyon Düzeltme Hesabı (Alacak)
  const ledgerEntry: LedgerEntry = {
    id: generateUUID(),
    date: now,
    entryNumber: entryMaddeNo,
    accountCode: '698.01',
    accountName: 'Enflasyon Düzeltme Hesabı (VUK 298/A Stok Değer Artışı)',
    debitTRY: 0,
    creditTRY: Number(totalDiff.toFixed(2)),
    description: `Stok Enflasyon Düzeltmesi Farkı (Katsayı: ${adjustmentCoefficient.toFixed(3)})`,
    documentNumber: `ENF2026-Q4`,
    currency: 'TRY',
    originalAmount: totalDiff,
  };

  return {
    adjustedProducts,
    totalAdjustmentDifferenceTRY: Number(totalDiff.toFixed(2)),
    ledgerEntry,
  };
}
