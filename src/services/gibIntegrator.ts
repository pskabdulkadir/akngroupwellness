import { Invoice, CommissionPayout, LedgerEntry, CompanyProfile, COMPANY_PROFILE, TaxReportSummary, BaBsItem } from '../types/accounting';

export interface IntegratorConfig {
  id: 'Logo' | 'Uyumsoft' | 'Parasut' | 'NetGSM';
  name: string;
  endpoint: string;
  senderTag: string; // Gönderici Birim Etiketi: urn:mail:defaultgb@firma.com
  receiverTag: string; // Posta Kutusu Etiketi: urn:mail:defaultpk@firma.com
  username: string;
  isSandbox: boolean;
  status: 'CONNECTED' | 'DISCONNECTED';
}

export const INTEGRATORS: IntegratorConfig[] = [
  {
    id: 'Uyumsoft',
    name: 'Uyumsoft e-Fatura / e-Arşiv API',
    endpoint: 'https://efatura-test.uyumsoft.com.tr/services/integration',
    senderTag: 'urn:mail:defaultgb@aknglobal.com',
    receiverTag: 'urn:mail:defaultpk@aknglobal.com',
    username: 'aknglobal_cfo_user',
    isSandbox: true,
    status: 'CONNECTED',
  },
  {
    id: 'Logo',
    name: 'Logo Yazılım e-Logo Entegratör API',
    endpoint: 'https://elogo.logoyazilim.com.tr/PostBoxService',
    senderTag: 'urn:mail:defaultgb@aknglobal.com',
    receiverTag: 'urn:mail:defaultpk@aknglobal.com',
    username: 'elogo_client_akn',
    isSandbox: true,
    status: 'CONNECTED',
  },
  {
    id: 'Parasut',
    name: 'Paraşüt e-Fatura v4 REST API',
    endpoint: 'https://api.parasut.com/v4/e_invoices',
    senderTag: 'urn:mail:defaultgb@aknglobal.com',
    receiverTag: 'urn:mail:defaultpk@aknglobal.com',
    username: 'parasut_akn_token',
    isSandbox: true,
    status: 'CONNECTED',
  },
  {
    id: 'NetGSM',
    name: 'Trendyol / NetGSM e-Fatura Portal',
    endpoint: 'https://api.netgsm.com.tr/efatura/v1/send',
    senderTag: 'urn:mail:defaultgb@aknglobal.com',
    receiverTag: 'urn:mail:defaultpk@aknglobal.com',
    username: 'netgsm_akn_portal',
    isSandbox: true,
    status: 'CONNECTED',
  },
];

/**
 * UBL-TR 2.1 / GİB Standart e-Fatura XML Çıktısı Üreticisi
 */
export function generateUblTrXml(invoice: Invoice, companyProfile?: CompanyProfile): string {
  const isGlobal = invoice.scenario === 'IHRACAT';
  const company = companyProfile || COMPANY_PROFILE;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${invoice.scenario}</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoice.ettn}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoice.type}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  <cbc:PricingExchangeRate>
    <cbc:SourceCurrencyCode>${invoice.currency}</cbc:SourceCurrencyCode>
    <cbc:TargetCurrencyCode>TRY</cbc:TargetCurrencyCode>
    <cbc:CalculationRate>${invoice.exchangeRateTCMB}</cbc:CalculationRate>
  </cbc:PricingExchangeRate>
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
        <cbc:CitySubdivisionName>${company.district || 'Beşiktaş'}</cbc:CitySubdivisionName>
        <cbc:CityName>${company.city || 'İstanbul'}</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${company.taxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${invoice.customer.isCorporate ? 'VKN' : 'TCKN'}">${invoice.customer.taxNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${invoice.customer.name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.customer.address}</cbc:StreetName>
        <cbc:CityName>${invoice.customer.city}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${invoice.customer.country}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency}">${invoice.vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.currency}">${invoice.vatTotal.toFixed(2)}</cbc:TaxAmount>
      <cbc:Percent>${isGlobal ? '0' : '20'}</cbc:Percent>
      <cac:TaxCategory>
        ${
          isGlobal
            ? `<cbc:TaxExemptionReasonCode>301</cbc:TaxExemptionReasonCode>
        <cbc:TaxExemptionReason>3065 Sayılı KDVK 11/1-a Hizmet İhracatı</cbc:TaxExemptionReason>`
            : ''
        }
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}

