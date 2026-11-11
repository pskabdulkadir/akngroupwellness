import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SANDBOX_SMS_CODE,
  SANDBOX_TEST_CARDS,
  SandboxTestPosProvider,
} from './paymentProviders';

let testSequence = 0;

const CARD_DETAILS = {
  cardHolder: 'TEST KULLANICI',
  cardExpiry: '12/28',
  cardCvv: '123',
};

async function initiate(cardNumber: string, merchantOid = `TEST-${++testSequence}`) {
  const provider = new SandboxTestPosProvider();
  const result = await provider.initiate({
    merchantOid,
    orderId: `ORDER-${merchantOid}`,
    userId: 'test-user',
    amount: 5000,
    card: { ...CARD_DETAILS, cardNumber },
  });
  return { provider, result };
}

test('başarılı kart 3DS sonrası onaylı transaction üretir', async () => {
  const { provider, result } = await initiate(SANDBOX_TEST_CARDS.SUCCESS.number);
  const completed = await provider.complete3ds(result.merchantOid, SANDBOX_SMS_CODE, 'test-user');

  assert.equal(completed.success, true);
  assert.equal(completed.amount, 5000);
  assert.equal(completed.userId, 'test-user');
  assert.equal(completed.orderId, `ORDER-${result.merchantOid}`);
  assert.match(completed.transactionId, /^SIM-POS-/);
});

test('bakiye ve limit yetersizliği ayrı hata kodları döndürür', async () => {
  for (const [scenario, code] of [
    [SANDBOX_TEST_CARDS.INSUFFICIENT_FUNDS, '51'],
    [SANDBOX_TEST_CARDS.LIMIT_EXCEEDED, '61'],
  ] as const) {
    const { provider, result } = await initiate(scenario.number);
    const completed = await provider.complete3ds(result.merchantOid, SANDBOX_SMS_CODE, 'test-user');
    assert.equal(completed.success, false);
    assert.equal(completed.errorCode, code);
  }
});

test('3D hata kartı reddedilir ve yanlış SMS kodu tekrar denenebilir', async () => {
  const { provider, result } = await initiate(SANDBOX_TEST_CARDS.THREE_D_FAILED.number);
  await assert.rejects(
    provider.complete3ds(result.merchantOid, '000000', 'test-user'),
    { code: '3D-SMS-INVALID' }
  );
  const completed = await provider.complete3ds(result.merchantOid, SANDBOX_SMS_CODE, 'test-user');
  assert.equal(completed.success, false);
  assert.equal(completed.errorCode, '3D-FAIL');
});

test('3DS oturumu farklı kullanıcı tarafından tamamlanamaz', async () => {
  const { provider, result } = await initiate(SANDBOX_TEST_CARDS.SUCCESS.number);
  await assert.rejects(
    provider.complete3ds(result.merchantOid, SANDBOX_SMS_CODE, 'different-user'),
    { code: 'PAYMENT_USER_MISMATCH' }
  );
});

test('yalnızca sandbox test kartları kabul edilir', async () => {
  const provider = new SandboxTestPosProvider();
  await assert.rejects(
    provider.initiate({
      merchantOid: 'TEST-INVALID',
      orderId: 'ORDER-INVALID',
      userId: 'test-user',
      amount: 5000,
      card: { ...CARD_DETAILS, cardNumber: '4111 1111 1111 1111' },
    }),
    { code: 'SANDBOX_CARD_NOT_ALLOWED' }
  );
});
