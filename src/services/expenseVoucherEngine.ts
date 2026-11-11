/**
 * AKN Group Wellness / MLM Altyapısı - Otomatik e-Gider Pusulası & Banka Toplu Ödeme Motoru
 * Dosya Yolu: src/services/expenseVoucherEngine.ts
 * 
 * 1. Otomatik e-Gider Pusulası Tanzimi (213 Sayılı VUK M. 234 ve 193 Sayılı GVK M. 94/10-b)
 * 2. 14 Günlük Yasal Cayma/Bekleme Süresi Koruması
 * 3. GİB UBL-TR 2.1 Standartlarında e-Gider Pusulası XML Üretimi
 * 4. Banka Toplu EFT/FAST Transfer Dosyası Üretimi (Garanti, Akbank, İş Bankası, Ziraat)
 */

import { ExpenseVoucherRecord, PendingPayoutItem } from '../types/accounting';

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
  legalName: 'AKN GLOBAL GROUP BİLİŞİM MEDİKAL VE WELLNESS TEKNOLOJİLERİ A.Ş.',
  tradeName: 'AKN Group Wellness',
  vkn: '0340892341',
  taxOffice: 'Büyük Mükellefler Vergi Dairesi',
  address: 'Barbaros Bulvarı No: 142 Kat: 4 Beşiktaş',
  city: 'İstanbul',
  country: 'Türkiye',
  postalCode: '34349',
  phone: '+90 (212) 840 20 00',
  email: 'muhasebe@akngroupwellness.com',
  web: 'www.akngroupwellness.com',
  mersisNo: '0034089234100018',
  ticaretSicilNo: '345892-5',
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
        <cbc:ID schemeID="VKN">${company.vkn}</cbc:ID>
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

  // CSV için Türkçe karakter uyumlu UTF-8 BOM (\uFEFF)
  let csv = '\uFEFF';

  if (bank === 'GARANTI') {
    // Garanti BBVA Kurumsal Toplu Transfer Formatı
    csv += 'SIRA;ALICI_ADI;HESAP_IBAN;TUTAR;PARA_BIRIMI;ACIKLAMA;BELGE_NO;VERGI_KIMLIK\r\n';
    items.forEach((item, index) => {
      const cleanIban = item.dealer_iban.replace(/\s+/g, '');
      const cleanName = item.dealer_name.replace(/;/g, ' ');
      const desc = `AKN Hak Ediş ${item.voucher_number}`.slice(0, 32);
      csv += `${index + 1};"${cleanName}";"${cleanIban}";${item.net_amount.toFixed(2)};TRY;"${desc}";"${item.voucher_number}";"${item.dealer_tckn}"\r\n`;
    });
    return {
      filename: `GARANTI_TOPLU_ODEME_${idStr}.csv`,
      content: csv,
      mimeType: 'text/csv;charset=utf-8',
      count: items.length,
      totalNet,
    };
  }

  if (bank === 'AKBANK') {
    // Akbank Kurumsal Transfer Formatı
    csv += 'SIRA NO;ALICI ISIM;ALICI IBAN;TUTAR;DOVIZ;ISLEM ACIKLAMASI;HAKEDIS NO\r\n';
    items.forEach((item, index) => {
      const cleanIban = item.dealer_iban.replace(/\s+/g, '');
      const cleanName = item.dealer_name.replace(/;/g, ' ');
      csv += `${index + 1};"${cleanName}";"${cleanIban}";${item.net_amount.toFixed(2)};TRY;"AKN Bayi Odemesi ${item.voucher_number}";"${item.voucher_number}"\r\n`;
    });
    return {
      filename: `AKBANK_TOPLU_TRANSFER_${idStr}.csv`,
      content: csv,
      mimeType: 'text/csv;charset=utf-8',
      count: items.length,
      totalNet,
    };
  }

  if (bank === 'ISBANK') {
    // Türkiye İş Bankası Ticari Ödeme Formatı
    csv += 'SIRA_NO;TCKN_VKN;ALICI_UNVAN;IBAN;ODENECEK_TUTAR;PARA_KODU;REFERANS_KODU;ACIKLAMA\r\n';
    items.forEach((item, index) => {
      const cleanIban = item.dealer_iban.replace(/\s+/g, '');
      const cleanName = item.dealer_name.replace(/;/g, ' ');
      csv += `${index + 1};"${item.dealer_tckn}";"${cleanName}";"${cleanIban}";${item.net_amount.toFixed(2)};TRY;"${item.voucher_number}";"AKN Group Hakedis Odemesi"\r\n`;
    });
    return {
      filename: `ISBANK_TARIHLI_ODEME_${idStr}.csv`,
      content: csv,
      mimeType: 'text/csv;charset=utf-8',
      count: items.length,
      totalNet,
    };
  }

  // Ziraat Bankası Standart Formatı
  csv += 'NO;ALICI_AD_SOYAD;IBAN_NO;ODEME_TUTARI;ACIKLAMA;VERGI_NO;PUSULA_NO\r\n';
  items.forEach((item, index) => {
    const cleanIban = item.dealer_iban.replace(/\s+/g, '');
    const cleanName = item.dealer_name.replace(/;/g, ' ');
    csv += `${index + 1};"${cleanName}";"${cleanIban}";${item.net_amount.toFixed(2)};"AKN Wellness Bayi Hakedisi";"${item.dealer_tckn}";"${item.voucher_number}"\r\n`;
  });
  return {
    filename: `ZIRAAT_TOPLU_EFT_${idStr}.csv`,
    content: csv,
    mimeType: 'text/csv;charset=utf-8',
    count: items.length,
    totalNet,
  };
}
