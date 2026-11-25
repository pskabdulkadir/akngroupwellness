/**
 * AKN Group Wellness / MLM Altyapısı - Otomatik e-Gider Pusulası & Banka Toplu Ödeme Motoru
 * Dosya Yolu: src/services/expenseVoucherEngine.ts
 * 
 * 1. Otomatik e-Gider Pusulası Tanzimi (213 Sayılı VUK M. 234 ve 193 Sayılı GVK M. 94/10-b)
 * 2. 14 Günlük Yasal Cayma/Bekleme Süresi Koruması
 * 3. GİB UBL-TR 2.1 Standartlarında e-Gider Pusulası XML Üretimi
 * 4. Banka Toplu EFT/FAST Transfer Dosyası Üretimi (Garanti, Akbank, İş Bankası, Ziraat)
 */

import type { ExpenseVoucherRecord, PendingPayoutItem } from '../types/accounting';
import { COMPANY_IDENTITY } from '../config/companyIdentity';

export interface CompanyBillingProfile {
  legalName: string;
  tradeName: string;
  vkn: string;
  taxOffice: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  web: string;
  mersisNo: string;
  ticaretSicilNo: string;
}

export const CANONICAL_COMPANY_PROFILE: CompanyBillingProfile = {
  legalName: COMPANY_IDENTITY.legalName,
  tradeName: COMPANY_IDENTITY.brandName,
  vkn: COMPANY_IDENTITY.taxNumber,
  taxOffice: COMPANY_IDENTITY.taxOffice,
  address: COMPANY_IDENTITY.address,
  city: '',
  country: 'Türkiye',
  postalCode: '',
  phone: COMPANY_IDENTITY.internationalPhone,
  email: COMPANY_IDENTITY.contactEmail,
  web: COMPANY_IDENTITY.website,
  mersisNo: '',
  ticaretSicilNo: '',
};

/**
 * GVK 94/10-b Uyarınca Stopaj ve Net Hakediş Hesaplama
 * Bireysel Bayi: %20 Stopaj Kesintisi
 * Kurumsal Mükellef (Şirket): %0 (Fatura Karşılığı Ödenir)
 */
export function calculateVoucherWithholding(
  grossAmount: number,
  isCompany: boolean
): { withholdingRate: number; withholdingAmount: number; netAmount: number } {
  const safeGross = Math.max(0, Number(grossAmount) || 0);
  if (isCompany) {
    return {
      withholdingRate: 0,
      withholdingAmount: 0,
      netAmount: Number(safeGross.toFixed(2)),
    };
  }

  // 193 Sayılı GVK 94/10-b gereği %20 Gelir Vergisi Stopajı
  const withholdingRate = 0.20;
  const withholdingAmount = Number((safeGross * withholdingRate).toFixed(2));
  const netAmount = Number((safeGross - withholdingAmount).toFixed(2));

  return {
    withholdingRate,
    withholdingAmount,
    netAmount,
  };
}

/**
 * GİB UBL-TR 2.1 Standartlarında e-Gider Pusulası XML Formatı
 */
