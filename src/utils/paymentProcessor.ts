import { COMPANY_IDENTITY } from '../config/companyIdentity';

export interface CreditCardDetails {
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export interface PosChargeResult {
  success: boolean;
  transaction_id: string;
  merchant_oid: string;
  provider: string;
  charged_amount: number;
  order_id: string;
  masked_card: string;
  timestamp: string;
}

export const SANDBOX_TEST_CARDS = {
  SUCCESS: { label: 'Başarılı İşlem', number: '4543 4500 0000 0001' },
  INSUFFICIENT_FUNDS: { label: 'Bakiye Yetersiz', number: '4543 4500 0000 0002' },
  LIMIT_EXCEEDED: { label: 'Limit Yetersiz', number: '4543 4500 0000 0003' },
  THREE_D_FAILED: { label: '3D Hatası', number: '4543 4500 0000 0004' },
} as const;

export const SANDBOX_TEST_CARD_EXPIRY = '12/28';
export const SANDBOX_TEST_CARD_CVV = '123';
export const SANDBOX_SMS_CODE = '123456';

export const VPOS_3DS_REQUEST_EVENT = 'vpos:3ds-request';

export interface Vpos3dsRequestDetail {
  merchantOid: string;
  amount: number;
  maskedCard: string;
  errorMessage?: string;
  resolve: (smsCode: string | null) => void;
}

function request3dsSmsCode(
  params: Omit<Vpos3dsRequestDetail, 'resolve'>
): Promise<string | null> {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<Vpos3dsRequestDetail>(VPOS_3DS_REQUEST_EVENT, {
        detail: { ...params, resolve },
      })
    );
  });
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export type ContractType =
  | 'DISTANCE_SALES'
  | 'PRE_INFORMATION'
  | 'MLM_TERMS'
  | 'KVKK';

export interface UserContractApprovalRecord {
  id: number;
  user_id: string;
  user_name?: string;
  order_id?: string;
  contract_type: ContractType;
  version: string;
  order_amount?: number;
  product_summary?: string;
  ip_address: string;
  approved_at: string;
}

/**
 * Sanal POS istemci adaptörü: sunucudaki aktif IPaymentProvider'a
 * initiate → 3D Secure SMS onayı → callback akışıyla bağlanır.
 */
export interface PosPackageItem {
  package_id: string;
  quantity: number;
}

