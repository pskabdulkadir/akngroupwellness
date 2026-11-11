/**
 * Voice Assistant & Speech Engine (STT / TTS, Multi-language, Voice Transaction Guard & Fallback Handlers)
 */

import { Currency, SupportedLanguage, PendingVoiceAction } from '../types/accounting';

export interface VoiceSuggestion {
  id: string;
  label: string;
  commandText: string;
  targetTab: string;
}

export interface SpeechAction {
  type:
    | 'NAVIGATE'
    | 'REQUIRES_CONFIRMATION'
    | 'CONFIRM_PENDING'
    | 'REJECT_PENDING'
    | 'FALLBACK_WITH_SUGGESTIONS'
    | 'START_TOUR'
    | 'PROACTIVE_ALERT'
    | 'QUERY_SUCCESS'
    | 'RUN_AUTOPILOT';
  targetTab?: string;
  pendingAction?: PendingVoiceAction;
  suggestions?: VoiceSuggestion[];
  spokenResponse: string;
  auditActionName?: string;
  targetEntity?: string;
  amount?: number;
  currency?: Currency;
}

// Terim Maskeleme Motoru (Jargon -> Basit Halk Dili)
export const JARGON_DICTIONARY: Record<string, string> = {
  '391 Hesaplanan KDV': 'Müşterilerden tahsil ettiğimiz devlete ait KDV emaneti',
  '191 İndirilecek KDV': 'Şirket masraflarını yaparken ödediğimiz ve devletten düşeceğimiz KDV',
  'Gider Pusulası': 'Şirketi olmayan kişilere ödeme yaparken kullandığımız resmi gider makbuzu',
  'Stopaj': 'Maaş veya komisyon öderken doğrudan devlete aktarmak üzere kestiğimiz yasal vergi payı',
  'Tevkifat': 'Fatura vergisinin bir kısmının devlet tarafından doğrudan alıcıdan kesilmesi',
  'Clawback': 'İade edilen siparişin temsilciye ödenmiş priminin cüzdandan güvenle geri alınması',
  'Matrah': 'Vergisi hesaplanmadan önceki net satış bedeli',
  'SMM (621)': 'Sattığımız ürünlerin depodan çıkışındaki gerçek satın alma maliyeti',
  'VUK 298/A': 'Enflasyon yüzünden eriyen stokların gerçek değerine yükseltilip vergi avantajı sağlanması',
  'AB OSS (One Stop Shop)': 'Avrupa Birliği ülkelerindeki vatandaşlara KDV ödemeden değil, kendi ülkelerinin KDV oranıyla satış yapma sistemi',
  'ÇVÖA': 'Yurtdışındaki ortağımızın hem orada hem burada iki defa vergi ödemesini engelleyen resmi anlaşma',
};