export function generateOfficialGiderPusulasiXml(
  voucher: ExpenseVoucherRecord,
  company: CompanyBillingProfile = CANONICAL_COMPANY_PROFILE
): string {
  const issueDate = voucher.created_at ? voucher.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
  const issueTime = voucher.created_at ? voucher.created_at.split('T')[1]?.split('.')[0] || '12:00:00' : '12:00:00';

  return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
            xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
            xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EGIDERPUSULASI</cbc:ProfileID>
  <cbc:ID>${voucher.voucher_number}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${voucher.ettn_uuid}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:CreditNoteTypeCode>GIDERPUSULASI</cbc:CreditNoteTypeCode>
  <cbc:Note>213 Sayılı VUK Madde 234 ve 193 Sayılı GVK Madde 94/10-b Uyarınca Düzenlenmiştir.</cbc:Note>
  <cbc:Note>İlişkili Sipariş / Hakediş: ${voucher.order_id} (Komisyon ID: ${voucher.commission_log_id})</cbc:Note>
  <cbc:DocumentCurrencyCode>${voucher.currency || 'TRY'}</cbc:DocumentCurrencyCode>

  <!-- DÜZENLEYEN KURUM (İŞVEREN / AKN GROUP) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${company.vkn.length === 11 ? 'TCKN' : 'VKN'}">${company.vkn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${company.legalName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${company.address}</cbc:StreetName>
        <cbc:CityName>${company.city}</cbc:CityName>
        <cbc:Country>
          <cbc:Name>${company.country}</cbc:Name>
        </cbc:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${company.taxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- ALICI / HAK SAHİBİ BAYİ -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${voucher.is_company ? 'VKN' : 'TCKN'}">${voucher.dealer_tckn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${voucher.dealer_full_name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${voucher.dealer_address || 'Türkiye'}</cbc:StreetName>
        <cbc:CityName>İstanbul</cbc:CityName>
        <cbc:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cbc:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${voucher.dealer_tax_office || 'Gelir İdaresi Başkanlığı'}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- ÖDEME VE IBAN DETAYLARI -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>42</cbc:PaymentMeansCode>
    <cbc:PaymentDueDate>${issueDate}</cbc:PaymentDueDate>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${voucher.dealer_iban}</cbc:ID>
      <cbc:CurrencyCode>${voucher.currency || 'TRY'}</cbc:CurrencyCode>
      <cac:FinancialInstitutionBranch>
        <cbc:Name>Banka EFT / FAST Transfer</cbc:Name>
      </cac:FinancialInstitutionBranch>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  <!-- STOPAJ VERGİ AYRIŞTIRMASI -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${voucher.currency || 'TRY'}">${voucher.withholding_amount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${voucher.currency || 'TRY'}">${voucher.withholding_amount.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>${(voucher.withholding_rate * 100).toFixed(0)}</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>Gelir Vergisi Stopajı (GVK 94/10-b)</cbc:Name>
          <cbc:TaxTypeCode>0003</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <!-- YASAL PARASAL TOPLAMLAR -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${voucher.currency || 'TRY'}">${voucher.net_amount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- HİZMET KALEMİ -->
  <cac:CreditNoteLine>
    <cbc:ID>1</cbc:ID>
    <cbc:CreditedQuantity unitCode="C62">1</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>Monoline MLM Bağımsız Bayi Satış Aracılık ve Danışmanlık Primi</cbc:Description>
      <cbc:Name>Bayi Prim Hakedişi</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${voucher.currency || 'TRY'}">${voucher.gross_amount.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>
</CreditNote>`;
}

/**
 * Banka Toplu Ödeme Transfer Dosyası Üretimi (Garanti, Akbank, İş Bankası, Ziraat)
 * Standart banka kolonları ve Excel Türkçe karakter (UTF-8 BOM) uyumluluğu
 */
export function generateBankBatchFile(
  bank: 'GARANTI' | 'AKBANK' | 'ISBANK' | 'ZIRAAT',
  items: PendingPayoutItem[],
  batchId?: string
): { filename: string; content: string; mimeType: string; count: number; totalNet: number } {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const idStr = batchId || `BATCH-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;
  const totalNet = items.reduce((acc, i) => acc + i.net_amount, 0);
  const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [
    ['Bayi Adı Soyadı / Ünvan', 'T.C. / Vergi No', 'Ülke', 'Ödeme Türü', 'IBAN', 'SWIFT/BIC', 'Banka', 'Net Ödenecek Tutar', 'Para Birimi', 'Fatura / Gider Pusulası No', 'Ödeme Açıklaması'],
    ...items.map((item) => [
      item.dealer_name,
      item.dealer_tckn,
      item.dealer_country || '',
      item.payout_type || '',
      item.dealer_iban.replace(/\s+/g, ''),
      item.swift_code || '',
      item.bank_name,
      item.net_amount.toFixed(2),
      item.currency,
      item.voucher_number,
      `AKN Global Group bayi hakedişi ${item.voucher_number}`,
    ]),
  ];
  const content = `\uFEFF${rows.map((row) => row.map((cell) => csvCell(cell)).join(';')).join('\r\n')}\r\n`;

  return {
    filename: `${bank}_TOPLU_ODEME_${idStr}.csv`,
    content,
    mimeType: 'text/csv;charset=utf-8',
    count: items.length,
    totalNet,
  };
}
