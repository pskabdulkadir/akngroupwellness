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
      '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca dijital seans kredisi paketi, vergiler dahil toplam bedel, 3D Sanal POS ödeme ve 14 günlük cayma hakkı şartlarını içerir.',
    clauses: [
      '1. SATICI BİLGİLERİ: AuraBio Frekans & Biyo-Rezonans Teknolojileri A.Ş. Tüm ödemeler yalnızca 256-Bit SSL 3D Secure Sanal POS üzerinden Kredi/Banka Kartı ile tahsil edilir; elden nakit, şahsi IBAN havalesi veya kripto varlık ile ödeme kabul edilmez.',
      '2. KONU HİZMET/PAKET: Seçilen seans kredisi paketinin KDV dahil toplam TL fiyatı ve yüklenecek seans kredisi adedi sipariş özetinde açıkça belirtilmiştir.',
      '3. CAYMA HAKKI (14 GÜN): Alıcı, paket satın alım tarihinden itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma süresi boyunca oluşan komisyonlar 14 Günlük Cayma Koruması (Pending Balance) havuzunda bloke tutulur.',
    ],
  },
  DISTANCE_SALES: {
    title: 'Mesafeli Satış Sözleşmesi',
    version: 'v2.2',
    summary:
      'Alıcı ile AuraBio arasında elektronik ortamda kurulan, Sanal POS kredi kartı ödemesi ve dijital seans kredisi tanımlanmasına ilişkin resmi mesafeli satış sözleşmesidir.',
    clauses: [
      '1. TARAFLAR VE KONU: İşbu sözleşme, Alıcının elektronik ortamda sipariş verdiği AuraBio Seans Kredisi Paketinin satışı, dijital teslimi ve tarafların hak/yükümlülüklerini düzenler.',
      '2. ÖDEME GÜVENLİĞİ: Ödeme işlemleri yalnızca BDDK/TCMB lisanslı Sanal POS altyapısı üzerinden kredi kartı ile gerçekleştirilir. Üçüncü şahıs IBAN hesaplarına veya kripto adreslerine ödeme yapılamaz.',
      '3. İADE VE MAHSUPLAŞMA: 14 günlük yasal cayma süresi içinde iade talep edilmesi halinde kullanılmamış seans kredileri iptal edilir, bekleyen komisyonlar (Clawback) geri çekilir ve kartınıza iade gerçekleştirilir.',
    ],
  },
  KVKK: {
    title: 'Kişisel Verilerin Korunması (KVKK) Aydınlatma ve Açık Rıza Metni',
    version: 'v2.2',
    summary:
      '6698 sayılı KVKK kapsamında kimlik, iletişim, finansal fatura/IBAN eşleşme ve sözleşme onay loglarının (IP ve zaman damgası) işlenmesine ilişkin aydınlatma metnidir.',
    clauses: [
      '1. VERİ SORUMLUSU: 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kimlik, iletişim, sipariş ve banka IBAN ad-soyad eşleşme verileriniz yasal uyum ve faturalandırma amacıyla işlenmektedir.',
      '2. SÖZLEŞME ONAY LOGLARI: Banka ve Ticaret Bakanlığı denetimleri kapsamında onayladığınız sözleşmelerin versiyonu (v2.2), IP adresiniz ve onay zaman damganız user_contract_approvals tablosunda değiştirilemez şekilde kayıt altına alınır.',
      '3. VERİ GÜVENLİĞİ: Kredi kartı bilgileriniz sistemlerimizde kesinlikle saklanmaz; doğrudan PCI-DSS uyumlu Sanal POS ödeme kuruluşu üzerinden şifreli olarak işlenir.',
    ],
  },
  MLM_TERMS: {
    title: 'AuraBio Bağımsız Bayilik (MLM) ve V2.2 Kazanç Planı Kuralları',
    version: 'v2.2',
    summary:
      'Monoline Küresel Tek Hat, %20 Direkt Sponsor, %15 Hızlı Başlangıç (3 Getir Bedavaya Getir), 7 Derinlik + Unilevel Sonsuzluk Primi, 14 Günlük Cayma Blokesi ve Kendi Adına Kayıtlı TR IBAN çekim kurallarını düzenler.',
    clauses: [
      '1. KAZANÇ PLANI (V2.2): Paket satışlarından %20 Direkt Sponsor Primi, ilk 30 günde 3 direkt satışa +%15 Hızlı Başlangıç (Fast-ROI) Nakit İadesi, %25 Monoline 7 Derinlik Primi ve %5 Sistem/Kariyer Havuzu dağıtımı yapılır; ek Unilevel ve diğer bonuslar ayrıca hesaplanır.',
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.user_id,
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
