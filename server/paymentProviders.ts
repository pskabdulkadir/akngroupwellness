import { randomBytes } from 'crypto';

export const SANDBOX_SMS_CODE = process.env.SANDBOX_3DS_SMS_CODE || '123456';
const PENDING_TTL_MS = 10 * 60 * 1000;

export const SANDBOX_TEST_CARDS = {
  SUCCESS: { number: '4543 4500 0000 0001', label: 'Başarılı İşlem', code: null },
  INSUFFICIENT_FUNDS: { number: '4543 4500 0000 0002', label: 'Bakiye Yetersiz', code: '51' },
  LIMIT_EXCEEDED: { number: '4543 4500 0000 0003', label: 'Limit Yetersiz', code: '61' },
  THREE_D_FAILED: { number: '4543 4500 0000 0004', label: '3D Hatası', code: '3D-FAIL' },
} as const;

export type SandboxScenario = keyof typeof SANDBOX_TEST_CARDS;

export interface CardInput {
  cardHolder?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export interface PaymentInitiateInput {
  merchantOid: string;
  orderId: string;
  userId: string;
  amount: number;
  card: CardInput;
}

export interface PaymentInitiateResult {
  merchantOid: string;
  requires3ds: true;
  maskedCard: string;
  provider: string;
}

export interface PaymentCompleteResult {
  success: boolean;
  transactionId: string;
  merchantOid: string;
  orderId: string;
  userId: string;
  amount: number;
  maskedCard: string;
  provider: string;
  errorCode: string | null;
  errorMessage: string | null;
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export interface IPaymentProvider {
  readonly name: string;
  initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult>;
  complete3ds(merchantOid: string, smsCode: string, userId: string): Promise<PaymentCompleteResult>;
}

interface PendingPayment {
  amount: number;
  orderId: string;
  userId: string;
  scenario: SandboxScenario;
  maskedCard: string;
  expiresAt: number;
}

function maskCard(digits: string): string {
  return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`;
}

export class SandboxTestPosProvider implements IPaymentProvider {
  readonly name = 'SANDBOX_TEST_POS';
  private pending = new Map<string, PendingPayment>();

  async initiate(input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    const card = input.card || {};
    const digits = String(card.cardNumber || '').replace(/\D/g, '');
    if (digits.length !== 16) {
      throw new PaymentProviderError('Kart numarası 16 haneli olmalıdır.', 'INVALID_CARD_NUMBER');
    }
    if (!card.cardHolder || card.cardHolder.trim().length < 3) {
      throw new PaymentProviderError('Kart üzerindeki ad soyad zorunludur.', 'INVALID_CARD_HOLDER');
    }
    if (!card.cardExpiry || !/^((0[1-9])|(1[0-2]))\/\d{2}$/.test(card.cardExpiry)) {
      throw new PaymentProviderError('Son kullanma tarihi AA/YY formatında olmalıdır.', 'INVALID_CARD_EXPIRY');
    }
    if (!card.cardCvv || !/^\d{3,4}$/.test(card.cardCvv.trim())) {
      throw new PaymentProviderError('CVV en az 3 haneli olmalıdır.', 'INVALID_CARD_CVV');
    }

    const scenario = (Object.keys(SANDBOX_TEST_CARDS) as SandboxScenario[]).find(
      (key) => SANDBOX_TEST_CARDS[key].number.replace(/\D/g, '') === digits
    );
    if (!scenario) {
      throw new PaymentProviderError(
        'Sandbox ortamında yalnızca test kartları kabul edilir.',
        'SANDBOX_CARD_NOT_ALLOWED'
      );
    }

    if (!input.userId || !input.orderId || !Number.isFinite(input.amount) || input.amount <= 0) {
      throw new PaymentProviderError('Sipariş, kullanıcı ve pozitif tutar bilgileri zorunludur.', 'INVALID_PAYMENT_CONTEXT');
    }

    const maskedCard = maskCard(digits);
    this.pending.set(input.merchantOid, {
      amount: input.amount,
      orderId: input.orderId,
      userId: input.userId,
      scenario,
      maskedCard,
      expiresAt: Date.now() + PENDING_TTL_MS,
    });

    return {
      merchantOid: input.merchantOid,
      requires3ds: true,
      maskedCard,
      provider: this.name,
    };
  }

  async complete3ds(merchantOid: string, smsCode: string, userId: string): Promise<PaymentCompleteResult> {
    const pending = this.pending.get(merchantOid);
    if (!pending || pending.expiresAt < Date.now()) {
      this.pending.delete(merchantOid);
      throw new PaymentProviderError('Ödeme oturumu bulunamadı veya süresi doldu.', 'PAYMENT_SESSION_NOT_FOUND');
    }

    if (pending.userId !== userId) {
      throw new PaymentProviderError('Ödeme oturumu bu kullanıcıya ait değil.', 'PAYMENT_USER_MISMATCH');
    }

    if (String(smsCode || '').trim() !== SANDBOX_SMS_CODE) {
      throw new PaymentProviderError('SMS onay kodu hatalı.', '3D-SMS-INVALID');
    }

    this.pending.delete(merchantOid);
    const base = {
      merchantOid,
      orderId: pending.orderId,
      userId: pending.userId,
      amount: pending.amount,
      maskedCard: pending.maskedCard,
      provider: this.name,
      transactionId: `SIM-POS-${Date.now()}-${randomBytes(6).toString('hex').toUpperCase()}`,
    };

    const failures: Record<Exclude<SandboxScenario, 'SUCCESS'>, string> = {
      INSUFFICIENT_FUNDS: 'Kart bakiyesi yetersiz.',
      LIMIT_EXCEEDED: 'Kart limiti yetersiz.',
      THREE_D_FAILED: '3D Secure doğrulaması başarısız oldu.',
    };

    if (pending.scenario === 'SUCCESS') {
      return { ...base, success: true, errorCode: null, errorMessage: null };
    }

    const errorCode = SANDBOX_TEST_CARDS[pending.scenario].code;
    return {
      ...base,
      success: false,
      errorCode,
      errorMessage: failures[pending.scenario],
    };
  }
}

export function createPaymentProvider(name = process.env.PAYMENT_PROVIDER || 'SANDBOX_TEST_POS'): IPaymentProvider {
  if (name === 'SANDBOX_TEST_POS') {
    return sandboxProvider;
  }
  throw new PaymentProviderError(`PAYMENT_PROVIDER=${name} henüz bağlanmadı.`, 'PROVIDER_NOT_CONNECTED');
}

const sandboxProvider = new SandboxTestPosProvider();