export async function fetchRegionalPackagePrices(
  userId: string,
  packageIds: string[]
): Promise<Record<string, number>> {
  const params = new URLSearchParams({ user_id: userId, package_ids: packageIds.join(',') });
  const res = await fetch(`/api/v1/payments/regional-prices?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Paket fiyatları sunucudan alınamadı.');
  }
  return data.prices as Record<string, number>;
}

export class PaymentProcessor {
  async chargeCreditCard(
    cardDetails: CreditCardDetails,
    amount: number,
    orderId: string,
    userId: string,
    packageItems: PosPackageItem[]
  ): Promise<PosChargeResult> {
    const cleanDigits = (cardDetails.cardNumber || '').replace(/\D/g, '');
    if (cleanDigits.length < 12) {
      throw new Error('Geçersiz kredi kartı numarası. Lütfen 16 haneli kart numaranızı kontrol edin.');
    }
    if (!cardDetails.cardHolder || cardDetails.cardHolder.trim().length < 3) {
      throw new Error('Kart üzerindeki ad soyad alanı zorunludur.');
    }
    if (!cardDetails.cardExpiry || !cardDetails.cardExpiry.includes('/')) {
      throw new Error('Son kullanma tarihi AA/YY formatında olmalıdır.');
    }
    if (!cardDetails.cardCvv || cardDetails.cardCvv.trim().length < 3) {
      throw new Error('CVV güvenlik kodu en az 3 haneli olmalıdır.');
    }

    const init = await postJson('/api/v1/payments/vpos/initiate', {
      user_id: userId,
      order_id: orderId,
      package_items: packageItems,
      amount,
      card_details: cardDetails,
    });
    if (!init.ok || init.data.status !== 'success') {
      throw new Error(init.data.message || 'Sanal POS ödemesi başlatılamadı.');
    }

    const merchantOid: string = init.data.merchant_oid;
    const maskedCard: string = init.data.masked_card;
    let errorMessage: string | undefined;

    for (;;) {
      const smsCode = await request3dsSmsCode({ merchantOid, amount, maskedCard, errorMessage });
      if (smsCode === null) {
        throw new Error('3D Secure doğrulaması iptal edildi.');
      }

      const callback = await postJson('/api/v1/payments/vpos/callback', {
        merchant_oid: merchantOid,
        user_id: userId,
        sms_code: smsCode,
      });
      if (callback.ok && callback.data.status === 'success') {
        if (
          callback.data.merchant_oid !== merchantOid ||
          callback.data.order_id !== orderId ||
          callback.data.user_id !== userId ||
          Number(callback.data.charged_amount) !== amount
        ) {
          throw new Error('Sanal POS yanıtı sipariş bilgileriyle eşleşmiyor.');
        }
        return {
          success: true,
          transaction_id: callback.data.transaction_id,
          merchant_oid: merchantOid,
          provider: callback.data.provider,
          charged_amount: callback.data.charged_amount,
          order_id: callback.data.order_id,
          masked_card: callback.data.masked_card,
          timestamp: callback.data.timestamp,
        };
      }
      if (callback.data.error_code === '3D-SMS-INVALID') {
        errorMessage = callback.data.message;
        continue;
      }
      throw new Error(callback.data.message || 'Sanal POS ödemesi reddedildi.');
    }
  }
}

export const defaultPaymentProcessor = new PaymentProcessor();

export const LEGAL_CONTRACT_TEXTS: Record<
  ContractType,
  { title: string; version: string; summary: string; clauses: string[] }
> = {
  PRE_INFORMATION: {
    title: 'Ön Bilgilendirme Formu',
    version: 'v2.2',
    summary:
      'Dijital paket, toplam bedel ve sunulan ödeme yöntemine ilişkin ön bilgilendirme metnidir. Cayma hakkı, işlem koşulları ve yürürlükteki mevzuata göre değerlendirilir.',
    clauses: [
      `1. SATICI BİLGİLERİ: ${COMPANY_IDENTITY.legalName}; T.C. Kimlik No: ${COMPANY_IDENTITY.taxNumber}; adres: ${COMPANY_IDENTITY.address}; telefon: ${COMPANY_IDENTITY.internationalPhone}; web: ${COMPANY_IDENTITY.website}. Ödeme seçenekleri sipariş ve ödeme ekranında gösterilir.`,
      '2. KONU HİZMET/PAKET: Seçilen seans kredisi paketinin KDV dahil toplam TL fiyatı ve yüklenecek seans kredisi adedi sipariş özetinde açıkça belirtilmiştir.',
      '3. CAYMA HAKKI: Cayma hakkı ve uygulanabilecek istisnalar, siparişin niteliği ve yürürlükteki mevzuat çerçevesinde belirlenir. Sistem içi komisyon bekleme kuralları bu yasal değerlendirmeden ayrıdır.',
    ],
  },
  DISTANCE_SALES: {
    title: 'Mesafeli Satış Sözleşmesi',
    version: 'v2.2',
    summary:
      'Alıcı ile satıcı arasında dijital hizmet siparişine ilişkin sözleşme metnidir; yürürlüğe alınmadan önce hukuk danışmanı tarafından doğrulanmalıdır.',
    clauses: [
      `1. TARAFLAR VE KONU: Satıcı ${COMPANY_IDENTITY.legalName} (T.C. Kimlik No: ${COMPANY_IDENTITY.taxNumber}, ${COMPANY_IDENTITY.address}, ${COMPANY_IDENTITY.internationalPhone}, ${COMPANY_IDENTITY.website}); işbu sözleşme elektronik ortamda sipariş verilen dijital hizmetin teslimini ve tarafların hak/yükümlülüklerini düzenler.`,
      '2. ÖDEME: Kullanılabilir ödeme yöntemi ödeme adımında gösterilir. Ödeme sağlayıcısının lisans ve güvenlik bilgileri işlemden önce ayrıca doğrulanmalıdır.',
      '3. İPTAL VE İADE: İptal ve iade talepleri yürürlükteki tüketici mevzuatı ile siparişin teslim ve kullanım durumuna göre değerlendirilir. Kanuni haklar bu metinle sınırlandırılmaz.',
    ],
  },
  KVKK: {
    title: 'Kişisel Verilerin Korunması (KVKK) Aydınlatma ve Açık Rıza Metni',
    version: 'v2.2',
    summary:
      '6698 sayılı KVKK kapsamında kimlik, iletişim, finansal fatura/IBAN eşleşme ve sözleşme onay loglarının (IP ve zaman damgası) işlenmesine ilişkin aydınlatma metnidir.',
    clauses: [
      `1. VERİ SORUMLUSU: ${COMPANY_IDENTITY.legalName}, ${COMPANY_IDENTITY.address}; iletişim: ${COMPANY_IDENTITY.internationalPhone}, ${COMPANY_IDENTITY.contactEmail}. Kimlik, iletişim, sipariş ve ödeme verileri hizmetin sunulması ve mevzuattan doğan yükümlülükler kapsamında işlenir.`,
      '2. SÖZLEŞME ONAY KAYDI: Onay durumu ve işlemle ilişkilendirilen kayıtlar, sistemin mevcut saklama ve erişim yapılandırmasına tabidir.',
      '3. ÖDEME VERİLERİ: Kart verilerinin işlenmesi kullanılan ödeme sağlayıcısının altyapısına ve koşullarına bağlıdır; bu metin kart verilerinin saklanmadığını tek başına doğrulamaz.',
    ],
  },
  MLM_TERMS: {
    title: 'AuraBio Bağımsız Bayilik (MLM) ve V2.2 Kazanç Planı Kuralları',
    version: 'v2.2',
    summary:
      'Monoline Küresel Tek Hat, %20 Direkt Sponsor, 7 Derinlik, kariyer eşleşme bonusu, 14 Günlük Cayma Blokesi ve Kendi Adına Kayıtlı TR IBAN çekim kurallarını düzenler.',
    clauses: [
      '1. KAZANÇ PLANI (V2.2): Paket satışlarından %20 Direkt Sponsor Primi, %25 Monoline 7 Derinlik Primi ve %5 Sistem/Kariyer Havuzu dağıtımı yapılır; kariyer seviyesine bağlı eşleşme bonusları ve diğer primler yalnızca ilan edilen program kuralları kapsamında hesaplanır.',
      '2. 14 GÜNLÜK CAYMA KORUMASI: Tüketici Kanunu gereği kazanılan tüm komisyonlar 14 gün boyunca "Bekleyen Bakiye (Pending Balance)" statüsünde tutulur ve 14. gün sonunda otomatik olarak "Çekilebilir Net Bakiye"ye aktarılır.',
      '3. ESNEK AKTİFLİK ("VEYA" KURALI): Bayinin komisyon çekebilmesi için her ay paket satın alma zorunluluğu yoktur; ilgili ay en az 1 yeni aktif üye/bayi kaydetmesi VEYA aylık kişisel aktiflik paketini yenilemesi yeterlidir.',
      '4. BANKA UYUMU & İSİM EŞLEŞMESİ (CROSS-CHECK): Komisyon ödemeleri yalnızca bayinin sistemde kayıtlı kendi Ad-Soyadı ile birebir eşleşen resmi TR IBAN banka hesabına Havale/EFT ile ödenir. Farklı bir isme veya kripto cüzdanlara ödeme kesinlikle yapılmaz.',
    ],
  },
};

export async function recordUserContractApprovals(params: {
  user_id: string;
  user_name?: string;
  order_id?: string;
  version?: string;
  contracts?: ContractType[];
  order_amount?: number;
  product_summary?: string;
  authorizationToken: string;
}): Promise<UserContractApprovalRecord[]> {
  const version = params.version || 'v2.2';
  const contracts: ContractType[] = params.contracts || [
    'PRE_INFORMATION',
    'DISTANCE_SALES',
    'KVKK',
    'MLM_TERMS',
  ];

  try {
    const res = await fetch('/api/v1/compliance/contract-approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.authorizationToken}` },
      body: JSON.stringify({
        user_id: params.user_id,
        consent_id: crypto.randomUUID(),
        user_name: params.user_name,
        order_id: params.order_id,
        order_amount: params.order_amount,
        product_summary: params.product_summary,
        version,
        contracts,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.approvals || [];
    }
  } catch (err) {
    console.debug('recordUserContractApprovals fallback notice:', err);
  }
  return [];
}