/**
 * Luca & Zirve Muhasebe Programı Uyumlu Yevmiye Defteri (General Ledger) XML formatı
 */
export function exportLedgerToXml(entries: LedgerEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<YevmiyeDefteri xmlns="http://www.edefter.gov.tr" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Baslik>
    <MukellefVKN>${COMPANY_PROFILE.vkn}</MukellefVKN>
    <Unvan>${COMPANY_PROFILE.legalName}</Unvan>
    <Donem>2026-10</Donem>
    <Standart>GİB E-Defter Kılavuzu v1.5 / Luca &amp; Zirve Uyumlu</Standart>
  </Baslik>
  <YevmiyeMaddeleri>
${entries
  .map(
    (e) => `    <YevmiyeMaddesi>
      <MaddeNo>${e.entryNumber}</MaddeNo>
      <Tarih>${e.date}</Tarih>
      <HesapKodu>${e.accountCode}</HesapKodu>
      <HesapAdi>${e.accountName}</HesapAdi>
      <Borc>${e.debitTRY.toFixed(2)}</Borc>
      <Alacak>${e.creditTRY.toFixed(2)}</Alacak>
      <BelgeNo>${e.documentNumber}</BelgeNo>
      <Aciklama>${e.description}</Aciklama>
    </YevmiyeMaddesi>`
  )
  .join('\n')}
  </YevmiyeMaddeleri>
</YevmiyeDefteri>`;
}

/**
 * Excel / CSV İndirme İçeriği (Luca / Zirve / Mikro / Logo Yevmiye Aktarımı)
 */
export function exportLedgerToCsv(entries: LedgerEntry[]): string {
  const headers = [
    'Yevmiye Madde No',
    'Tarih',
    'Hesap Kodu',
    'Hesap Adı',
    'Borç (TRY)',
    'Alacak (TRY)',
    'Belge No',
    'Açıklama',
  ];
  const rows = entries.map((e) => [
    e.entryNumber,
    e.date,
    e.accountCode,
    `"${e.accountName}"`,
    e.debitTRY.toFixed(2),
    e.creditTRY.toFixed(2),
    e.documentNumber,
    `"${e.description}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

/**
 * GİB BDP Uyumlu 1 No'lu KDV Beyannamesi XML Çıktısı
 */
export function exportKdv1DeclarationXml(summary: TaxReportSummary, companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  const domesticMatrah = summary.totalDomesticSalesTRY / 1.20;
  const exportMatrah = summary.totalExportSalesTRY;
  const calculatedVat = summary.vatCalculated391;
  const deductibleVat = 1850.0;
  const netVatPayable = Math.max(0, calculatedVat - deductibleVat);
  const carriesForwardVat = calculatedVat < deductibleVat ? deductibleVat - calculatedVat : 0;
  const damgaVergisi = 437.80;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Beyanname xmlns="http://ebeyanname.gib.gov.tr/kdv1" kod="KDV1" versiyon="44">
  <GenelBilgiler>
    <VergiDairesi>${comp.taxOffice}</VergiDairesi>
    <Donem>${summary.periodMonth}</Donem>
    <MukellefVKN>${comp.vkn}</MukellefVKN>
    <Unvan>${comp.legalName}</Unvan>
    <Eposta>${comp.email || 'muhasebe@aknglobal.com'}</Eposta>
  </GenelBilgiler>
  <TevkifatUygulanmayanIslemler>
    <Islem>
      <TurKodu>101</TurKodu>
      <Aciklama>Yazılım &amp; Dijital Servis Satışları (%20)</Aciklama>
      <Matrah>${domesticMatrah.toFixed(2)}</Matrah>
      <Oran>20</Oran>
      <Vergi>${calculatedVat.toFixed(2)}</Vergi>
    </Islem>
  </TevkifatUygulanmayanIslemler>
  <Istisnalar>
    <Istisna>
      <IstisnaKodu>301</IstisnaKodu>
      <Aciklama>Mal ve Hizmet İhracatı (3065 KDVK md. 11/1-a)</Aciklama>
      <Matrah>${exportMatrah.toFixed(2)}</Matrah>
      <Oran>0</Oran>
      <YuklenilenKDV>0.00</YuklenilenKDV>
    </Istisna>
  </Istisnalar>
  <SonucHesaplari>
    <ToplamHesaplananKDV>${calculatedVat.toFixed(2)}</ToplamHesaplananKDV>
    <BuDonemeAitIndirilecekKDV>${deductibleVat.toFixed(2)}</BuDonemeAitIndirilecekKDV>
    <OdenmesiGerekenKDV>${netVatPayable.toFixed(2)}</OdenmesiGerekenKDV>
    <SonrakiDonemeDevredenKDV>${carriesForwardVat.toFixed(2)}</SonrakiDonemeDevredenKDV>
    <DamgaVergisi>${damgaVergisi.toFixed(2)}</DamgaVergisi>
  </SonucHesaplari>
</Beyanname>`;
}

/**
 * GİB BDP Uyumlu Muhtasar ve Prim Hizmet Beyannamesi (MUHSGK) XML Çıktısı (GVK 94/10-b Esnaf Muafiyeti Stopajı)
 */
export function exportMuhsgkDeclarationXml(summary: TaxReportSummary, companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  const grossWithholdingMatrah = summary.totalNetCommissionsPaidTRY / 0.80;
  const stopajTutari = summary.totalWithholdingTax360;
  const damgaVergisi = 437.80;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Beyanname xmlns="http://ebeyanname.gib.gov.tr/muhsgk" kod="MUHSGK" versiyon="23">
  <GenelBilgiler>
    <VergiDairesi>${comp.taxOffice}</VergiDairesi>
    <Donem>${summary.periodMonth}</Donem>
    <MukellefVKN>${comp.vkn}</MukellefVKN>
    <Unvan>${comp.legalName}</Unvan>
  </GenelBilgiler>
  <TevkifatKodlari>
    <Tevkifat>
      <TurKodu>012</TurKodu>
      <Aciklama>GVK Madde 94/10-b Bireysel Bayi Esnaf Muaflığı Komisyon Stopajı</Aciklama>
      <OdemelerinGayrisafiTutari>${grossWithholdingMatrah.toFixed(2)}</OdemelerinGayrisafiTutari>
      <TevkifatOrani>20</TevkifatOrani>
      <KesilenVergiTutari>${stopajTutari.toFixed(2)}</KesilenVergiTutari>
    </Tevkifat>
  </TevkifatKodlari>
  <Tahakkuk>
    <ToplamTevkifatTutari>${stopajTutari.toFixed(2)}</ToplamTevkifatTutari>
    <DamgaVergisi>${damgaVergisi.toFixed(2)}</DamgaVergisi>
    <NetOdenecekVergi>${(stopajTutari + damgaVergisi).toFixed(2)}</NetOdenecekVergi>
  </Tahakkuk>
</Beyanname>`;
}

/**
 * GİB Geçici Vergi Beyannamesi (3 Aylık Peşin Kurumlar Vergisi & KVK 10/1-ğ %80 İndirimi)
 */
export function exportGeciciVergiDeclarationXml(summary: TaxReportSummary, companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  const grossProfit = summary.totalGrossRevenueTRY * 0.65;
  const exportRatio = summary.totalExportSalesTRY / (summary.totalGrossRevenueTRY || 1);
  const kvkExemption80 = grossProfit * exportRatio * 0.80;
  const taxableProfit = Math.max(0, grossProfit - kvkExemption80);
  const tax25 = taxableProfit * 0.25;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Beyanname xmlns="http://ebeyanname.gib.gov.tr/gecicivergi" kod="GGECICI" versiyon="31">
  <GenelBilgiler>
    <VergiDairesi>${comp.taxOffice}</VergiDairesi>
    <Donem>2026-3Q</Donem>
    <MukellefVKN>${comp.vkn}</MukellefVKN>
    <Unvan>${comp.legalName}</Unvan>
  </GenelBilgiler>
  <GelirTablosu>
    <TicariKazancKar>${grossProfit.toFixed(2)}</TicariKazancKar>
    <KVK_10_1_g_IhracatIstisnasi>${kvkExemption80.toFixed(2)}</KVK_10_1_g_IhracatIstisnasi>
    <GeciciVergiMatrahi>${taxableProfit.toFixed(2)}</GeciciVergiMatrahi>
    <HesaplananGeciciVergi>${tax25.toFixed(2)}</HesaplananGeciciVergi>
  </GelirTablosu>
</Beyanname>`;
}

/**
 * GİB Yıllık Kurumlar Vergisi Beyannamesi (KVK) XML Çıktısı
 */
export function exportKurumlarVergisiDeclarationXml(summary: TaxReportSummary, companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  const netProfit = summary.totalGrossRevenueTRY * 0.45;
  const tax25 = netProfit * 0.25;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Beyanname xmlns="http://ebeyanname.gib.gov.tr/kurumlar" kod="KURUMLAR" versiyon="18">
  <GenelBilgiler>
    <VergiDairesi>${comp.taxOffice}</VergiDairesi>
    <Yil>2026</Yil>
    <MukellefVKN>${comp.vkn}</MukellefVKN>
    <Unvan>${comp.legalName}</Unvan>
  </GenelBilgiler>
  <BilançoVeGelirTablosu>
    <NetDonemKari>${netProfit.toFixed(2)}</NetDonemKari>
    <KurumlarVergisiMatrahi>${netProfit.toFixed(2)}</KurumlarVergisiMatrahi>
    <HesaplananKurumlarVergisi>${tax25.toFixed(2)}</HesaplananKurumlarVergisi>
  </BilançoVeGelirTablosu>
</Beyanname>`;
}

/**
 * GİB Form Ba ve Form Bs XML Çıktısı
 */
export function exportBaBsDeclarationXml(baBsItems: BaBsItem[], companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  return `<?xml version="1.0" encoding="UTF-8"?>
<FormBaBs xmlns="http://ebeyanname.gib.gov.tr/babs" kod="BABS" versiyon="12">
  <GenelBilgiler>
    <MukellefVKN>${comp.vkn}</MukellefVKN>
    <Unvan>${comp.legalName}</Unvan>
    <Donem>2026-10</Donem>
  </GenelBilgiler>
  <Bildirimler>
${baBsItems
  .map(
    (b) => `    <Bildirim>
      <Tur>${b.type}</Tur>
      <KarsiVKN>${b.taxNumber}</KarsiVKN>
      <KarsiUnvan>${b.partnerName}</KarsiUnvan>
      <BelgeSayisi>${b.documentCount}</BelgeSayisi>
      <ToplamTutar>${b.totalExcludingVatTRY.toFixed(2)}</ToplamTutar>
    </Bildirim>`
  )
  .join('\n')}
  </Bildirimler>
</FormBaBs>`;
}

/**
 * GİB e-Defter Yevmiye ve Kebir Beratı XML Paketi
 */
export function exportEDefterBeratXml(entries: LedgerEntry[], companyProfile?: CompanyProfile): string {
  const comp = companyProfile || COMPANY_PROFILE;
  const totalDebit = entries.reduce((s, e) => s + e.debitTRY, 0);
  const totalCredit = entries.reduce((s, e) => s + e.creditTRY, 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<edefter:berat xmlns:edefter="http://www.edefter.gov.tr" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <edefter:Mukellef Bilgi="VKN:${comp.vkn}">${comp.legalName}</edefter:Mukellef>
  <edefter:Donem>2026-10</edefter:Donem>
  <edefter:DefterTuru>YEVMİYE_VE_KEBİR</edefter:DefterTuru>
  <edefter:KayitSayisi>${entries.length}</edefter:KayitSayisi>
  <edefter:ToplamBorc>${totalDebit.toFixed(2)}</edefter:ToplamBorc>
  <edefter:ToplamAlacak>${totalCredit.toFixed(2)}</edefter:ToplamAlacak>
  <edefter:ImzaDurumu>MALI_MUHUR_ONAYLI_SHA256</edefter:ImzaDurumu>
</edefter:berat>`;
}