export class SpeechEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: any = null;
  private static isSpeaking: boolean = false;
  private static isMuted: boolean = false;
  private static currentLanguage: SupportedLanguage = 'tr';

  public static isSupported(): { stt: boolean; tts: boolean } {
    const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const hasSTT =
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    return { stt: hasSTT, tts: hasTTS };
  }

  public static setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public static isMuteActive(): boolean {
    return this.isMuted;
  }

  public static setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public static getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Para Birimi & Sayı Yerelleştirme Seslendirme Yardımcısı (Global TTS Localization)
   */
  public static formatCurrencySpoken(
    amount: number,
    currency: Currency,
    lang: SupportedLanguage = this.currentLanguage
  ): string {
    const formattedNum = amount.toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    if (lang === 'en') {
      if (currency === 'USD') return `${formattedNum} US Dollars`;
      if (currency === 'EUR') return `${formattedNum} Euros`;
      return `${formattedNum} Turkish Liras`;
    }

    if (lang === 'de') {
      if (currency === 'USD') return `${formattedNum} US-Dollar`;
      if (currency === 'EUR') return `${formattedNum} Euro`;
      return `${formattedNum} Türkische Lira`;
    }

    // Default: Türkçe
    if (currency === 'USD') return `${formattedNum} Amerikan Doları`;
    if (currency === 'EUR') return `${formattedNum} Euro`;
    return `${formattedNum} Türk Lirası`;
  }

  /**
   * Text-to-Speech (TTS): Metni seçilen dilde doğal insan sesiyle seslendirir
   */
  public static speak(text: string, onEnd?: () => void, langOverride?: SupportedLanguage) {
    if (this.isMuted || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    // Devam eden ses varsa durdur
    this.synth.cancel();

    const targetLang = langOverride || this.currentLanguage;

    // Metni dillerine göre temizle ve para birimi sembollerini seslendirilebilir kelimelere çevir
    let cleanText = text.replace(/[*#_`]/g, '');

    if (targetLang === 'en') {
      cleanText = cleanText
        .replace(/₺/g, ' Turkish Liras ')
        .replace(/\$/g, ' US Dollars ')
        .replace(/€/g, ' Euros ')
        .replace(/%/g, ' Percent ');
    } else if (targetLang === 'de') {
      cleanText = cleanText
        .replace(/₺/g, ' Türkische Lira ')
        .replace(/\$/g, ' US-Dollar ')
        .replace(/€/g, ' Euro ')
        .replace(/%/g, ' Prozent ');
    } else {
      cleanText = cleanText
        .replace(/₺/g, ' Türk Lirası ')
        .replace(/\$/g, ' Amerikan Doları ')
        .replace(/€/g, ' Euro ')
        .replace(/%/g, ' Yüzde ');
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Dil Kodu
    const bcp47 = targetLang === 'en' ? 'en-US' : targetLang === 'de' ? 'de-DE' : 'tr-TR';
    utterance.lang = bcp47;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Uygun sistem sesini bul
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find((v) =>
      targetLang === 'en'
        ? v.lang.startsWith('en')
        : targetLang === 'de'
        ? v.lang.startsWith('de')
        : v.lang.startsWith('tr')
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    this.isSpeaking = true;
    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Speech-to-Text (STT): Mikrofonu dinler ve seçilen dilde metne çevirir
   */
  public static startListening(
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd: () => void,
    langOverride?: SupportedLanguage
  ) {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Tarayıcınız ses tanıma özelliğini desteklemiyor. Metin kutusunu kullanabilirsiniz.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      const targetLang = langOverride || this.currentLanguage;
      rec.lang = targetLang === 'en' ? 'en-US' : targetLang === 'de' ? 'de-DE' : 'tr-TR';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      rec.onerror = (event: any) => {
        onError(event.error || 'Ses algılanamadı.');
      };

      rec.onend = () => {
        onEnd();
      };

      rec.start();
      this.recognition = rec;
    } catch (e: any) {
      onError(e.message || 'Mikrofon başlatılamadı.');
    }
  }

  public static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }
}

/**
 * Sesli Komut ve Güvenlik Kilidi Çözümleme Motoru (Voice Intent & Guard Engine)
 */
export function matchVoiceIntent(
  transcript: string,
  snapshot: any,
  pendingAction?: PendingVoiceAction | null,
  lang: SupportedLanguage = 'tr'
): SpeechAction {
  const raw = transcript.trim();
  const t = raw.toLowerCase();

  // 1. ÇİFT ONAY VE GÜVENLİK KİLİDİ (EĞER BEKLEYEN BİR İŞLEM VARSA)
  if (pendingAction) {
    const isAffirmative =
      t.includes('evet') ||
      t.includes('onaylıyorum') ||
      t.includes('onayla') ||
      t.includes('tamam') ||
      t.includes('yap') ||
      t.includes('kabul') ||
      t.includes('yes') ||
      t.includes('confirm') ||
      t.includes('sure') ||
      t.includes('ja') ||
      t.includes('bestätigen');

    const isNegative =
      t.includes('hayır') ||
      t.includes('iptal') ||
      t.includes('vazgeç') ||
      t.includes('dur') ||
      t.includes('kesme') ||
      t.includes('yapma') ||
      t.includes('no') ||
      t.includes('cancel') ||
      t.includes('nein') ||
      t.includes('abbrechen');

    if (isAffirmative) {
      let successMessage = '';
      if (pendingAction.type === 'ISSUE_INVOICE') {
        successMessage =
          lang === 'en'
            ? `Invoice confirmed. e-Archive invoice for ${pendingAction.details.targetName} with amount ${pendingAction.details.amount} ${pendingAction.details.currency} has been successfully transmitted to Revenue Administration.`
            : lang === 'de'
            ? `Rechnung bestätigt. Die e-Archive Rechnung für ${pendingAction.details.targetName} über ${pendingAction.details.amount} ${pendingAction.details.currency} wurde erfolgreich übermittelt.`
            : `Fatura onaylandı. ${pendingAction.details.targetName} adına ${pendingAction.details.amount} TL tutarındaki e-Arşiv faturanız GİB sistemine başarıyla gönderildi.`;
      } else if (pendingAction.type === 'APPROVE_COMMISSION') {
        successMessage =
          lang === 'en'
            ? `Commission approved. Net payment of ${pendingAction.details.netAmountTRY || pendingAction.details.amount} TL and withholding tax receipt have been processed.`
            : `Komisyon ödemesi onaylandı. ${pendingAction.details.targetName} için net ödeme ve resmi Gider Pusulası kaydı tamamlandı.`;
      } else {
        successMessage =
          lang === 'en'
            ? 'Action successfully confirmed and executed.'
            : 'İşlem sesli onayınız ile başarıyla tamamlandı.';
      }

      return {
        type: 'CONFIRM_PENDING',
        pendingAction,
        spokenResponse: successMessage,
        auditActionName: pendingAction.type,
        targetEntity: pendingAction.details.targetName,
        amount: pendingAction.details.amount,
        currency: pendingAction.details.currency,
      };
    }

    if (isNegative) {
      const cancelMessage =
        lang === 'en'
          ? 'Transaction has been safely cancelled per your instruction.'
          : lang === 'de'
          ? 'Transaktion wurde auf Ihre Anweisung sicher abgebrochen.'
          : 'İşlem sesli talimatınız üzerine güvenli şekilde iptal edildi. Hiçbir kayıt oluşturulmadı.';

      return {
        type: 'REJECT_PENDING',
        pendingAction,
        spokenResponse: cancelMessage,
        auditActionName: `${pendingAction.type}_CANCELLED`,
        targetEntity: pendingAction.details.targetName,
      };
    }
  }

  // 2. KRİTİK İŞLEM ALGILAMA: FATURA KESME (ÇİFT ONAY GEREKTİRİR)
  if (
    t.includes('fatura kes') ||
    t.includes('fatura düzenle') ||
    t.includes('faturası kes') ||
    t.includes('issue invoice') ||
    t.includes('create invoice') ||
    t.includes('rechnung erstellen')
  ) {
    // Alıcı adını ve tutarı çıkarmaya çalış
    let targetName = 'Mehmet Yılmaz';
    let amount = 1000.0;
    let currency: Currency = 'TRY';

    if (t.includes('ahmet')) targetName = 'Ahmet Demir';
    if (t.includes('zeynep')) targetName = 'Zeynep Kaya';
    if (t.includes('can')) targetName = 'Can Öztürk';
    if (t.includes('john') || t.includes('us') || t.includes('dolar') || t.includes('dollar')) {
      targetName = 'John Miller (Global Müşteri)';
      amount = 300.0;
      currency = 'USD';
    }

    // Tutar tespiti
    const amountMatch = t.match(/(\d+[\.,]?\d*)/);
    if (amountMatch) {
      const parsed = parseFloat(amountMatch[1].replace(',', '.'));
      if (parsed > 0) amount = parsed;
    }

    const promptQuestion =
      lang === 'en'
        ? `Do you confirm issuing an e-Archive invoice to ${targetName} for ${amount} ${currency}? Please say 'Yes' or 'Confirm'.`
        : lang === 'de'
        ? `Bestätigen Sie die Erstellung einer Rechnung für ${targetName} über ${amount} ${currency}? Bitte sagen Sie 'Ja' oder 'Bestätigen'.`
        : `${targetName} adına ${amount.toLocaleString('tr-TR')} TL tutarında e-Arşiv fatura kesilmesini onaylıyor musunuz? Lütfen 'Evet' veya 'Onaylıyorum' deyin.`;

    const pending: PendingVoiceAction = {
      id: `act-${Date.now()}`,
      type: 'ISSUE_INVOICE',
      title: 'e-Arşiv Fatura Tanzim Onayı',
      summary: `${targetName} için ${amount} ${currency} tutarında resmi e-Arşiv fatura düzenlenecek.`,
      details: {
        targetName,
        targetTaxNo: '19283746501',
        amount,
        currency,
        amountTRY: currency === 'USD' ? amount * 34.25 : amount,
        vatRate: currency === 'USD' ? 0 : 0.2,
        vatAmountTRY: currency === 'USD' ? 0 : Number((amount * 0.2).toFixed(2)),
        description: 'Sesli Asistan Komutu ile Satış Faturası',
      },
      promptQuestion,
      createdAt: new Date().toISOString(),
    };

    return {
      type: 'REQUIRES_CONFIRMATION',
      pendingAction: pending,
      spokenResponse: promptQuestion,
      targetTab: 'invoices',
      auditActionName: 'ISSUE_INVOICE_REQUESTED',
      targetEntity: targetName,
      amount,
      currency,
    };
  }

  // 3. KRİTİK İŞLEM ALGILAMA: KOMİSYON ÖDEMESİ / GİDER PUSULASI
  if (
    t.includes('komisyon öde') ||
    t.includes('hakediş öde') ||
    t.includes('havale et') ||
    t.includes('transfer yap') ||
    t.includes('pay commission')
  ) {
    const targetName = t.includes('zeynep') ? 'Zeynep Kaya' : 'Ahmet Demir';
    const amount = 6420.0;
    const stopaj = 1284.0;
    const net = 5136.0;

    const promptQuestion =
      lang === 'en'
        ? `Do you confirm paying net commission of ${net} TL to ${targetName} with withholding tax deduction of ${stopaj} TL? Please say 'Yes' or 'Confirm'.`
        : `${targetName} adına ${stopaj} TL stopaj kesintisi yapılarak net ${net} TL komisyon ödenmesini onaylıyor musunuz? Lütfen 'Evet' veya 'Onaylıyorum' deyin.`;

    const pending: PendingVoiceAction = {
      id: `act-${Date.now()}`,
      type: 'APPROVE_COMMISSION',
      title: 'Komisyon & Gider Pusulası Ödeme Onayı',
      summary: `${targetName} için yasal stopaj kesintili net ödeme transferi yapılacak.`,
      details: {
        targetName,
        amount,
        currency: 'TRY',
        amountTRY: amount,
        taxDeductionTRY: stopaj,
        netAmountTRY: net,
        description: 'Bireysel Bayi Komisyon Hakedişi & GVK 94 Stopajı',
      },
      promptQuestion,
      createdAt: new Date().toISOString(),
    };

    return {
      type: 'REQUIRES_CONFIRMATION',
      pendingAction: pending,
      spokenResponse: promptQuestion,
      targetTab: 'commissions',
      auditActionName: 'COMMISSION_PAYMENT_REQUESTED',
      targetEntity: targetName,
      amount,
      currency: 'TRY',
    };
  }

  // 4. BİLGİ SORGULARI (QUERY INTENTS)
  // Ciro / Ne kadar kazandık
  if (
    t.includes('kazandık') ||
    t.includes('ciro') ||
    t.includes('toplam satış') ||
    t.includes('gelir') ||
    t.includes('revenue') ||
    t.includes('sales') ||
    t.includes('umsatz')
  ) {
    const grossTRY = snapshot?.totalGrossRevenueTRY || 46298;
    const exportUSD = snapshot?.totalExportSalesUSD || 498;

    const response =
      lang === 'en'
        ? `Total gross revenue is ${grossTRY.toLocaleString('en-US')} Turkish Liras, including ${exportUSD} US Dollars of foreign service exports.`
        : lang === 'de'
        ? `Der Gesamtumsatz beträgt ${grossTRY.toLocaleString('de-DE')} Türkische Lira, einschließlich ${exportUSD} US-Dollar aus Dienstleistungsexporten.`
        : `Bu ay toplam satış gelirimiz ${grossTRY.toLocaleString('tr-TR')} Türk Lirası seviyesinde. Bunun ${exportUSD} Doları yurt dışı hizmet ihracatından oluşuyor.`;

    return {
      type: 'NAVIGATE',
      targetTab: 'overview',
      spokenResponse: response,
      auditActionName: 'QUERY_REVENUE',
    };
  }

  // 4.1 VERGİ DAİRESİ BAZLI TAHAKKUK VE ÖDEME SORGUSU
  if (
    t.includes('hangi vergi dairesi') ||
    t.includes('vergi dairesine ne kadar') ||
    t.includes('vergi dairesi borcumuz') ||
    t.includes('vergi dairesi') ||
    t.includes('tahakkuk') ||
    t.includes('ivd') ||
    t.includes('vergi borcu') ||
    t.includes('vergi ödeme')
  ) {
    const taxOfficeName = snapshot?.taxOfficeName || snapshot?.taxOffice || 'Büyük Mükellefler V.D. / Kadıköy';
    const totalDue = snapshot?.totalTaxDueTRY || 8121.0;
    const kdvDue = snapshot?.kdvDueTRY || 4300.5;
    const stopajDue = snapshot?.stopajDueTRY || 3820.5;

    const response =
      lang === 'en'
        ? `On behalf of AKN Global Group Ltd., our total tax accrual payable to ${taxOfficeName} this month is ${totalDue.toLocaleString('en-US')} TL. ${kdvDue.toLocaleString('en-US')} TL of this is VAT, and ${stopajDue.toLocaleString('en-US')} TL is distributor withholding tax. Payment deadline is the 26th of the month. You can view payment bank references by clicking the 'Tax Accruals' tab.`
        : `AKN Global Group Ltd. adına ${taxOfficeName} Vergi Dairesi'ne bu ay toplam ${totalDue.toLocaleString('tr-TR')} TL tahakkuk ödememiz var. Bunun ${kdvDue.toLocaleString('tr-TR')} TL'si KDV-1, ${stopajDue.toLocaleString('tr-TR')} TL'si ise bayilerimizin komisyon stopajıdır. Ödeme son günü ayın 26'sıdır. Ekrandaki 'Vergi Dairesi Ödeme Detayı' butonuna tıklayarak banka ödeme referansını görebilirsiniz.`;

    return {
      type: 'NAVIGATE',
      targetTab: 'taxAccrual',
      spokenResponse: response,
      auditActionName: 'QUERY_TAX_OFFICE_ACCRUAL',
    };
  }

  // 4.2 ŞİRKET BİLGİLERİ VE VERGİ YAPILANDIRMASI SESLİ GÜNCELLEME KOMUTLARI
  if (
    t.includes('api anahtar') ||
    t.includes('api key') ||
    t.includes('şirket adres') ||
    t.includes('adresi değiştir') ||
    t.includes('vergi dairesini değiştir') ||
    t.includes('vkn güncelle') ||
    t.includes('profil güncelle') ||
    t.includes('şirket bilgileri') ||
    t.includes('company settings')
  ) {
    let fieldName = 'şirket adresi';
    if (t.includes('api')) {
      fieldName = 'GİB API anahtarı';
    } else if (t.includes('vergi dairesi')) {
      fieldName = 'bağlı bulunulan vergi dairesi';
    } else if (t.includes('vkn')) {
      fieldName = 'Vergi Kimlik Numarası (VKN)';
    }

    const response =
      lang === 'en'
        ? `I have opened the company tax configuration panel and focused on ${fieldName}. You can enter the new details and click 'Save'.`
        : `Şirket ve vergi yapılandırma panelini açtım ve ${fieldName} güncelleme alanına yönlendirdim. Yeni bilgiyi yazıp 'Kaydet'e basabilirsiniz.`;

    return {
      type: 'NAVIGATE',
      targetTab: 'companySettings',
      spokenResponse: response,
      auditActionName: 'NAVIGATE_COMPANY_SETTINGS',
    };
  }

  // 4.3 KDV İADESİ DOSYASI VE YÜKLENİLEN KDV
  if (
    t.includes('kdv iade dosya') ||
    t.includes('yüklenilen kdv') ||
    t.includes('iade dosyası') ||
    t.includes('vat refund file')
  ) {
    const refundEligible = snapshot?.vatRefundEligibleTRY || 8450;
    const response = `Hizmet ihracatı satışlarımız kapsamında devletten talep edebileceğimiz ${refundEligible.toLocaleString('tr-TR')} TL KDV iade dosyasını hazırladım. Vergi Dairesi Tahakkuk ekranından GİB XML formatında indirebilirsiniz.`;
    return {
      type: 'NAVIGATE',
      targetTab: 'taxAccrual',
      spokenResponse: response,
      auditActionName: 'PREPARE_VAT_REFUND_DOSSIER',
    };
  }

  // Vergi / KDV durumu
  if (
    t.includes('kdv') ||
    t.includes('devlete') ||
    t.includes('maliye') ||
    t.includes('tax') ||
    t.includes('steuer')
  ) {
    const netVat = snapshot?.vatPayableNet || 3950;
    const stopaj = snapshot?.totalWithholdingTax360 || 1200;

    const response =
      lang === 'en'
        ? `Your estimated net VAT payable this month is ${netVat.toLocaleString('en-US')} Turkish Liras, plus ${stopaj.toLocaleString('en-US')} Liras in distributor withholding tax.`
        : lang === 'de'
        ? `Ihre geschätzte Mehrwertsteuerschuld für diesen Monat beträgt ${netVat.toLocaleString('de-DE')} Türkische Lira zuzüglich ${stopaj.toLocaleString('de-DE')} Lira Quellensteuer.`
        : `Bu ay sonuna kadar devlete ödenmesi öngörülen net KDV yaklaşık ${netVat.toLocaleString('tr-TR')} Türk Lirasıdır. Ayrıca bayilerden kesilen ${stopaj.toLocaleString('tr-TR')} Lira yasal stopaj vergimiz bulunmaktadır.`;

    return {
      type: 'NAVIGATE',
      targetTab: 'taxReturns',
      spokenResponse: response,
      auditActionName: 'QUERY_TAX',
    };
  }

  // Yurtdışı cirosu
  if (
    t.includes('yurtdışı') ||
    t.includes('ihracat') ||
    t.includes('global') ||
    t.includes('export')
  ) {
    const exportUSD = snapshot?.totalExportSalesUSD || 498;
    const refundEligible = snapshot?.vatRefundEligibleTRY || 8450;

    const response =
      lang === 'en'
        ? `Foreign sales reached ${exportUSD} US Dollars with zero VAT under service export exemption, creating ${refundEligible.toLocaleString('en-US')} Liras of potential VAT refund.`
        : `Yurt dışı hizmet ihracatı ciromuz ${exportUSD} Amerikan Doları seviyesindedir. KDV Kanunu 301. madde kapsamında sıfır KDV uygulanmış olup, yaklaşık ${refundEligible.toLocaleString('tr-TR')} Lira KDV iadesi hakkınız doğmaktadır.`;

    return {
      type: 'NAVIGATE',
      targetTab: 'overview',
      spokenResponse: response,
      auditActionName: 'QUERY_EXPORT_SALES',
    };
  }

  // Son satışlar / Faturalar
  if (
    t.includes('son 5 satış') ||
    t.includes('satışları listele') ||
    t.includes('faturalar') ||
    t.includes('invoices') ||
    t.includes('rechnungen')
  ) {
    const response =
      lang === 'en'
        ? 'Here are your latest e-Invoices and e-Archive documents transmitted to the tax authority.'
        : 'Gelir İdaresi Başkanlığı onaylı en son e-Fatura ve e-Arşiv belgelerinizi ekranda listeledim.';

    return {
      type: 'NAVIGATE',
      targetTab: 'invoices',
      spokenResponse: response,
      auditActionName: 'QUERY_INVOICES',
    };
  }

  // Depo & Stok
  if (
    t.includes('stok') ||
    t.includes('depo') ||
    t.includes('cihaz') ||
    t.includes('envanter') ||
    t.includes('stock') ||
    t.includes('lager')
  ) {
    const response =
      lang === 'en'
        ? 'Opening inventory and physical stock ledger with real-time costs of goods sold.'
        : 'Depomuzdaki BioResonance akıllı cihazları ve takviyelerin güncel adet ve maliyet dökümünü açtım.';

    return {
      type: 'NAVIGATE',
      targetTab: 'inventory',
      spokenResponse: response,
      auditActionName: 'QUERY_STOCK',
    };
  }

  // Rehber tur
  if (
    t.includes('tur') ||
    t.includes('anlat') ||
    t.includes('öğret') ||
    t.includes('tour') ||
    t.includes('guide')
  ) {
    const response =
      lang === 'en'
        ? 'Starting the audio-guided onboarding tour. Welcome!'
        : 'Sistemi adım adım sesli öğrenmeniz için rehber turumuzu başlatıyorum.';

    return {
      type: 'START_TOUR',
      spokenResponse: response,
      auditActionName: 'START_TOUR',
    };
  }

  // OTOPİLOT / GEREKENİ YAP / TEK TIKLA TAMAMLA
  if (
    t.includes('otopilot') ||
    t.includes('otonom') ||
    t.includes('gerekeni yap') ||
    t.includes('tümünü tamamla') ||
    t.includes('otomatik yönet') ||
    t.includes('auto pilot') ||
    t.includes('autopilot')
  ) {
    const response =
      lang === 'en'
        ? 'Activating AKN Autonomous CFO Auto-Pilot now. Emitting pending e-invoices, calculating withholding, syncing TCMB rates, and locking the tax buffer vault.'
        : 'AKN Muhasebe Otopilotunu derhal başlatıyorum. Bekleyen satışların e-faturaları tanzim ediliyor, bayi stopajları ayrıştırılıyor, TCMB kurları işleniyor ve vergi tampon cüzdanınız kilitleniyor.';

    return {
      type: 'RUN_AUTOPILOT',
      spokenResponse: response,
      auditActionName: 'EXECUTE_AUTOPILOT',
    };
  }

  // CFO Yönetici Raporu Sorgusu
  if (
    t.includes('cfo rapor') ||
    t.includes('yönetici rapor') ||
    t.includes('mali müşavir rapor') ||
    t.includes('executive report') ||
    t.includes('günlük özet')
  ) {
    return {
      type: 'NAVIGATE',
      targetTab: 'cfoReport',
      spokenResponse:
        'AKN Global Group Ltd. Günlük Yönetici ve AI CFO Mali Raporunu açtım. Buradan Brüt Ciro, Vergi Karşılıkları Havuzu ve Net Şirket Kârınızı anlık takip edebilirsiniz.',
      auditActionName: 'VIEW_CFO_REPORT',
    };
  }

  // EĞİTİMCİ SESLİ ASİSTAN: KDV İadesi Başvurusu Nasıl Yapılır?
  if (
    t.includes('kdv iade') &&
    (t.includes('nasıl') || t.includes('rehber') || t.includes('yapmalıyım') || t.includes('başvuru'))
  ) {
    return {
      type: 'NAVIGATE',
      targetTab: 'taxReturns',
      spokenResponse:
        'KDV iadesi başvurusu için Vergi ve Beyannameler ekranını açtım. 3 adımda tamamlayabilirsiniz: 1) İstisna Kodu 301 kapsamındaki ihracat faturalarınızı seçin. 2) Sunucu ve lisans harcamalarınızdan doğan Yüklenilen KDV Listesini indirin. 3) GİB İnternet Vergi Dairesi sistemine yükleyip iade talebinizi oluşturun.',
      auditActionName: 'TUTOR_KDV_IADE',
    };
  }

  // EĞİTİMCİ SESLİ ASİSTAN: Avrupa Satışları & OSS Nasıl Kesilir?
  if (
    t.includes('avrupa') ||
    t.includes('oss') ||
    (t.includes('yurtdışı') && t.includes('fatura') && t.includes('nasıl'))
  ) {
    return {
      type: 'NAVIGATE',
      targetTab: 'oss',
      spokenResponse:
        'Avrupa Birliği ülkelerindeki bireysel tüketicilere satış yaparken AB One Stop Shop (OSS) direktifi geçerlidir. Müşterinin ülkesine göre değişen KDV oranı uygulanır ve tek merkezden beyan edilir. Ekranı sizin için Uluslararası OSS modülüne yönlendirdim.',
      auditActionName: 'TUTOR_OSS_SALES',
    };
  }

  // EĞİTİMCİ SESLİ ASİSTAN: Stopaj ve Gider Pusulası Nedir?
  if (t.includes('stopaj nedir') || t.includes('gider pusulası nedir')) {
    return {
      type: 'NAVIGATE',
      targetTab: 'commissions',
      spokenResponse:
        "Stopaj, AKN Global Group Ltd.'nin şirketi olmayan bireysel bayilere yaptığı komisyon ödemelerinden devlet adına kestiği yüzde 20'lik gelir vergisidir. Bu parayı bayiye değil doğrudan devlete yatırıyoruz ve bayiye net hakediş ödüyoruz. Ekranda resmi Gider Pusulası makbuzlarını inceleyebilirsiniz.",
      auditActionName: 'TUTOR_STOPAJ',
    };
  }

  // 5. ANLAŞILAMAYAN SES / GÜRÜLTÜ FALLBACK HANDLER (AKILLI NİYET ÇÖZÜMLEME)
  // Kullanıcıyı asla hata mesajıyla yalnız bırakmaz, alternatif 3 seçenek sunar!
  const fallbackSpoken =
    lang === 'en'
      ? "I couldn't quite catch that. Would you like to: 1) Check sales report, 2) Issue a new invoice, or 3) Check tax liability? Please select an option."
      : lang === 'de'
      ? 'Ich konnte das leider nicht genau verstehen. Möchten Sie: 1) Verkaufsbericht ansehen, 2) Neue Rechnung erstellen oder 3) Steuerstatus prüfen? Bitte wählen Sie eine Option.'
      : 'Söylediğinizi tam olarak algılayamadım. Şunları yapmak istemiş olabilir misiniz: 1) Satış raporuna bakmak, 2) Yeni fatura kesmek, 3) Vergi durumunu öğrenmek. Hangisini tercih edersiniz?';

  const suggestions: VoiceSuggestion[] = [
    {
      id: 'sug-1',
      label: lang === 'en' ? 'Check Sales Report' : 'Satış Raporuna Bak',
      commandText: 'Bu ay toplam ne kadar kazandık?',
      targetTab: 'overview',
    },
    {
      id: 'sug-2',
      label: lang === 'en' ? 'Issue New Invoice' : 'Yeni Fatura Kes',
      commandText: "Mehmet Yılmaz'a 1.000 TL fatura kes",
      targetTab: 'simulator',
    },
    {
      id: 'sug-3',
      label: lang === 'en' ? 'Check Tax Liability' : 'Vergi Durumunu Öğren',
      commandText: 'Bu ay devlete ne kadar vergi ödeyeceğim?',
      targetTab: 'taxReturns',
    },
  ];

  return {
    type: 'FALLBACK_WITH_SUGGESTIONS',
    spokenResponse: fallbackSpoken,
    suggestions,
    auditActionName: 'FALLBACK_UNKNOWN_COMMAND',
  };
}

// 6. EĞİTİMCİ SESLİ ASİSTAN — SAYFA VE MENÜ REHBERİ (INTERACTIVE TUTORIALS)
export const TAB_TUTORIAL_EXPLANATIONS: Record<string, { title: string; speech: string }> = {
  cfoReport: {
    title: 'AKN Günlük Yönetici ve AI CFO Raporu',
    speech:
      'Şu an AKN Global Group Ltd. AI CFO Yönetici Raporu ekranındasınız. Bu ekran, şirketin tüm brüt cirosunu, devlete ait ayrıştırılmış vergi karşılıklarını ve şirketinize kalan net saf kârı anlık bir mali müşavir derinliğinde özetler.',
  },
  overview: {
    title: 'Genel Mali Bakış & Hasılat Paneli',
    speech:
      'Şu an AKN Global Group Ltd. Genel Mali Bakış ekranındasınız. Tüm yurt içi satışlarınızı, 3x USD ihracatlarınızı, hesaplanan KDV yükünüzü ve anlık TCMB döviz kurlarını tek ekranda izleyebilirsiniz.',
  },
  invoices: {
    title: 'e-Fatura & e-Arşiv Yönetimi (GİB API)',
    speech:
      'Şu an e-Fatura ve e-Arşiv Yönetim ekranındasınız. Kredi kartı ödemesi tamamlanan müşterilerin faturaları burada GİB onaylı olarak listelenir. Tek tıkla UBL-TR XML formatında indirebilir veya yazdırabilirsiniz.',
  },
  simulator: {
    title: 'Canlı Satış & 3D Secure Fatura Tanzimi',
    speech:
      'Şu an Canlı Satış ve 3D Secure Fatura Simülatöründesiniz. İster Türkiye içi ister yurt dışı müşteriye tek tuşla paket satışı yapabilir, KDV ayrıştırmasını ve TCMB kur çevrimini anlık test edebilirsiniz.',
  },
  commissions: {
    title: 'Bayi Komisyon & Stopaj Havuzu (GVK 94)',
    speech:
      'Şu an AKN Global Group Ltd. Bayi Komisyon ve Stopaj Havuzundasınız. Bireysel bayilerinizin hakedişlerinden yüzde 20 yasal vergi stopajını otomatik kesip resmi e-Gider Pusulası düzenliyoruz.',
  },
  taxReturns: {
    title: 'Vergi ve Beyannameler Simülasyonu',
    speech:
      'Şu an Vergi ve Beyannameler Simülasyonu ekranındasınız. Ay sonunu beklemeden devlete ödenecek tahmini KDV-1, Muhtasar Stopaj ve Geçici Vergi yükünüzü kuruşu kuruşuna simüle edebilirsiniz.',
  },
  clawback: {
    title: 'İade & Prim Geri Alma (Clawback Motoru)',
    speech:
      'Şu an İade ve Prim Geri Alma ekranındasınız. İptal veya iade edilen siparişlerde üst kollara dağıtılmış primler cüzdanlardan otomatik geri çekilir ve e-Arşiv İade Faturası düzenlenir.',
  },
  inventory: {
    title: 'Envanter, Stok & SMM (153/621)',
    speech:
      'Şu an Envanter ve Stok Muhasebesi ekranındasınız. Akıllı biorezonans cihazları ve takviyelerin 153 Ticari Mallar ve 621 Satılan Malın Maliyeti hesaplarını takip edebilir, VUK enflasyon düzeltmesi uygulayabilirsiniz.',
  },
  oss: {
    title: 'Uluslararası & AB One Stop Shop (OSS)',
    speech:
      'Şu an Uluslararası ve AB One Stop Shop Vergi modülündesiniz. Avrupa Birliğindeki tüketicilere yapılan satışlarda ülkeye göre değişen yerel KDV oranları ve çifte vergilendirme anlaşmaları burada yönetilir.',
  },
  banking: {
    title: 'Açık Bankacılık & Otomatik Mutabakat (102)',
    speech:
      'Şu an Açık Bankacılık ekranındasınız. Garanti, Akbank ve İş Bankası hesap hareketleriniz sistemle otomatik mutabakat kurar ve SWIFT kur farkları muhasebeleştirilir.',
  },
  expenses: {
    title: 'Şirket Giderleri & Personel Bordro (770)',
    speech:
      'Şu an Şirket Giderleri ve Personel Bordro modülündesiniz. AWS, ofis ve operasyon giderlerinizi 770 Genel Yönetim Gideri olarak işleyebilir, indirilecek KDV\'den mahsup edebilirsiniz.',
  },
  export: {
    title: 'Luca, Zirve & e-Defter Dışa Aktarım',
    speech:
      'Şu an Luca, Zirve ve GİB e-Defter Dışa Aktarım ekranındasınız. Yevmiye defteri kayıtlarınızı resmi muhasebecinizin programına tek tıkla XML ve CSV olarak aktarabilirsiniz.',
  },
  aiAdvisor: {
    title: 'AI Sanal Mali Müşavir Robotu (Gemini 3.8)',
    speech:
      'Şu an Gemini destekli Sanal Mali Müşavir Robotu ekranındasınız. Şirketinizin vergi optimizasyonu ve KDV iadesi hakları için anlık stratejik tavsiyeler alabilirsiniz.',
  },
  integrator: {
    title: 'GİB Özel Entegratör API Ayarları',
    speech:
      'Şu an GİB Özel Entegratör API Ayarları ekranındasınız. Logo, Uyumsoft, Paraşüt ve NetGSM e-fatura servis bağlantılarını ve gönderici etiketlerini buradan yönetebilirsiniz.',
  },
};

